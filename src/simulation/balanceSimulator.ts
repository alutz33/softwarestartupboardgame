/**
 * Balance Simulation Engine for Ship It! Board Game
 * Pure functions - no Zustand, no browser APIs.
 * Simulates thousands of games to validate leader/funding balance.
 */

import { PERSONA_CARDS } from '../data/personaCards';
import { FUNDING_OPTIONS } from '../data/corporations';
import { getSpecialtyBonus } from '../data/engineers';
import type {
  PersonaCard,
  PersonaId,
  FundingType,
  LeaderPassiveId,
  ProductType,
  EngineerLevel,
} from '../types';
import { PRODUCTION_CONSTANTS, getTechDebtLevel, getAiDebt } from '../types';

// ============================================
// SIMULATION TYPES
// ============================================

export interface SimConfig {
  playerCount: number;
  gamesPerCombo: number;
  verbose?: boolean;
}

export interface LeaderFundingStats {
  personaId: string;
  personaName: string;
  fundingType: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgScore: number;
  avgMau: number;
  avgRevenue: number;
  avgRating: number;
  avgTechDebt: number;
  totalScore: number;
  totalMau: number;
  totalRevenue: number;
  totalRating: number;
  totalTechDebt: number;
}

interface SimPlayer {
  id: number;
  leader: PersonaCard;
  fundingType: FundingType;
  productType: ProductType;
  passiveId: LeaderPassiveId;
  money: number;
  serverCapacity: number;
  aiCapacity: number;
  techDebt: number;
  mau: number;
  revenue: number;
  rating: number;
  mauProduction: number;
  revenueProduction: number;
  engineers: SimEngineer[];
  equityRetained: number;
}

interface SimEngineer {
  level: EngineerLevel;
  power: number;
  specialty: string | undefined;
}

type ActionType =
  | 'develop-features'
  | 'optimize-code'
  | 'pay-down-debt'
  | 'marketing'
  | 'monetization'
  | 'upgrade-servers'
  | 'research-ai';

const SPECIALTIES = ['frontend', 'backend', 'fullstack', 'devops', 'ai'];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDebtPenalty(debt: number): number {
  const level = getTechDebtLevel(debt);
  return level.powerPenalty; // negative number
}

// ============================================
// SIMULATION SETUP
// ============================================

function createSimPlayer(
  id: number,
  leader: PersonaCard,
  fundingType: FundingType
): SimPlayer {
  const funding = FUNDING_OPTIONS.find(f => f.id === fundingType)!;
  const bonus = leader.leaderSide.startingBonus;
  const productType = leader.leaderSide.productLock[0];

  // Base production by product type
  const baseProd: Record<string, { mau: number; rev: number }> = {
    b2b: { mau: 1, rev: 2 },
    consumer: { mau: 3, rev: 0 },
    platform: { mau: 2, rev: 1 },
  };
  const base = baseProd[productType] || { mau: 2, rev: 1 };

  // Base metrics by product type
  const baseRating: Record<string, number> = { b2b: 5, consumer: 6, platform: 5 };
  const baseMau: Record<string, number> = { b2b: 500, consumer: 2000, platform: 1000 };
  const baseRevenue: Record<string, number> = { b2b: 1000, consumer: 250, platform: 500 };

  // AI capacity from tech approach approximation
  const aiCap = bonus.aiCapacity !== undefined ? bonus.aiCapacity : 2;

  return {
    id,
    leader,
    fundingType,
    productType,
    passiveId: leader.leaderSide.passive.id,
    money: funding.startingMoney + (bonus.money || 0),
    serverCapacity: 10 + (bonus.serverCapacity || 0),
    aiCapacity: aiCap,
    techDebt: bonus.techDebt !== undefined ? bonus.techDebt : 1,
    mau: baseMau[productType] || 1000,
    revenue: baseRevenue[productType] || 500,
    rating: bonus.rating !== undefined ? bonus.rating : (baseRating[productType] || 5),
    mauProduction: clamp(base.mau + (bonus.mauProduction || 0), 0, PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION),
    revenueProduction: clamp(base.rev + (bonus.revenueProduction || 0), 0, PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION),
    engineers: [],
    equityRetained: funding.equityRetained,
  };
}

// ============================================
// ENGINEER GENERATION
// ============================================

function generateEngineer(round: number): SimEngineer {
  const seniorRatio = 0.2 + round * 0.1;
  const isSenior = Math.random() < seniorRatio;
  const level: EngineerLevel = isSenior ? 'senior' : 'junior';
  return {
    level,
    power: isSenior ? 4 : 2,
    specialty: pickRandom(SPECIALTIES),
  };
}

