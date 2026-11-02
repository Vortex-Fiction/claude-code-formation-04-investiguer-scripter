import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../backend/src/db/database.ts';
import {
  LEGACY_FILE,
  convertLegacy,
  parseArguments,
  parseLegacyDate,
  runMigration,
} from './legacy.mjs';

const MAIN_FILE = path.join(import.meta.dirname, 'main.mjs');

function book(code, fields = {}) {
  return {
    code,
    title: 'The Salt Orchard',
    author: 'Marchand, Hélène',
    isbn: '9782910402037',
    ...fields,
  };
}

function loan(code, fields = {}) {
  return {
    code,
    book: 'BK-0001',
    member: 'Lucie Fortin',
    out: '2025-03-14',
    back: '2025-03-28',
    ...fields,
  };
}

function reasonsOf(converted) {
  return converted.rejected.map(
    (rejected) => `${rejected.kind} ${rejected.code}: ${rejected.reason}`,
  );
}

describe('parseArguments', () => {
  it('reads the database path and the apply option', () => {
    expect(parseArguments(['--database', 'copy.db', '--apply'])).toEqual({
      databasePath: path.resolve('copy.db'),
      isApply: true,
    });
  });

  it('is a dry run without the apply option', () => {
    expect(parseArguments(['--database', 'copy.db']).isApply).toBe(false);
  });

  it('rejects a call without a database path', () => {
    expect(() => parseArguments(['--apply'])).toThrow('--database <path>');
  });

  it('rejects an unknown option', () => {
    expect(() => parseArguments(['--database', 'copy.db', '--force'])).toThrow(
      'Unknown option: --force',
    );
  });
});

describe('parseLegacyDate', () => {
  it('reads each date format of the old app', () => {
    expect(parseLegacyDate('2025-03-14')).toBe('2025-03-14T00:00:00.000Z');
    expect(parseLegacyDate('14/03/2025')).toBe('2025-03-14T00:00:00.000Z');
    expect(parseLegacyDate('2025-03-14T10:22:00Z')).toBe('2025-03-14T10:22:00.000Z');
    expect(parseLegacyDate('Mar 4, 2025')).toBe('2025-03-04T00:00:00.000Z');
  });

  it('rejects a date that is not in the calendar', () => {
    expect(parseLegacyDate('31/02/2025')).toBeUndefined();
    expect(parseLegacyDate('2025-03-14T10:75:00Z')).toBeUndefined();
    expect(parseLegacyDate('Foo 4, 2025')).toBeUndefined();
  });

  it('rejects a text or a value that is not a date', () => {
    expect(parseLegacyDate('last week')).toBeUndefined();
    expect(parseLegacyDate(20250314)).toBeUndefined();
  });
});

