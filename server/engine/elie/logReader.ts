/**
 * ELIE Log Reader
 * Reads logs from filesystem or memory
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ElieLogEntry {
  timestamp: string | Date;
  level: 'error' | 'warn' | 'info';
  message: string;
}

const logsRoot = process.env.LOGS_DIR || './logs';

/**
 * Read ELIE logs from filesystem
 * If logs directory doesn't exist, returns empty array with warning
 */
export async function readElieLogs(): Promise<ElieLogEntry[]> {
  try {
    if (!fs.existsSync(logsRoot)) {
      console.warn(`[ELIE] Logs directory not found: ${logsRoot}`);
      return [];
    }

    const files = fs.readdirSync(logsRoot);
    const logs: ElieLogEntry[] = [];

    for (const file of files) {
      if (!file.endsWith('.log')) continue;

      const filePath = path.join(logsRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          // Assume JSON format: { timestamp, level, message }
          const entry = JSON.parse(line);
          logs.push({
            timestamp: entry.timestamp || new Date(),
            level: entry.level || 'info',
            message: entry.message || ''
          });
        } catch {
          // Skip lines that aren't valid JSON
        }
      }
    }

    return logs;
  } catch (error) {
    console.error('[ELIE] Error reading logs:', error);
    return [];
  }
}

export default { readElieLogs };
