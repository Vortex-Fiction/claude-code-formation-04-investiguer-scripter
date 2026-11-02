import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Global, Module } from '@nestjs/common';
import { createDatabase } from './database';

export const DATABASE = 'DATABASE';

const BACKEND_FOLDER = path.join(import.meta.dirname, '..');
const DATABASE_FILE = path.join(BACKEND_FOLDER, 'data', 'library.db');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => createDatabase(pathToFileURL(DATABASE_FILE).href),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
