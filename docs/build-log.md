# Build log

This repo was built with Claude Code from a written plan. Each entry is the instruction given for one task.

## Task 1 — Start phase 4 from the phase 3 app

> Copy the tree of the phase 3 `main` branch without its history, with `git archive`. It already has the three `CLAUDE.md` files, `.claude/settings.json`, the format hook and the 100 % coverage gate. Remove the phase 3 ticket, exercises, slides, build log and `docs/superpowers/`. Remove each line that points to them. The README tells the `solution` branch and the `logs/`, `data/` and `scripts/migrations/` folders.

## Task 2 — Add the production logs

> Write two or three days of API logs of the production service in `logs/`, one JSON entry for each line, in the format of a cloud service: timestamp, severity, request ID, method, path, status, duration, message, and a stack trace for each 500. Most entries are normal traffic. Some entries are the errors that exercise 01 investigates. A failed request of the logs gives a 500 again on the local app.

## Task 3 — Add the legacy data and the migrations folder

> Write `data/legacy.json`, the export of an old app in an old schema: at least 40 books, 15 authors and 60 loans. The author is a `Last, First` text in the book, the borrower is `member`, and the dates use more than one format. Add duplicates, some broken rows and loans of books that are not in the file. `data/README.md` tells the schema and nothing more. `scripts/migrations/CLAUDE.md` tells the rules: one folder for each migration, a dry run by default, a write only with `--apply`, idempotent, tested on a copy of the database, the person runs `--apply`, the folder goes when the migration is done. `.claude/settings.json` stops the agent when it runs a migration with `--apply`, opens a database with `sqlite3`, or reads or edits `backend/data/`.

## Task 4 — Add the phase 4 exercises

> Write three exercises in French under `exercices/`. 01: investigate from the logs and the code only, in five steps (reproduce, hypothesis, verify, fix, validate); Claude runs no command on the database; the fix comes with a test that failed before; the diagnostic goes in `docs/incidents/`. 02: a conversion script for `data/legacy.json` in `scripts/migrations/legacy/`, a dry run first, a test on a copy of the database, idempotent, the participant runs `--apply`. 03: turn the steps of exercise 01 into a skill that runs only when you call it. Each exercise ends with clear success criteria.

## Task 5 — Add the phase 4 slides

> Write `slides.md` for Marp, in French, about 22 slides in the order of the phase 4 outline: the five-step loop, read only, no database command by the agent, the smallest SQL, the diagnostic, throwaway scripts, dry run, copy and idempotence, the person runs `--apply`, skills, the demo, the practice and the exercises. At most 5 bullets per slide, speaker notes on the theory slides. Render to PNG and check that no text overflows.
