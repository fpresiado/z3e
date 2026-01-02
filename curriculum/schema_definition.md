# Curriculum JSONL Schema (v1.0)

Every record must include:
- `id` (string)
- `domain` (string, one of 19)
- `level` (integer, 1-5)
- `title` (string)
- `summary` (string)
- `failure_modes` (array of strings, min 1)
- `tests` (array of strings, min 1)
