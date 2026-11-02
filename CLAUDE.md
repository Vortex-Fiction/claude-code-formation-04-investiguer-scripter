# Claude Code training — library app

npm workspaces monorepo: `backend` (NestJS API), `frontend` (Vue 3 app), `libs/shared` (shared types).

## Rules

- Write code, comments and documentation in English.
- Do not add a comment that repeats the code. Add a comment only to tell why.
- Do not use `any`. Do not use the `!` non-null assertion.
- Write the failing test first, see it fail, then write the code.
- Do not add a feature, an option or a file that the task does not ask for.
- Run one simple command per Bash call. Do not chain commands with `&&`, `||` or `;`.
- Do not add a shell script. Write a script in Node, so that it runs on Windows and macOS.
- Write each `README.md`, `CLAUDE.md`, `SKILL.md` and incident report in Simplified Technical English, with the terms of `.vale/styles/STE/Glossary.yml`.
- When a code change alters what a `README.md` tells, update the `README.md` in the same commit.
- Write one commit per task: `<type>(<scope>): <Subject>`, for example `fix(loans): Reject a second return`.

## Where things go

- A type that the API and the app share → `libs/shared/src/index.ts`.
- A rule for one workspace only → the `CLAUDE.md` of that workspace.
- An incident report → `docs/incidents/<date>-<slug>.md`.

## Checks before done

- `npm test` is green.
- `npm run test:coverage` is green: the backend keeps 100 % coverage.
- `npm run lint` is green.
- `npm run lint:doc` is green when you change a `README.md`, a `CLAUDE.md`, a `SKILL.md` or an incident report.

## Pointers

- `README.md` — prerequisites, run and check commands.
- `libs/shared/README.md` — the shared types.
- `data/README.md` — the schema of the old app export.
- `scripts/migrations/CLAUDE.md` — the rules for a data migration script.
