import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';

export const LEGACY_FILE = path.join(import.meta.dirname, '..', '..', '..', 'data', 'legacy.json');

const APPLY_OPTION = '--apply';
const DATABASE_OPTION = '--database';
const ISBN_SEPARATORS = /[\s-]/g;
const ISBN_13 = /^\d{13}$/;
const SPACES = /\s+/g;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SLASH_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})Z$/;
const TEXT_DATE = /^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/;
const TEXT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MIDNIGHT = '00:00:00';
const AUTHOR_SEPARATOR = ',';

export function parseArguments(argv) {
  let databasePath;
  let isApply = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === APPLY_OPTION) {
      isApply = true;
    } else if (argument === DATABASE_OPTION) {
      databasePath = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (databasePath === undefined) {
    throw new Error('Give the database file: --database <path>');
  }
  return { databasePath: path.resolve(databasePath), isApply };
}

function toTimestamp(year, month, day, time) {
  const timestamp = `${year}-${month}-${day}T${time}.000Z`;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== timestamp) {
    return undefined;
  }
  return timestamp;
}

export function parseLegacyDate(value) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const isoDate = ISO_DATE.exec(value);
  if (isoDate !== null) {
    return toTimestamp(isoDate[1], isoDate[2], isoDate[3], MIDNIGHT);
  }
  const slashDate = SLASH_DATE.exec(value);
  if (slashDate !== null) {
    return toTimestamp(slashDate[3], slashDate[2], slashDate[1], MIDNIGHT);
  }
  const isoDateTime = ISO_DATE_TIME.exec(value);
  if (isoDateTime !== null) {
    return toTimestamp(isoDateTime[1], isoDateTime[2], isoDateTime[3], isoDateTime[4]);
  }
  const textDate = TEXT_DATE.exec(value);
  if (textDate !== null) {
    const month = String(TEXT_MONTHS.indexOf(textDate[1]) + 1).padStart(2, '0');
    return toTimestamp(textDate[3], month, textDate[2].padStart(2, '0'), MIDNIGHT);
  }
  return undefined;
}

function toText(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(SPACES, ' ');
}

function parseAuthorName(value) {
  const author = toText(value);
  if (author === '') {
    return { reason: 'author is missing' };
  }
  const parts = author.split(AUTHOR_SEPARATOR).map(toText);
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
    return { reason: `author "${value}" is not "Last, First"` };
  }
  return { name: `${parts[1]} ${parts[0]}` };
}

function getAuthorKey(name) {
  return name.toLowerCase();
}

function convertBooks(rows, rejected) {
  const books = [];
  const bookByIsbn = new Map();
  const bookCodeByCode = new Map();
  const rejectedCodes = new Set();
  function reject(code, reason) {
    rejected.push({ kind: 'book', code, reason });
    rejectedCodes.add(code);
  }
  for (const row of rows) {
    const title = toText(row.title);
    const author = parseAuthorName(row.author);
    const isbn = toText(row.isbn).replace(ISBN_SEPARATORS, '');
    if (title === '') {
      reject(row.code, 'title is empty');
      continue;
    }
    if (author.reason !== undefined) {
      reject(row.code, author.reason);
      continue;
    }
    if (!ISBN_13.test(isbn)) {
      reject(row.code, `isbn "${row.isbn}" is not an ISBN-13`);
      continue;
    }
    const sameIsbnBook = bookByIsbn.get(isbn);
    if (sameIsbnBook !== undefined) {
      rejected.push({
        kind: 'book',
        code: row.code,
        reason: `duplicate of ${sameIsbnBook.code} (same ISBN)`,
      });
      bookCodeByCode.set(row.code, sameIsbnBook.code);
      continue;
    }
    const book = { code: row.code, title, authorName: author.name, isbn };
    books.push(book);
    bookByIsbn.set(isbn, book);
    bookCodeByCode.set(row.code, row.code);
  }
  return { books, bookCodeByCode, rejectedCodes };
}

function convertLoan(row, converted) {
  const bookCode = converted.bookCodeByCode.get(row.book);
  if (bookCode === undefined) {
    if (converted.rejectedCodes.has(row.book)) {
      return { reason: `book ${row.book} is rejected` };
    }
    return { reason: `book ${row.book} is not in the file` };
  }
  const borrower = toText(row.member);
  if (borrower === '') {
    return { reason: 'member is empty' };
  }
  const borrowedAt = parseLegacyDate(row.out);
  if (borrowedAt === undefined) {
    return { reason: `out "${row.out}" is not a date` };
  }
  if (row.back === null) {
    return { loan: { code: row.code, bookCode, borrower, borrowedAt, returnedAt: null } };
  }
  const returnedAt = parseLegacyDate(row.back);
  if (returnedAt === undefined) {
    return { reason: `back "${row.back}" is not a date` };
  }
  if (returnedAt < borrowedAt) {
    return { reason: `back "${row.back}" is before out "${row.out}"` };
  }
  return { loan: { code: row.code, bookCode, borrower, borrowedAt, returnedAt } };
}

