import { existsSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createDatabase } from './database';
import * as schema from './schema';
import { seedDatabase } from './seed';

describe('createDatabase', () => {
  it('creates the tables and seeds them on an empty database', async () => {
    const database = await createDatabase(':memory:');
    const authors = await database.select().from(schema.authors);
    const books = await database.select().from(schema.books);
    expect(authors).toHaveLength(3);
    expect(books).toHaveLength(6);
    expect(books.every((book) => book.isAvailable)).toBe(true);
  });

  it('does not seed twice', async () => {
    const database = await createDatabase(':memory:');
    await seedDatabase(database);
    expect(await database.select().from(schema.books)).toHaveLength(6);
  });

  it('creates the parent folder of a file database', async () => {
    const folder = mkdtempSync(path.join(os.tmpdir(), 'library-'));
    const file = path.join(folder, 'nested', 'library.db');
    await createDatabase(`file:${file}`);
    expect(existsSync(file)).toBe(true);
  });

  it('accepts a file URL built from a platform path', async () => {
    const folder = mkdtempSync(path.join(os.tmpdir(), 'library-'));
    const file = path.join(folder, 'nested', 'library.db');
    await createDatabase(pathToFileURL(file).href);
    expect(existsSync(file)).toBe(true);
  });
});
