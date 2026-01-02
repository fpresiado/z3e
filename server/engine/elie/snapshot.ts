/**
 * ELIE Snapshot Generator
 * Generates system health snapshots from event data
 */

import { readElieLogs } from './logReader';
import { filterElieLogs, FilterQuery } from './logFilter';
import { scoreElieEvents, ScoredEvent, getHighestScore } from './scoring';

export interface ElieSnapshot {
  timestamp: Date;
  totalEvents: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  highestScore: number;
  averageScore: number;
  topEvents: ScoredEvent[];
}

/**
 * Generate ELIE system health snapshot
 */
export async function generateElieSnapshot(
  limit: number = 10
): Promise<ElieSnapshot> {
  try {
    // Step 1: Read logs
    const logs = await readElieLogs();

    // Step 2: Score events
    const scored = scoreElieEvents(logs);

    // Step 3: Count by level
    const errorCount = logs.filter(l => l.level === 'error').length;
    const warnCount = logs.filter(l => l.level === 'warn').length;
    const infoCount = logs.filter(l => l.level === 'info').length;

    // Step 4: Get top events (highest score first)
    const topEvents = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Step 5: Calculate scores
    const highestScore = getHighestScore(scored);
    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, e) => sum + e.score, 0) / scored.length
        : 0;

    return {
      timestamp: new Date(),
      totalEvents: logs.length,
      errorCount,
      warnCount,
      infoCount,
      highestScore,
      averageScore,
      topEvents
    };
  } catch (error) {
    console.error('[ELIE] Error generating snapshot:', error);
    return {
      timestamp: new Date(),
      totalEvents: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      highestScore: 0,
      averageScore: 0,
      topEvents: []
    };
  }
}

export default { generateElieSnapshot };
