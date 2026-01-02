# ELIE – Event Log Intelligence Engine

**Version:** 1.0  
**Status:** Phase 3 – Complete  
**Purpose:** Intelligent event logging and analysis for Zeus 3 Enterprise

---

## Purpose

ELIE provides a unified system for:
- Reading application logs from multiple sources
- Filtering logs by level, time, and keywords
- Scoring events for priority and severity
- Generating snapshots of system health and event summaries

---

## High-Level Modules

### Phase 1 (Base Architecture) ✅
- `index.ts` – Main entry point and exports
- `ELIE_ARCHITECTURE.md` – Architecture documentation

### Phase 2 (Log Reader + Filtering) ✅
- `logReader.ts` – Read logs from filesystem
- `logFilter.ts` – Filter logs by level and text

### Phase 3 (Scoring + Snapshots) ✅
- `scoring.ts` – Score events by severity (1–5)
- `snapshot.ts` – Generate system health snapshots

---

## Data Flow

```
Logs on Disk (if available)
  ↓
readElieLogs()
  ↓ (returns empty[] if logs/ missing + warning)
Log Entries (Array<ElieLogEntry>)
  ↓
filterElieLogs(logs, query)
  ↓ (filters by level, text, maxResults)
Filtered Logs
  ↓
scoreElieEvents(logs)
  ↓ (error=5, warn=3, info=1)
Scored Events (Array<ScoredEvent>)
  ↓
generateElieSnapshot()
  ↓ (aggregates all data)
Snapshot { errorCount, warnCount, infoCount, highestScore, topEvents }
```

---

## Module Design

### Phase 2: Log Reader & Filter

#### logReader.ts

**Function:** `readElieLogs(): Promise<ElieLogEntry[]>`

**Behavior:**
- Reads all `.log` files from `LOGS_DIR` (default: `./logs`)
- Parses JSON format: `{ timestamp, level, message }`
- If logs directory missing: returns empty array + warning
- On error: returns empty array + error log

**Interface:**
```typescript
interface ElieLogEntry {
  timestamp: string | Date;
  level: 'error' | 'warn' | 'info';
  message: string;
}
```

#### logFilter.ts

**Function:** `filterElieLogs(logs, query): ElieLogEntry[]`

**Behavior:**
- Filters by `level` (single or array)
- Filters by `text` (case-insensitive partial match)
- Limits results with `maxResults`

**Query Interface:**
```typescript
interface FilterQuery {
  level?: 'error' | 'warn' | 'info' | ('error' | 'warn' | 'info')[];
  text?: string;
  maxResults?: number;
}
```

---

### Phase 3: Scoring & Snapshots

#### scoring.ts

**Function:** `scoreElieEvents(logs): ScoredEvent[]`

**Behavior:**
- Scores each event 1–5 based on level:
  - `error` → 5
  - `warn` → 3
  - `info` → 1
- Returns scored events with score attached

**Helper Functions:**
- `getAverageScore(scored)` – Returns average score (0 if empty)
- `getHighestScore(scored)` – Returns max score (0 if empty)

**Interface:**
```typescript
interface ScoredEvent extends ElieLogEntry {
  score: number;
}
```

#### snapshot.ts

**Function:** `generateElieSnapshot(limit?): Promise<ElieSnapshot>`

**Behavior:**
1. Calls `readElieLogs()` to get all logs
2. Calls `scoreElieEvents()` to score them
3. Counts events by level (error, warn, info)
4. Sorts by score, returns top N events
5. Calculates highest and average scores
6. Returns complete snapshot

**Snapshot Interface:**
```typescript
interface ElieSnapshot {
  timestamp: Date;
  totalEvents: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  highestScore: number;
  averageScore: number;
  topEvents: ScoredEvent[];
}
```

---

## Log Requirements

**Log Format:**
- File location: `./logs/*.log` (or `LOGS_DIR` env var)
- Format: JSON, one entry per line
- Required fields: `timestamp`, `level`, `message`

**Example:**
```json
{"timestamp":"2025-12-03T23:55:00Z","level":"error","message":"Connection failed"}
{"timestamp":"2025-12-03T23:55:01Z","level":"warn","message":"High memory usage"}
{"timestamp":"2025-12-03T23:55:02Z","level":"info","message":"Request processed"}
```

---

## Phase Overview

| Phase | Focus | Files | Status |
|-------|-------|-------|--------|
| 1 | Base Architecture | index.ts, ELIE_ARCHITECTURE.md | ✅ Complete |
| 2 | Log Reader + Filter | logReader.ts, logFilter.ts | ✅ Complete |
| 3 | Scoring + Snapshots | scoring.ts, snapshot.ts | ✅ Complete |

---

## Module Exports (index.ts)

**Phase 1:**
- `initELIE()` – Initialize ELIE system
- `getELIEInfo()` – Get ELIE status/version

**Phase 2:**
- `readElieLogs()` – Read logs from disk
- `filterElieLogs()` – Filter logs

**Phase 3:**
- `scoreElieEvents()` – Score events
- `generateElieSnapshot()` – Generate snapshot
- `ScoredEvent` – Scored event type
- `ElieSnapshot` – Snapshot type

---

## Implementation Status

**Phase 1:** ✅ Complete  
**Phase 2:** ✅ Complete  
**Phase 3:** ✅ Complete

All three phases implemented and integrated into `index.ts`.

---

## Error Handling

- If logs directory missing: Warning logged, empty array returned
- If log file parse fails: Line skipped, processing continues
- If snapshot generation fails: Error logged, empty snapshot returned

---

## Future Enhancements (Phase 4+)

- [ ] Real-time log streaming
- [ ] Time-range filtering
- [ ] Pattern-based event detection
- [ ] Anomaly detection
- [ ] Machine learning scoring
- [ ] Performance metrics integration