function findBooksWithManyOpenLoans(loans) {
  const openLoanCodesByBookCode = new Map();
  for (const loan of loans) {
    if (loan.returnedAt === null) {
      const codes = openLoanCodesByBookCode.get(loan.bookCode) ?? [];
      openLoanCodesByBookCode.set(loan.bookCode, [...codes, loan.code]);
    }
  }
  return new Map([...openLoanCodesByBookCode].filter(([, codes]) => codes.length > 1));
}

function rejectManyOpenLoans(loans, rejected) {
  const openLoanCodesByBookCode = findBooksWithManyOpenLoans(loans);
  const keptLoans = [];
  for (const loan of loans) {
    const codes = openLoanCodesByBookCode.get(loan.bookCode);
    if (loan.returnedAt === null && codes !== undefined) {
      rejected.push({
        kind: 'loan',
        code: loan.code,
        reason: `book ${loan.bookCode} has ${codes.length} open loans (${codes.join(', ')}), a person must choose`,
      });
      continue;
    }
    keptLoans.push(loan);
  }
  return keptLoans;
}

function convertLoans(rows, converted, rejected) {
  const loans = [];
  const seenCodes = new Set();
  for (const row of rows) {
    if (seenCodes.has(row.code)) {
      rejected.push({
        kind: 'loan',
        code: row.code,
        reason: `duplicate of an earlier ${row.code} row`,
      });
      continue;
    }
    seenCodes.add(row.code);
    const result = convertLoan(row, converted);
    if (result.reason !== undefined) {
      rejected.push({ kind: 'loan', code: row.code, reason: result.reason });
      continue;
    }
    loans.push(result.loan);
  }
  return rejectManyOpenLoans(loans, rejected);
}

export function convertLegacy(legacy) {
  if (!Array.isArray(legacy.books) || !Array.isArray(legacy.loans)) {
    throw new Error('The legacy file must have a books list and a loans list');
  }
  const rejected = [];
  const converted = convertBooks(legacy.books, rejected);
  const loans = convertLoans(legacy.loans, converted, rejected);
  return { books: converted.books, loans, rejected };
}

function getLoanKey(bookId, borrower, borrowedAt) {
  return `${bookId}|${borrower}|${borrowedAt}`;
}

async function readDatabase(executor) {
  const authors = (await executor.execute('SELECT id, name FROM authors')).rows;
  const books = (await executor.execute('SELECT id, isbn FROM books')).rows;
  const loans = (
    await executor.execute('SELECT book_id, borrower, borrowed_at, returned_at FROM loans')
  ).rows;
  return {
    authorIdByKey: new Map(authors.map((row) => [getAuthorKey(String(row.name)), Number(row.id)])),
    bookIdByIsbn: new Map(books.map((row) => [String(row.isbn), Number(row.id)])),
    loanKeys: new Set(
      loans.map((row) =>
        getLoanKey(Number(row.book_id), String(row.borrower), String(row.borrowed_at)),
      ),
    ),
    openBookIds: new Set(
      loans.filter((row) => row.returned_at === null).map((row) => Number(row.book_id)),
    ),
  };
}

function planAuthors(allBooks, booksToCreate, existing) {
  const toCreate = new Map();
  for (const book of booksToCreate) {
    const key = getAuthorKey(book.authorName);
    if (!existing.authorIdByKey.has(key)) {
      toCreate.set(key, book.authorName);
    }
  }
  const alreadyThere = new Set(
    allBooks
      .map((book) => getAuthorKey(book.authorName))
      .filter((key) => existing.authorIdByKey.has(key)),
  );
  return { toCreate: [...toCreate.values()], alreadyThere: alreadyThere.size };
}