describe('convertLegacy', () => {
  it('converts the author to "First Last" and removes the ISBN hyphens', () => {
    const converted = convertLegacy({
      books: [book('BK-0001', { author: ' Lindqvist,  Tobias ', isbn: '978-2-9104-0203-7' })],
      loans: [],
    });
    expect(converted.books).toEqual([
      {
        code: 'BK-0001',
        title: 'The Salt Orchard',
        authorName: 'Tobias Lindqvist',
        isbn: '9782910402037',
      },
    ]);
  });

  it('converts a loan, with the member as the borrower', () => {
    const converted = convertLegacy({
      books: [book('BK-0001')],
      loans: [loan('LN-0001', { member: ' Lucie  Fortin', back: null })],
    });
    expect(converted.loans).toEqual([
      {
        code: 'LN-0001',
        bookCode: 'BK-0001',
        borrower: 'Lucie Fortin',
        borrowedAt: '2025-03-14T00:00:00.000Z',
        returnedAt: null,
      },
    ]);
  });

  it('rejects each broken book row with its reason', () => {
    const converted = convertLegacy({
      books: [
        book('BK-0001', { title: '' }),
        book('BK-0002', { title: null }),
        book('BK-0003', { author: null }),
        book('BK-0004', { author: 'Rafael Quintero' }),
        book('BK-0005', { author: ', Rafael' }),
        book('BK-0006', { author: 'Quintero,' }),
        book('BK-0007', { isbn: 'N/A' }),
      ],
      loans: [],
    });
    expect(converted.books).toEqual([]);
    expect(reasonsOf(converted)).toEqual([
      'book BK-0001: title is empty',
      'book BK-0002: title is empty',
      'book BK-0003: author is missing',
      'book BK-0004: author "Rafael Quintero" is not "Last, First"',
      'book BK-0005: author ", Rafael" is not "Last, First"',
      'book BK-0006: author "Quintero," is not "Last, First"',
      'book BK-0007: isbn "N/A" is not an ISBN-13',
    ]);
  });

  it('rejects a duplicated book and moves its loans to the first book', () => {
    const converted = convertLegacy({
      books: [
        book('BK-0001'),
        book('BK-0002', { title: 'THE SALT ORCHARD', isbn: '978-2-9104-0203-7' }),
      ],
      loans: [loan('LN-0001', { book: 'BK-0002' })],
    });
    expect(converted.books.map((item) => item.code)).toEqual(['BK-0001']);
    expect(reasonsOf(converted)).toEqual(['book BK-0002: duplicate of BK-0001 (same ISBN)']);
    expect(converted.loans[0].bookCode).toBe('BK-0001');
  });

  it('rejects each broken loan row with its reason', () => {
    const converted = convertLegacy({
      books: [book('BK-0001'), book('BK-0002', { title: '' })],
      loans: [
        loan('LN-0001'),
        loan('LN-0001'),
        loan('LN-0002', { book: 'BK-0099' }),
        loan('LN-0003', { book: 'BK-0002' }),
        loan('LN-0004', { member: '' }),
        loan('LN-0005', { out: 'last week' }),
        loan('LN-0006', { back: '31/02/2025' }),
        loan('LN-0007', { out: '2025-08-20', back: '2025-08-02' }),
        loan('LN-0008', { back: null }),
        loan('LN-0009', { out: '2025-09-01', back: null }),
      ],
    });
    expect(converted.loans.map((item) => item.code)).toEqual(['LN-0001']);
    expect(reasonsOf(converted)).toEqual([
      'book BK-0002: title is empty',
      'loan LN-0001: duplicate of an earlier LN-0001 row',
      'loan LN-0002: book BK-0099 is not in the file',
      'loan LN-0003: book BK-0002 is rejected',
      'loan LN-0004: member is empty',
      'loan LN-0005: out "last week" is not a date',
      'loan LN-0006: back "31/02/2025" is not a date',
      'loan LN-0007: back "2025-08-02" is before out "2025-08-20"',
      'loan LN-0008: book BK-0001 has 2 open loans (LN-0008, LN-0009), a person must choose',
      'loan LN-0009: book BK-0001 has 2 open loans (LN-0008, LN-0009), a person must choose',
    ]);
  });

  it('rejects a file without a books list and a loans list', () => {
    expect(() => convertLegacy({ books: [] })).toThrow('a books list and a loans list');
  });
});

