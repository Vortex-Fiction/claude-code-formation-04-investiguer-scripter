# scripts/migrations

## Rules

- Put each migration in its own folder: `scripts/migrations/<name>/`.
- A migration script is a dry run by default. It writes nothing.
- The dry run tells what the script creates, what is already in the database, and each row that it rejects, with the reason.
- A migration script writes to the database only with the `--apply` option.
- Make the script idempotent: a second run with `--apply` writes nothing.
- The script gets the path of the database as an option. Do not give it a default path.
- Test the script on a copy of the database or on an in-memory database. Do not use `backend/data/`.
- Do not run a migration script with `--apply`. Give the command to the person, and the person runs it.
- Delete the folder of the migration when the person tells you that the migration is done.

## Where things go

- A migration folder is an npm workspace, with a `package.json` that has a `test` and a `test:coverage` script. The root `package.json` includes `scripts/migrations/*` in its workspaces.
- The tests of `<name>.mjs` → `<name>.spec.mjs`, in the same folder.
- The command that runs the migration → a `migrate:<name>` script in the root `package.json`.

## Checks before done

- `npm test` and `npm run test:coverage` are green: the migration keeps 100 % coverage.
- A dry run on a copy of the database shows the report that you expect.
