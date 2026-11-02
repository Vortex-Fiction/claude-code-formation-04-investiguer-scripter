import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import * as esbuild from 'esbuild';

const BACKEND_FOLDER = path.join(import.meta.dirname, '..');
const OUTPUT_FILE = path.join(BACKEND_FOLDER, 'dist', 'main.js');

const context = await esbuild.context({
  entryPoints: [path.join(BACKEND_FOLDER, 'src', 'main.ts')],
  outfile: OUTPUT_FILE,
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  tsconfig: path.join(BACKEND_FOLDER, 'tsconfig.json'),
  logLevel: 'info',
});

await context.rebuild();
await context.watch();

spawn(process.execPath, ['--enable-source-maps', '--watch', OUTPUT_FILE], {
  cwd: BACKEND_FOLDER,
  stdio: 'inherit',
});