// ============================================
// AI PLANNING HEURISTIC
// ============================================

function pickAction(player: SimPlayer, engineer: SimEngineer, round: number): {
  action: ActionType;
  useAi: boolean;
} {
  const useAi = player.aiCapacity > 0 && player.techDebt < 6 && engineer.level !== 'intern';

  // Priority logic
  if (player.techDebt >= 8) {
    return { action: 'pay-down-debt', useAi: false };
  }

  if (player.money < 20 && player.mau > 1000) {
    return { action: 'monetization', useAi };
  }

  if (player.mau < 3000) {
    // Specialty preference
    if (engineer.specialty === 'frontend' || engineer.specialty === 'fullstack') {
      return { action: 'develop-features', useAi };
    }
    return { action: 'develop-features', useAi };
  }

  // Late game: diversify
  const options: ActionType[] = ['develop-features', 'monetization'];
  // immutable-ledger passive: can't use marketing
  if (player.passiveId !== 'immutable-ledger') {
    options.push('marketing');
  }
  if (player.techDebt >= 4) options.push('optimize-code');
  if (round >= 3 && player.rating < 7) options.push('optimize-code');

  // Specialty matching
  if (engineer.specialty === 'ai' && player.aiCapacity < 4) {
    return { action: 'research-ai', useAi: false };
  }
  if (engineer.specialty === 'devops' && player.serverCapacity < 15) {
    return { action: 'upgrade-servers', useAi: false };
  }

  const action = pickRandom(options);
  return { action, useAi };
}

// ============================================
// ACTION RESOLUTION
// ============================================

function resolveAction(
  player: SimPlayer,
  engineer: SimEngineer,
  action: ActionType,
  useAi: boolean
): void {
  // Calculate total power
  let totalPower = engineer.power;

  if (useAi) {
    totalPower += 2; // AI_POWER_BONUS
  }

  // Specialty bonus
  totalPower += getSpecialtyBonus(
    engineer.specialty as 'frontend' | 'backend' | 'fullstack' | 'devops' | 'ai' | undefined,
    action
  );

  // Leader passive: enterprise-culture (+1 power on develop-features)
  if (player.passiveId === 'enterprise-culture' && action === 'develop-features') {
    totalPower += 1;
  }

  // Tech debt penalty
  if (action !== 'pay-down-debt') {
    totalPower = Math.max(0, totalPower + getDebtPenalty(player.techDebt));
  }

  // Generate AI debt
  if (useAi) {
    let aiDebt = getAiDebt(engineer.level);
    // efficient-ai passive: halve AI debt
    if (player.passiveId === 'efficient-ai') {
      aiDebt = Math.ceil(aiDebt * 0.5);
    }
    // alignment-tax passive: AI generates no debt but -1 rating
    if (player.passiveId === 'alignment-tax') {
      aiDebt = 0;
      player.rating = clamp(player.rating - 1, 1, 10);
    }
    player.techDebt += aiDebt;
  }

  // hype-machine passive: +500 MAU ±200 variance on any action
  if (player.passiveId === 'hype-machine') {
    player.mau += 500 + randInt(-200, 200);
  }

  // Apply action effects
  switch (action) {
    case 'develop-features': {
      player.mau += 100 * totalPower;
      player.mauProduction = clamp(player.mauProduction + 1, 0, PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION);
      break;
    }
    case 'optimize-code': {
      player.techDebt = Math.max(0, player.techDebt - 1);
      let ratingGain = 1;
      // double-optimize passive
      if (player.passiveId === 'double-optimize') {
        ratingGain = 2;
      }
      player.rating = clamp(player.rating + ratingGain, 1, 10);
      break;
    }
    case 'pay-down-debt': {
      player.techDebt = Math.max(0, player.techDebt - 2);
      break;
    }
    case 'upgrade-servers': {
      if (player.money >= 10) {
        player.money -= 10;
        player.serverCapacity += 5;
      }
      break;
    }
    case 'research-ai': {
      if (player.money >= 15) {
        player.money -= 15;
        player.aiCapacity += 2;
        // gpu-royalties passive: +1 AI capacity on research-ai
        if (player.passiveId === 'gpu-royalties') {
          player.aiCapacity += 1;
        }
      }
      break;
    }
    case 'marketing': {
      if (player.money >= 20) {
        player.money -= 20;
        let mauGain = 200 * totalPower;
        mauGain = Math.round(mauGain * player.rating / 5);
        player.mau += mauGain;
        let ratingGain = 1;
        // trust-safety passive: marketing gives +1 extra rating
        if (player.passiveId === 'trust-safety') {
          ratingGain += 1;
        }
        player.rating = clamp(player.rating + ratingGain, 1, 10);
      }
      break;
    }
    case 'monetization': {
      const revenue = Math.round(300 * totalPower * (player.mau / 1000));
      player.revenue += revenue;
      player.rating = clamp(player.rating - 1, 1, 10);
      player.revenueProduction = clamp(
        player.revenueProduction + 1,
        0,
        PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION
      );
      // saas-compounding passive
      if (player.passiveId === 'saas-compounding') {
        player.revenueProduction = clamp(
          player.revenueProduction + 1,
          0,
          PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION
        );
      }
      break;
    }
  }
}