function planLoans(converted, existing) {
  const bookByCode = new Map(converted.books.map((book) => [book.code, book]));
  const toCreate = [];
  const rejected = [];
  let alreadyThere = 0;
  for (const loan of converted.loans) {
    const book = bookByCode.get(loan.bookCode);
    const bookId = existing.bookIdByIsbn.get(book.isbn);
    const loanToCreate = { ...loan, isbn: book.isbn };
    if (bookId === undefined) {
      toCreate.push(loanToCreate);
      continue;
    }
    if (existing.loanKeys.has(getLoanKey(bookId, loan.borrower, loan.borrowedAt))) {
      alreadyThere += 1;
      continue;
    }
    if (loan.returnedAt === null && existing.openBookIds.has(bookId)) {
      rejected.push({
        kind: 'loan',
        code: loan.code,
        reason: `book ${loan.bookCode} is already borrowed in the database`,
      });
      continue;
    }
    toCreate.push(loanToCreate);
  }
  return { toCreate, alreadyThere, rejected };
}

async function planMigration(executor, converted) {
  const existing = await readDatabase(executor);
  const books = converted.books.filter((book) => !existing.bookIdByIsbn.has(book.isbn));
  const loans = planLoans(converted, existing);
  return {
    existing,
    authors: planAuthors(converted.books, books, existing),
    books: { toCreate: books, alreadyThere: converted.books.length - books.length },
    loans: { toCreate: loans.toCreate, alreadyThere: loans.alreadyThere },
    rejected: [...converted.rejected, ...loans.rejected],
  };
}

async function applyPlan(transaction, plan) {
  const authorIdByKey = new Map(plan.existing.authorIdByKey);
  const bookIdByIsbn = new Map(plan.existing.bookIdByIsbn);
  for (const name of plan.authors.toCreate) {
    const result = await transaction.execute({
      sql: 'INSERT INTO authors (name) VALUES (?) RETURNING id',
      args: [name],
    });
    authorIdByKey.set(getAuthorKey(name), Number(result.rows[0].id));
  }
  for (const book of plan.books.toCreate) {
    const result = await transaction.execute({
      sql: 'INSERT INTO books (title, isbn, author_id) VALUES (?, ?, ?) RETURNING id',
      args: [book.title, book.isbn, authorIdByKey.get(getAuthorKey(book.authorName))],
    });
    bookIdByIsbn.set(book.isbn, Number(result.rows[0].id));
  }
  for (const loan of plan.loans.toCreate) {
    const bookId = bookIdByIsbn.get(loan.isbn);
    await transaction.execute({
      sql: 'INSERT INTO loans (book_id, borrower, borrowed_at, returned_at) VALUES (?, ?, ?, ?)',
      args: [bookId, loan.borrower, loan.borrowedAt, loan.returnedAt],
    });
    if (loan.returnedAt === null) {
      await transaction.execute({
        sql: 'UPDATE books SET is_available = 0 WHERE id = ?',
        args: [bookId],
      });
    }
  }
}

async function planAndApply(client, converted) {
  const transaction = await client.transaction('write');
  try {
    const plan = await planMigration(transaction, converted);
    await applyPlan(transaction, plan);
    await transaction.commit();
    return plan;
  } finally {
    transaction.close();
  }
}

export function formatReport(plan, isApply) {
  const created = isApply ? 'created' : 'to create';
  const lines = [
    isApply
      ? 'Legacy migration: --apply, the rows to create are written.'
      : 'Legacy migration: dry run, nothing is written.',
    `Authors: ${plan.authors.toCreate.length} ${created}, ${plan.authors.alreadyThere} already there`,
    `Books: ${plan.books.toCreate.length} ${created}, ${plan.books.alreadyThere} already there`,
    `Loans: ${plan.loans.toCreate.length} ${created}, ${plan.loans.alreadyThere} already there`,
    `Rejected: ${plan.rejected.length}`,
    ...plan.rejected.map((rejected) => `  ${rejected.kind} ${rejected.code}: ${rejected.reason}`),
  ];
  if (isApply) {
    lines.push(
      `Written: ${plan.authors.toCreate.length} authors, ${plan.books.toCreate.length} books, ${plan.loans.toCreate.length} loans.`,
    );
  } else {
    lines.push('Dry run: nothing written. Run again with --apply to write.');
  }
  return lines;
}

export async function runMigration({ databasePath, isApply, legacyFile }, print) {
  if (!existsSync(databasePath)) {
    throw new Error(`No database at ${databasePath}. Run npm run back once to create it.`);
  }
  const converted = convertLegacy(JSON.parse(readFileSync(legacyFile, 'utf8')));
  const client = createClient({ url: pathToFileURL(databasePath).href });
  try {
    const plan = isApply
      ? await planAndApply(client, converted)
      : await planMigration(client, converted);
    for (const line of formatReport(plan, isApply)) {
      print(line);
    }
  } finally {
    client.close();
  }
}