describe('runMigration', () => {
  let folder;
  let databasePath;

  async function readTables() {
    const client = createClient({ url: pathToFileURL(databasePath).href });
    const tables = {
      authors: (await client.execute('SELECT * FROM authors ORDER BY id')).rows,
      books: (await client.execute('SELECT * FROM books ORDER BY id')).rows,
      loans: (await client.execute('SELECT * FROM loans ORDER BY id')).rows,
    };
    client.close();
    return JSON.parse(JSON.stringify(tables));
  }

  async function migrate(isApply, legacyFile = LEGACY_FILE) {
    const lines = [];
    await runMigration({ databasePath, isApply, legacyFile }, (line) => lines.push(line));
    return lines;
  }

  function writeLegacy(legacy) {
    const legacyFile = path.join(folder, 'legacy.json');
    writeFileSync(legacyFile, JSON.stringify(legacy));
    return legacyFile;
  }

  beforeEach(async () => {
    folder = mkdtempSync(path.join(os.tmpdir(), 'legacy-migration-'));
    databasePath = path.join(folder, 'library.db');
    const database = await createDatabase(pathToFileURL(databasePath).href);
    database.$client.close();
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it('writes nothing in a dry run, and tells what it will do', async () => {
    const before = await readTables();
    const lines = await migrate(false);
    expect(await readTables()).toEqual(before);
    expect(lines[0]).toBe('Legacy migration: dry run, nothing is written.');
    expect(lines).toContain('Authors: 15 to create, 2 already there');
    expect(lines).toContain('Books: 38 to create, 2 already there');
    expect(lines.at(-1)).toBe('Dry run: nothing written. Run again with --apply to write.');
  });

  it('writes the rows with --apply, and a second --apply writes nothing', async () => {
    const firstLines = await migrate(true);
    expect(firstLines).toContain('Written: 15 authors, 38 books, 55 loans.');
    const afterFirst = await readTables();
    expect(afterFirst.authors).toHaveLength(18);
    expect(afterFirst.books).toHaveLength(44);

    const secondLines = await migrate(true);
    expect(await readTables()).toEqual(afterFirst);
    expect(secondLines).toContain('Authors: 0 created, 17 already there');
    expect(secondLines).toContain('Written: 0 authors, 0 books, 0 loans.');
  });

  it('gives a reason for each rejected row of the legacy file', async () => {
    const lines = await migrate(false);
    const rejectedLines = lines.filter((line) => line.startsWith('  '));
    expect(lines).toContain('Rejected: 17');
    expect(rejectedLines).toEqual([
      '  book BK-0039: title is empty',
      '  book BK-0040: author "Rafael Quintero" is not "Last, First"',
      '  book BK-0041: duplicate of BK-0007 (same ISBN)',
      '  book BK-0042: isbn "N/A" is not an ISBN-13',
      '  book BK-0045: duplicate of BK-0020 (same ISBN)',
      '  book BK-0046: author is missing',
      '  loan LN-0058: back "2025-08-02" is before out "2025-08-20"',
      '  loan LN-0059: out "31/02/2025" is not a date',
      '  loan LN-0060: book BK-0099 is not in the file',
      '  loan LN-0061: book BK-0039 is rejected',
      '  loan LN-0062: book BK-0120 is not in the file',
      '  loan LN-0012: duplicate of an earlier LN-0012 row',
      '  loan LN-0063: out "last week" is not a date',
      '  loan LN-0064: member is empty',
      '  loan LN-0023: duplicate of an earlier LN-0023 row',
      '  loan LN-0004: book BK-0033 has 2 open loans (LN-0004, LN-0057), a person must choose',
      '  loan LN-0057: book BK-0033 has 2 open loans (LN-0004, LN-0057), a person must choose',
    ]);
  });

  it('marks a book with an open loan as not available', async () => {
    await migrate(true);
    const tables = await readTables();
    const openLoans = tables.loans.filter((item) => item.returned_at === null);
    expect(openLoans.length).toBeGreaterThan(0);
    for (const openLoan of openLoans) {
      const loanBook = tables.books.find((item) => item.id === openLoan.book_id);
      expect(loanBook.is_available).toBe(0);
    }
  });

  it('rejects an open loan of a book that the database already lends', async () => {
    const client = createClient({ url: pathToFileURL(databasePath).href });
    await client.execute(
      "INSERT INTO loans (book_id, borrower, borrowed_at) VALUES (1, 'Ada', '2026-10-01T00:00:00.000Z')",
    );
    client.close();
    const legacyFile = writeLegacy({
      books: [
        book('BK-0001', {
          title: 'Pride and Prejudice',
          author: 'Austen, Jane',
          isbn: '9780141439518',
        }),
      ],
      loans: [loan('LN-0001', { back: null })],
    });
    const lines = await migrate(true, legacyFile);
    expect(lines).toContain('  loan LN-0001: book BK-0001 is already borrowed in the database');
    expect(lines).toContain('Written: 0 authors, 0 books, 0 loans.');
  });

  it('creates no author for a book that is already in the database', async () => {
    const before = await readTables();
    const legacyFile = writeLegacy({
      books: [
        book('BK-0001', {
          title: 'Pride and Prejudice',
          author: 'Doe, John',
          isbn: '9780141439518',
        }),
      ],
      loans: [],
    });
    const lines = await migrate(true, legacyFile);
    expect(lines).toContain('Written: 0 authors, 0 books, 0 loans.');
    expect(await readTables()).toEqual(before);
  });

  it('links a new book to the author that is already in the database', async () => {
    const legacyFile = writeLegacy({
      books: [
        book('BK-0001', { title: 'Persuasion', author: 'Austen, Jane', isbn: '9780141439686' }),
      ],
      loans: [],
    });
    const lines = await migrate(true, legacyFile);
    expect(lines).toContain('Written: 0 authors, 1 books, 0 loans.');
    const tables = await readTables();
    const austen = tables.authors.find((item) => item.name === 'Jane Austen');
    const persuasion = tables.books.find((item) => item.title === 'Persuasion');
    expect(persuasion.author_id).toBe(austen.id);
  });

  it('writes nothing when an insert fails during --apply', async () => {
    const client = createClient({ url: pathToFileURL(databasePath).href });
    await client.execute(
      "CREATE TRIGGER fail_loan_insert BEFORE INSERT ON loans BEGIN SELECT RAISE(ABORT, 'loan insert failed'); END",
    );
    client.close();
    const before = await readTables();
    await expect(migrate(true)).rejects.toThrow('loan insert failed');
    expect(await readTables()).toEqual(before);
  });

  it('stops when the database file does not exist', async () => {
    databasePath = path.join(folder, 'missing.db');
    await expect(migrate(false)).rejects.toThrow('No database at');
  });

  it('runs from the command line as a dry run', () => {
    const output = execFileSync(process.execPath, [MAIN_FILE, '--database', databasePath], {
      encoding: 'utf8',
    });
    expect(output).toContain('Legacy migration: dry run, nothing is written.');
  });
});
