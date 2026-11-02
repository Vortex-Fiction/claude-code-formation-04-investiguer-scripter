# Build log

This repo was built with Claude Code from a written plan. Each entry is the instruction given for one task.

## Task 1 — Start phase 4 from the phase 3 app

> Copy the tree of the phase 3 `main` branch without its history, with `git archive`. It already has the three `CLAUDE.md` files, `.claude/settings.json`, the format hook and the 100 % coverage gate. Remove the phase 3 ticket, exercises, slides, build log and `docs/superpowers/`. Remove each line that points to them. The README tells the `solution` branch and the `logs/`, `data/` and `scripts/migrations/` folders.

## Task 2 — Add the production logs

> Write two or three days of API logs of the production service in `logs/`, one JSON entry for each line, in the format of a cloud service: timestamp, severity, request ID, method, path, status, duration, message, and a stack trace for each 500. Most entries are normal traffic. Some entries are the errors that exercise 01 investigates. A failed request of the logs gives a 500 again on the local app.
