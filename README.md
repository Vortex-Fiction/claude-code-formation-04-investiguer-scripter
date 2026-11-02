# Claude Code training — phase 4: investigate, script, capitalize

A small library app (books, authors, loans) used for the phase 4 exercises. The exercises are in [`exercices/`](exercices/) and the slides in [`slides.md`](slides.md). The `solution` branch has one possible answer for each exercise.

## Folders for the exercises

- `logs/` — the API logs of the production service, one JSON entry for each line.
- `data/` — an export of the old library app. [`data/README.md`](data/README.md) tells its schema.
- `scripts/migrations/` — one folder for each data migration. [`scripts/migrations/CLAUDE.md`](scripts/migrations/CLAUDE.md) tells the rules.

## Prerequisites

Install these tools before the session. You need Node.js 22.13 or later. On Windows, use an x64 computer: the SQLite driver has no Windows ARM build.

On Windows, first allow PowerShell to run the npm launcher (once per user):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

| Tool        | macOS (Homebrew)                  | Windows (winget, in PowerShell)       |
| ----------- | --------------------------------- | ------------------------------------- |
| Node.js LTS | `brew install node`               | `winget install OpenJS.NodeJS.LTS`    |
| git         | `brew install git`                | `winget install Git.Git`              |
| GitHub CLI  | `brew install gh`                 | `winget install GitHub.cli`           |
| Claude Code | `brew install --cask claude-code` | `winget install Anthropic.ClaudeCode` |

Close and open your terminal again after the installation, so that it finds the new commands.

Then, on both systems:

```bash
gh auth login
claude
```

`claude` asks you to sign in the first time.

## Run

```bash
git clone https://github.com/Vortex-Fiction/claude-code-formation-04-investiguer-scripter.git
cd claude-code-formation-04-investiguer-scripter
npm install
npm run back
```

`npm install` shows two messages that need no action:

- "13 moderate severity vulnerabilities": these advisories are in the ESLint tools that you use only to develop. Do not run `npm audit fix --force`. It installs old versions that break `npm run lint`.
- "install scripts blocked" for `esbuild` and `fsevents`: the tests, the lint and the app run without these scripts.

In a second terminal:

```bash
npm run front
```

- API: http://localhost:3000/api/books
- App: http://localhost:5173

The SQLite database is created in `backend/data/` on the first `npm run back`. To start again from the seed data, stop the API and delete `backend/data/`.

## Check

```bash
npm test
npm run test:coverage
npm run lint
npm run lint:doc
```

`npm run test:coverage` runs the backend tests with coverage. When a migration folder exists in `scripts/migrations/`, it also runs the tests of that migration. It fails when lines, branches, functions or statements go below 100 %. In the backend, it does not count `main.ts`, `db/database.module.ts` and `db/seed.ts`: `npm run back` runs them.

`npm run lint:doc` checks each `README.md`, `CLAUDE.md` and `SKILL.md`, and the incident reports in `docs/incidents/`, with Vale and the Simplified Technical English rules in `.vale/`. `npm install` downloads Vale. If `npm run lint:doc` tells you that Vale is missing, run `npm rebuild @vvago/vale`.
