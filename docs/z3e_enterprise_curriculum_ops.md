# Z3E Enterprise Curriculum Ops

## Overview
Operational procedures for managing the preloaded mastery blueprint.

## Ingestion Workflow
1. **Validate:** Run `./validators/z3e_enterprise_sanity_check.sh`.
2. **Schema Check:** Confirm all JSONL records match `curriculum/schema_definition.md`.
3. **Index Update:** (Phase 2) Rebuild index via `tools/z3e_enterprise_index_builder.ts`.

## Gap Management
If coverage falls below targets specified in `ZEUS_PRELOADED_MASTERY_BLUEPRINT.md`:
1. Generate GAP ticket using `docs/z3e_enterprise_gap_template.md`.
2. Propose synthetic simulation generation.

**Enterprise hardening in progress.**
