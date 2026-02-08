#!/usr/bin/env node
/**
 * Balance Simulation Runner
 * Usage: npx tsx src/simulation/runBalance.ts [gamesPerCombo]
 * Default: 100 games per combo
 */

import { runDetailedSimulation } from './balanceSimulator';
import type { LeaderFundingStats } from './balanceSimulator';

const gamesPerCombo = parseInt(process.argv[2] || '100', 10);
const playerCount = 4;

console.log(`\n=== Ship It! Balance Simulation ===`);
console.log(`Players: ${playerCount}`);
console.log(`Games per combo: ${gamesPerCombo}`);
console.log(`Total combos: 54 (18 leaders x 3 funding types)`);
console.log(`Total games: ${54 * gamesPerCombo}`);
console.log(`Running...\n`);

const startTime = Date.now();

const stats = runDetailedSimulation({
  playerCount,
  gamesPerCombo,
});

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`Simulation complete in ${elapsed}s\n`);

// Convert to sorted array
const results: LeaderFundingStats[] = [];
stats.forEach((s) => results.push(s));
results.sort((a, b) => b.winRate - a.winRate);

// Print table header
const header = [
  'Leader'.padEnd(20),
  'Funding'.padEnd(14),
  'Games'.padStart(6),
  'Win%'.padStart(7),
  'AvgScore'.padStart(9),
  'AvgMAU'.padStart(8),
  'AvgRev'.padStart(8),
  'AvgRate'.padStart(8),
  'Flag'.padStart(10),
].join(' | ');

console.log('='.repeat(header.length));
console.log(header);
console.log('='.repeat(header.length));

for (const r of results) {
  const winPct = (r.winRate * 100).toFixed(1);
  const flag = r.winRate > 0.35 ? '** HIGH **' : r.winRate < 0.15 ? '** LOW **' : '';

  const row = [
    r.personaName.padEnd(20),
    r.fundingType.padEnd(14),
    String(r.gamesPlayed).padStart(6),
    `${winPct}%`.padStart(7),
    String(r.avgScore).padStart(9),
    String(r.avgMau).padStart(8),
    String(r.avgRevenue).padStart(8),
    String(r.avgRating).padStart(8),
    flag.padStart(10),
  ].join(' | ');

  console.log(row);
}

console.log('='.repeat(header.length));

// ============================================
// SUMMARY
// ============================================
console.log('\n=== SUMMARY ===\n');

// Best/worst by leader (aggregate across funding types)
const leaderStats = new Map<string, { name: string; wins: number; games: number }>();
for (const r of results) {
  const existing = leaderStats.get(r.personaId) || { name: r.personaName, wins: 0, games: 0 };
  existing.wins += r.wins;
  existing.games += r.gamesPlayed;
  leaderStats.set(r.personaId, existing);
}

const leaderRanking = [...leaderStats.entries()]
  .map(([id, s]) => ({ id, ...s, winRate: s.wins / s.games }))
  .sort((a, b) => b.winRate - a.winRate);

console.log('Top 5 Leaders:');
for (let i = 0; i < Math.min(5, leaderRanking.length); i++) {
  const l = leaderRanking[i];
  console.log(`  ${i + 1}. ${l.name}: ${(l.winRate * 100).toFixed(1)}% win rate`);
}

console.log('\nBottom 5 Leaders:');
for (let i = Math.max(0, leaderRanking.length - 5); i < leaderRanking.length; i++) {
  const l = leaderRanking[i];
  console.log(`  ${leaderRanking.length - i}. ${l.name}: ${(l.winRate * 100).toFixed(1)}% win rate`);
}

// Best/worst by funding
const fundingStats = new Map<string, { wins: number; games: number }>();
for (const r of results) {
  const existing = fundingStats.get(r.fundingType) || { wins: 0, games: 0 };
  existing.wins += r.wins;
  existing.games += r.gamesPlayed;
  fundingStats.set(r.fundingType, existing);
}

console.log('\nFunding Type Win Rates:');
fundingStats.forEach((s, type) => {
  console.log(`  ${type}: ${(s.wins / s.games * 100).toFixed(1)}%`);
});

// Outlier count
const outliers = results.filter(r => r.winRate > 0.35 || r.winRate < 0.15);
console.log(`\nOutliers: ${outliers.length} of ${results.length} combos`);
if (outliers.length > 0) {
  console.log('  High (>35%):');
  outliers.filter(r => r.winRate > 0.35).forEach(r => {
    console.log(`    ${r.personaName} + ${r.fundingType}: ${(r.winRate * 100).toFixed(1)}%`);
  });
  console.log('  Low (<15%):');
  outliers.filter(r => r.winRate < 0.15).forEach(r => {
    console.log(`    ${r.personaName} + ${r.fundingType}: ${(r.winRate * 100).toFixed(1)}%`);
  });
}

console.log('');