// ============================================
// ROUND SIMULATION
// ============================================

function simulateRound(players: SimPlayer[], round: number): void {
  // 1. Production phase (rounds 2+)
  if (round > 1) {
    for (const p of players) {
      const debtLevel = getTechDebtLevel(p.techDebt);
      const effectiveMauProd = Math.max(0, p.mauProduction + debtLevel.mauProductionPenalty);
      const effectiveRevProd = Math.max(0, p.revenueProduction + debtLevel.revenueProductionPenalty);
      p.mau += effectiveMauProd * PRODUCTION_CONSTANTS.MAU_PER_PRODUCTION;
      p.money += effectiveRevProd * PRODUCTION_CONSTANTS.MONEY_PER_PRODUCTION;
    }
  }

  // 2. Engineer draft (simplified: each player gets 1-2 random engineers)
  for (const p of players) {
    const engCount = round >= 3 ? 2 : 1;
    p.engineers = [];
    for (let i = 0; i < engCount; i++) {
      const eng = generateEngineer(round);
      // lean-efficiency passive: hiring cost -$5 (simplified: just save money)
      const hireCost = p.passiveId === 'lean-efficiency'
        ? Math.max(0, (eng.level === 'senior' ? 25 : 10))
        : (eng.level === 'senior' ? 30 : 15);
      if (p.money >= hireCost) {
        p.money -= hireCost;
        p.engineers.push(eng);
      }
    }
    // Safety net: always have at least 1 engineer
    if (p.engineers.length === 0) {
      p.engineers.push({ level: 'junior', power: 2, specialty: pickRandom(SPECIALTIES) });
    }
  }

  // 3. Plan & Resolve actions
  for (const p of players) {
    for (const eng of p.engineers) {
      const { action, useAi } = pickAction(p, eng, round);
      resolveAction(p, eng, action, useAi);
    }
  }

  // 4. Leader passive per-round effects
  // Count how many players used marketing/develop-features this round for cross-player passives
  // (simplified: estimate ~25% chance each player marketed, ~50% developed features)
  const otherPlayerCount = players.length - 1;

  for (const p of players) {
    // perfectionist: +1 rating on even rounds (Q2, Q4)
    if (p.passiveId === 'perfectionist' && round % 2 === 0) {
      p.rating = clamp(p.rating + 1, 1, 10);
    }
    // ad-network: +$5/round
    if (p.passiveId === 'ad-network') {
      p.money += 5;
    }
    // infrastructure-empire: +2 server capacity/round
    if (p.passiveId === 'infrastructure-empire') {
      p.serverCapacity += 2;
    }
    // subscriber-loyalty: +1 rev prod if rating >= 6
    if (p.passiveId === 'subscriber-loyalty' && p.rating >= 6) {
      p.revenueProduction = clamp(
        p.revenueProduction + 1,
        0,
        PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION
      );
    }
    // network-effects: +500 MAU when any opponent markets (estimated)
    if (p.passiveId === 'network-effects') {
      // ~25% chance each opponent marketed
      const marketers = Math.floor(otherPlayerCount * 0.25);
      if (marketers > 0) p.mau += 500 * marketers;
    }
    // marketplace-tax: +$3 per opponent developing features (estimated)
    if (p.passiveId === 'marketplace-tax') {
      // ~50% chance each opponent developed features
      const developers = Math.floor(otherPlayerCount * 0.5);
      p.money += 3 * developers;
    }
    // crisis-resilience: +200 MAU when opponents market (estimated)
    if (p.passiveId === 'crisis-resilience') {
      const marketers = Math.floor(otherPlayerCount * 0.25);
      if (marketers > 0) p.mau += 200 * marketers;
    }
    // trust-safety: rating floor of 4
    if (p.passiveId === 'trust-safety') {
      p.rating = Math.max(4, p.rating);
    }
  }

  // 5. Random event (simplified)
  for (const p of players) {
    const roll = Math.random();
    if (roll < 0.15) {
      // DDoS-like: lose MAU
      p.mau = Math.max(0, p.mau - randInt(200, 800));
    } else if (roll < 0.25) {
      // Security breach: +tech debt, -rating
      // immutable-ledger passive: immune to data breach events
      if (p.passiveId !== 'immutable-ledger') {
        p.techDebt += randInt(1, 2);
        p.rating = clamp(p.rating - 1, 1, 10);
      }
    } else if (roll < 0.35) {
      // Positive event: gain MAU
      p.mau += randInt(100, 500);
    }
  }

  // 6. Income from MAU
  for (const p of players) {
    const income = Math.min(Math.round(p.mau / 100), 30 + round * 10);
    p.money += income;
  }

  // Clamp values
  for (const p of players) {
    p.rating = clamp(p.rating, 1, 10);
    p.mau = Math.max(0, p.mau);
    p.money = Math.max(0, p.money);
    p.mauProduction = clamp(p.mauProduction, 0, PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION);
    p.revenueProduction = clamp(p.revenueProduction, 0, PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION);
  }
}

