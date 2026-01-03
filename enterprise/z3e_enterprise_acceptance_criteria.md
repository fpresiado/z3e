
# Z3E Enterprise Acceptance Criteria (Phase 2)

## Scope
Phase 2 turns Phase 1 scaffolding into enforceable, auditable gates. Additive-only.

## Gate A — Repo Structure
- Required dirs exist: enterprise/, curriculum/, validators/, simulations/, tools/, docs/
- Phase 1 docs exist: docs/z3e_enterprise_phase1_report.md, docs/GAP_20251226_100100.md

## Gate B — Validator Operability
- validators/z3e_enterprise_sanity_check.sh runs on Windows Git Bash and Linux
- Script exits non-zero on failure, zero on pass
- Script prints clear PASS/FAIL sections

## Gate C — No Touch Zones
- No modifications to client/, server/, scripts/ during Phase 2
- Only enterprise scaffolding + docs + validators may change

## Gate D — GAP Closure: shared/schema.ts
- GAP doc updated with: what is missing, where schema actually lives, and the intended canonical schema path
- If schema is elsewhere, document it and update validator to check the correct location
- No fake schema files created to “make checks pass”

## Gate E — Evidence
- Each gate produces evidence:
  - validator output log
  - git diff/commit references
  - updated docs

## Definition of Done (Phase 2)
- All gates PASS via validator run
- GAP resolved/documented without hacks


## BLOCKER — Canonical Schema Missing
- `@shared/schema` is required by server code
- `shared/schema.ts` does not exist
- Validator hard-fails until schema is authored
- Phase 3 required to proceed
