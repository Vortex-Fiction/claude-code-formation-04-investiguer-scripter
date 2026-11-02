import process from 'node:process';
import { LEGACY_FILE, parseArguments, runMigration } from './legacy.mjs';

const { databasePath, isApply } = parseArguments(process.argv.slice(2));
await runMigration({ databasePath, isApply, legacyFile: LEGACY_FILE }, (line) =>
  process.stdout.write(`${line}\n`),
);
