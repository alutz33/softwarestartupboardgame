import type { Engineer, EngineerLevel, EngineerTraitType } from '../types';

const FIRST_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn',
  'Avery', 'Cameron', 'Drew', 'Jamie', 'Skyler', 'Reese', 'Sage', 'River',
  'Blake', 'Charlie', 'Dakota', 'Emery', 'Finley', 'Harper', 'Indigo', 'Kai',
];

const LAST_INITIALS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'Z'];

const SPECIALTIES: Engineer['specialty'][] = ['frontend', 'backend', 'fullstack', 'devops', 'ai'];

// Engineer traits - each engineer has a chance to have one
const TRAITS: EngineerTraitType[] = ['ai-skeptic', 'equity-hungry', 'startup-veteran', 'night-owl'];
const TRAIT_CHANCE = 0.35; // 35% chance an engineer has a trait

function generateTrait(): EngineerTraitType | undefined {
  if (Math.random() > TRAIT_CHANCE) return undefined;
  return TRAITS[Math.floor(Math.random() * TRAITS.length)];
}

let engineerCounter = 0;

export function generateEngineerName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastInitial = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
  return `${firstName} ${lastInitial}.`;
}

let internCounter = 0;

export function generateIntern(): Engineer {
  internCounter++;
  return {
    id: `intern-${Date.now()}-${internCounter}`,
    name: generateEngineerName(),
    level: 'intern',
    specialty: undefined, // No specialty
    baseSalary: 5,
    productivity: 0.3,
  };
}

export function generateEngineer(level: EngineerLevel): Engineer {
  engineerCounter++;
  const specialty = SPECIALTIES[Math.floor(Math.random() * SPECIALTIES.length)];
  const trait = generateTrait();

  const baseProductivity = level === 'senior' ? 1.0 : 0.5;
  const productivityVariance = (Math.random() - 0.5) * 0.2; // +/- 10%
  let productivity = Math.round((baseProductivity + productivityVariance) * 100) / 100;

  // AI Skeptic trait: +10% base productivity
  if (trait === 'ai-skeptic') {
    productivity = Math.round((productivity * 1.1) * 100) / 100;
  }

  let baseSalary = level === 'senior' ? 30 : 15;
  const salaryVariance = Math.floor(Math.random() * 10) - 5; // +/- 5

  // Equity-Hungry trait: +$5 salary
  if (trait === 'equity-hungry') {
    baseSalary += 5;
  }

  return {
    id: `eng-${engineerCounter}`,
    name: generateEngineerName(),
    level,
    specialty,
    baseSalary: baseSalary + salaryVariance,
    productivity,
    trait,
  };
}

export function generateEngineerPool(
  roundNumber: number,
  playerCount: number,
  hasRecruiterBonus: boolean[]
): Engineer[] {
  const pool: Engineer[] = [];

  // Base pool size: players + 1
  let poolSize = playerCount + 1;

  // More senior engineers in later rounds
  const seniorRatio = 0.2 + roundNumber * 0.1; // 30%, 40%, 50%, 60%

  // Add bonus engineers for players with recruiter
  const bonusEngineers = hasRecruiterBonus.filter(Boolean).length * 2;
  poolSize += bonusEngineers;

  for (let i = 0; i < poolSize; i++) {
    const isSenior = Math.random() < seniorRatio;
    const engineer = generateEngineer(isSenior ? 'senior' : 'junior');

    // Later rounds have slightly better base stats
    if (roundNumber > 1) {
      engineer.productivity = Math.round((engineer.productivity + (roundNumber - 1) * 0.05) * 100) / 100;
    }

    pool.push(engineer);
  }

  // Sort by a combination of level and productivity for display
  pool.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level === 'senior' ? -1 : 1;
    }
    return b.productivity - a.productivity;
  });

  return pool;
}

export function getSpecialtyBonus(specialty: Engineer['specialty'], actionType: string): number {
  const bonuses: Record<string, Record<string, number>> = {
    frontend: { 'develop-features': 0.2, 'marketing': 0.1 },
    backend: { 'optimize-code': 0.2, 'upgrade-servers': 0.1 },
    fullstack: { 'develop-features': 0.1, 'optimize-code': 0.1 },
    devops: { 'upgrade-servers': 0.3, 'research-ai': 0.1 },
    ai: { 'research-ai': 0.3, 'optimize-code': 0.1 },
  };

  return bonuses[specialty || 'fullstack']?.[actionType] || 0;
}