// ============================================
// SCORING
// ============================================

function calculateScore(player: SimPlayer): number {
  let score = 0;
  score += player.mau / 1000;
  const revMultiplier = player.fundingType === 'bootstrapped' ? 1.3 : 1;
  score += (player.revenue / 500) * revMultiplier;
  score += player.rating * 3;

  // Graduated debt penalty (Phase 5)
  if (player.techDebt >= 12) {
    score -= 20;
  } else if (player.techDebt >= 8) {
    score -= 10;
  } else if (player.techDebt >= 4) {
    score -= 5;
  }

  // Production track bonus (Phase 5)
  score += player.mauProduction * 1;
  score += player.revenueProduction * 2;

  return Math.round(score);
}

// ============================================
// SINGLE GAME SIMULATION
// ============================================

function simulateGame(
  assignments: { leader: PersonaCard; funding: FundingType }[],
  verbose: boolean = false
): number {
  const players = assignments.map((a, i) => createSimPlayer(i, a.leader, a.funding));

  for (let round = 1; round <= 4; round++) {
    simulateRound(players, round);
    if (verbose) {
      console.log(`  Round ${round}:`, players.map(p =>
        `P${p.id}(${p.leader.name.split(' ')[1]}) MAU:${p.mau} Rev:${p.revenue} R:${p.rating} D:${p.techDebt} $${p.money}`
      ).join(' | '));
    }
  }

  // Score all players
  const scores = players.map(p => ({ id: p.id, score: calculateScore(p) }));
  scores.sort((a, b) => b.score - a.score);

  if (verbose) {
    console.log(`  Winner: P${scores[0].id} (${players[scores[0].id].leader.name}) Score: ${scores[0].score}`);
  }

  return scores[0].id; // Return winning player index
}

// ============================================
// BATCH SIMULATION
// ============================================

export function runBalanceSimulation(config: SimConfig): Map<string, LeaderFundingStats> {
  const stats = new Map<string, LeaderFundingStats>();
  const allPersonas = PERSONA_CARDS;
  const allFundingTypes: FundingType[] = ['vc-heavy', 'bootstrapped', 'angel-backed'];

  // Initialize stats for all combos
  for (const persona of allPersonas) {
    for (const funding of allFundingTypes) {
      const key = `${persona.id}|${funding}`;
      stats.set(key, {
        personaId: persona.id,
        personaName: persona.name,
        fundingType: funding,
        gamesPlayed: 0,
        wins: 0,
        winRate: 0,
        avgScore: 0,
        avgMau: 0,
        avgRevenue: 0,
        avgRating: 0,
        avgTechDebt: 0,
        totalScore: 0,
        totalMau: 0,
        totalRevenue: 0,
        totalRating: 0,
        totalTechDebt: 0,
      });
    }
  }

  // For each combo, run N games with it in player slot 0
  for (const targetPersona of allPersonas) {
    for (const targetFunding of allFundingTypes) {
      const key = `${targetPersona.id}|${targetFunding}`;

      for (let game = 0; game < config.gamesPerCombo; game++) {
        // Build player assignments: target combo in slot 0, random others in slots 1-3
        const assignments: { leader: PersonaCard; funding: FundingType }[] = [
          { leader: targetPersona, funding: targetFunding },
        ];

        // Fill remaining slots with random combos (avoid duplicate leaders)
        const usedPersonas = new Set<PersonaId>([targetPersona.id]);
        for (let i = 1; i < config.playerCount; i++) {
          let persona: PersonaCard;
          do {
            persona = pickRandom(allPersonas);
          } while (usedPersonas.has(persona.id));
          usedPersonas.add(persona.id);
          assignments.push({
            leader: persona,
            funding: pickRandom(allFundingTypes),
          });
        }

        const winnerId = simulateGame(
          assignments,
          config.verbose || false
        );

        // Update stats for slot 0 (target combo)
        const s = stats.get(key)!;
        s.gamesPlayed++;
        if (winnerId === 0) s.wins++;

        // We need final scores for averages - run game again to get scores
        // Actually, let's restructure: return full results
      }
    }
  }

  // Calculate averages and win rates
  stats.forEach((s) => {
    if (s.gamesPlayed > 0) {
      s.winRate = s.wins / s.gamesPlayed;
    }
  });

  return stats;
}

