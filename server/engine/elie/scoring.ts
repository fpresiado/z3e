/**
 * ELIE Scoring Engine
 * Scores events by severity (1–5)
 */

import { ElieLogEntry } from './logReader';

export interface ScoredEvent extends ElieLogEntry {
  score: number;
}

/**
 * Score ELIE events by severity
 * Weights:
 *   error = 5
 *   warn  = 3
 *   info  = 1
 */
export function scoreElieEvents(logs: ElieLogEntry[]): ScoredEvent[] {
  return logs.map(log => {
    let score = 1; // Default for 'info'

    if (log.level === 'error') {
      score = 5;
    } else if (log.level === 'warn') {
      score = 3;
    }

    return {
      ...log,
      score
    };
  });
}

/**
 * Get average score of events
 */
export function getAverageScore(scored: ScoredEvent[]): number {
  if (scored.length === 0) return 0;
  const sum = scored.reduce((acc, event) => acc + event.score, 0);
  return sum / scored.length;
}

/**
 * Get highest score from events
 */
export function getHighestScore(scored: ScoredEvent[]): number {
  if (scored.length === 0) return 0;
  return Math.max(...scored.map(e => e.score));
}

export default { scoreElieEvents, getAverageScore, getHighestScore };
