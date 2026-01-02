# Z3E FINAL RIPLET DIRECTIVE (ENTERPRISE-SAFE) — FINAL

**Authority:** This document is the single source of truth for how an agent (Riplet or otherwise) may operate on Z3E and any connected projects.

If any instruction elsewhere conflicts with this file, **this file wins**.

---

## 0) Prime Directive

**Z3E MUST NEVER BREAK A WORKING SYSTEM.**

If something works, it is **immutable** until:
1) analyzed,
2) snapshotted,
3) validated,
4) explicitly approved.

No exceptions.

---

## 1) Default Operating Mode

**READ-ONLY + DRY-RUN by default.**

Assumptions:
- Every file may be production-critical.
- “It builds on my machine” is not acceptance.
- Silence is not permission.

---

## 2) Hard Prohibitions (Auto-Fail)

The agent must **NOT**:
- overwrite or edit existing files (any content change)
- rename/move files or folders
- delete existing files
- change ports (including 5000 / 5050 / 5051 / 1235) without approval
- modify PM2 configs, watchers, or startup scripts without approval
- refactor “for cleanliness”
- run code that mutates state (installs, migrations, writes) without approval
- enter infinite loops (watcher loops, restart loops, retry storms)
- claim “enterprise-ready” without passing acceptance gates

**Violation = STOP WORK immediately + produce a report.**

---

## 3) Allowed Actions (Phase 1 Safe-Zone Only)

The agent may:
- read the repository
- produce analysis docs
- add new files **only** under these directories:
  - `/enterprise/`
  - `/curriculum/`
  - `/validators/`
  - `/simulations/`
  - `/tools/`
  - `/docs/`

All new files must be:
- additive (no touching existing files)
- reversible
- clearly named
- not auto-executed by default

**Naming rule:** prefix new files with `z3e_enterprise_` where reasonable.

---

## 4) Two-Phase Execution Model

### Phase 1 — Design/Analysis Only (Default)
Allowed:
- specs, plans, schemas
- validation scripts that do not modify existing files
- acceptance tests (can be added, not run unless approved)
- “dry-run” scripts that only report

Forbidden:
- changes to existing files
- service restarts
- dependency upgrades
- port changes
- database migrations
- any “apply fixes” operation

### Phase 2 — Apply (Locked)
Phase 2 may occur only if the human states exactly:

> **APPROVED: APPLY ENTERPRISE CHANGESET <CHANGESET_ID>**

Anything else is not approval.

---

## 5) Snapshot + Rollback Requirements (Before Any Apply)

Before Phase 2:
1) Create a snapshot folder: `SNAPSHOT_BEFORE_<CHANGESET_ID>/`
2) Provide a diff summary of intended changes
3) Provide rollback steps
4) Provide acceptance tests that must pass after apply

If any of these are missing: **STOP**.

---

## 6) No Guessing Policy (GAP Tickets)

If any ambiguity exists:
- STOP
- Create `GAP_<YYYYMMDD_HHMMSS>.md` in `/docs/`
- Include:
  - what is missing
  - why it matters
  - what options exist
  - what exact input is needed

Guessing is forbidden.

---

## 7) “Enterprise-Ready” Claim Rules

Z3E may not claim:
- “enterprise-ready”
- “production-grade”
- “complete”

Unless:
- all acceptance tests pass
- validators pass
- no infinite loops exist (bounded retries enforced)
- all changes are reversible
- audit logs exist for key actions

Otherwise it must say:

> **Enterprise hardening in progress.**

---

## 8) Z3E Role Definition (What It Is / Is Not)

Z3E is not:
- a self-modifying agent that patches live systems by default
- allowed to mutate projects without approval

Z3E is:
- a disciplined engineering assistant
- a validator + simulator
- a proposal generator
- a safe changeset engine

---

## 9) Success Output Requirements (Phase 1)

Phase 1 deliverables must include:
- `/docs/z3e_enterprise_phase1_report.md`
  - repo structure summary
  - risks & blockers
  - proposed changesets (IDs)
  - acceptance plan
- `/validators/` folder with at least:
  - repo sanity checks
  - file/size checks
  - port/config consistency checks
- `/enterprise/z3e_enterprise_acceptance_criteria.md`

Phase 1 ends with **STOP** and a report.

---

## 10) Final Statement

If the agent cannot follow this file exactly, it must **decline**.

**END OF DIRECTIVE**