// Enhanced version that tracks scores
export function runDetailedSimulation(config: SimConfig): Map<string, LeaderFundingStats> {
  const stats = new Map<string, LeaderFundingStats>();
  const allPersonas = PERSONA_CARDS;
  const allFundingTypes: FundingType[] = ['vc-heavy', 'bootstrapped', 'angel-backed'];

  // Initialize stats
  for (const persona of allPersonas) {
    for (const funding of allFundingTypes) {
      const key = `${persona.id}|${funding}`;
      stats.set(key, {
        personaId: persona.id,
        personaName: persona.name,
        fundingType: funding,
        gamesPlayed: 0,
        wins: 0,
        winRate: 0,
        avgScore: 0,
        avgMau: 0,
        avgRevenue: 0,
        avgRating: 0,
        avgTechDebt: 0,
        totalScore: 0,
        totalMau: 0,
        totalRevenue: 0,
        totalRating: 0,
        totalTechDebt: 0,
      });
    }
  }

  for (const targetPersona of allPersonas) {
    for (const targetFunding of allFundingTypes) {
      const key = `${targetPersona.id}|${targetFunding}`;

      for (let game = 0; game < config.gamesPerCombo; game++) {
        const assignments: { leader: PersonaCard; funding: FundingType }[] = [
          { leader: targetPersona, funding: targetFunding },
        ];

        const usedPersonas = new Set<PersonaId>([targetPersona.id]);
        for (let i = 1; i < config.playerCount; i++) {
          let persona: PersonaCard;
          do {
            persona = pickRandom(allPersonas);
          } while (usedPersonas.has(persona.id));
          usedPersonas.add(persona.id);
          assignments.push({
            leader: persona,
            funding: pickRandom(allFundingTypes),
          });
        }

        // Create players and simulate
        const players = assignments.map((a, i) => createSimPlayer(i, a.leader, a.funding));
        for (let round = 1; round <= 4; round++) {
          simulateRound(players, round);
        }

        // Score
        const scores = players.map((p, i) => ({ id: i, score: calculateScore(p) }));
        scores.sort((a, b) => b.score - a.score);
        const winnerId = scores[0].id;

        // Update target player stats
        const targetPlayer = players[0];
        const targetScore = calculateScore(targetPlayer);
        const s = stats.get(key)!;
        s.gamesPlayed++;
        if (winnerId === 0) s.wins++;
        s.totalScore += targetScore;
        s.totalMau += targetPlayer.mau;
        s.totalRevenue += targetPlayer.revenue;
        s.totalRating += targetPlayer.rating;
        s.totalTechDebt += targetPlayer.techDebt;
      }
    }
  }

  // Calculate averages
  stats.forEach((s) => {
    if (s.gamesPlayed > 0) {
      s.winRate = s.wins / s.gamesPlayed;
      s.avgScore = Math.round((s.totalScore / s.gamesPlayed) * 10) / 10;
      s.avgMau = Math.round(s.totalMau / s.gamesPlayed);
      s.avgRevenue = Math.round(s.totalRevenue / s.gamesPlayed);
      s.avgRating = Math.round((s.totalRating / s.gamesPlayed) * 10) / 10;
      s.avgTechDebt = Math.round((s.totalTechDebt / s.gamesPlayed) * 10) / 10;
    }
  });

  return stats;
}
