import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PROJECT_FOLDER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRETTIER_CLI = path.join(PROJECT_FOLDER, 'node_modules', 'prettier', 'bin', 'prettier.cjs');

async function readStandardInput() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const hookInput = JSON.parse(await readStandardInput());
const filePath = hookInput.tool_input?.file_path;

if (typeof filePath === 'string') {
  spawnSync(process.execPath, [PRETTIER_CLI, '--write', '--ignore-unknown', filePath], {
    cwd: PROJECT_FOLDER,
    stdio: 'ignore',
  });
}
