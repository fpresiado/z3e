/**
 * ELIE – Event Log Intelligence Engine
 * Main entry point and exports
 */

// Phase 1: Base
export async function initELIE(): Promise<void> {
  console.log('[ELIE] Initializing Event Log Intelligence Engine');
}

export function getELIEInfo(): { version: string; status: string } {
  return {
    version: '1.0.0',
    status: 'initialized'
  };
}

// Phase 2: Log Reader + Filter
export { readElieLogs, ElieLogEntry } from './logReader';
export { filterElieLogs, FilterQuery } from './logFilter';

// Phase 3: Scoring + Snapshot
export { scoreElieEvents, getAverageScore, getHighestScore, ScoredEvent } from './scoring';
export { generateElieSnapshot, ElieSnapshot } from './snapshot';

export default {
  initELIE,
  getELIEInfo
};
