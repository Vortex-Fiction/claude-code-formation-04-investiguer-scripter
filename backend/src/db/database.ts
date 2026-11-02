import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { CREATE_TABLES_SQL } from './create-tables';
import * as schema from './schema';
import { seedDatabase } from './seed';

export type Database = LibSQLDatabase<typeof schema>;

const FILE_URL_PREFIX = 'file:';
const FILE_URL_WITH_HOST_PREFIX = 'file://';

function getFilePath(url: string): string {
  if (url.startsWith(FILE_URL_WITH_HOST_PREFIX)) {
    return fileURLToPath(url);
  }
  return url.slice(FILE_URL_PREFIX.length);
}

export async function createDatabase(url: string): Promise<Database> {
  if (url.startsWith(FILE_URL_PREFIX)) {
    mkdirSync(path.dirname(getFilePath(url)), { recursive: true });
  }
  const client = createClient({ url });
  await client.executeMultiple(CREATE_TABLES_SQL);
  const database = drizzle(client, { schema });
  await seedDatabase(database);
  return database;
}
