/**
 * ELIE Log Filter
 * Filters logs by level, text, and other criteria
 */

import { ElieLogEntry } from './logReader';

export interface FilterQuery {
  level?: 'error' | 'warn' | 'info' | ('error' | 'warn' | 'info')[];
  text?: string;
  maxResults?: number;
}

/**
 * Filter ELIE logs by query criteria
 */
export function filterElieLogs(
  logs: ElieLogEntry[],
  query: FilterQuery
): ElieLogEntry[] {
  let filtered = [...logs];

  // Filter by level
  if (query.level) {
    const levels = Array.isArray(query.level) ? query.level : [query.level];
    filtered = filtered.filter(log => levels.includes(log.level));
  }

  // Filter by text (case-insensitive partial match)
  if (query.text) {
    const searchText = query.text.toLowerCase();
    filtered = filtered.filter(log =>
      log.message.toLowerCase().includes(searchText)
    );
  }

  // Limit results
  if (query.maxResults && query.maxResults > 0) {
    filtered = filtered.slice(0, query.maxResults);
  }

  return filtered;
}

export default { filterElieLogs };
