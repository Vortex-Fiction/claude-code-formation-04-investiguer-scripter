import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Author, Book, BookWithAuthor, Loan } from '@formation/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from './app.module';
import { createDatabase } from './db/database';
import { DATABASE } from './db/database.module';

const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const ANY_FREE_PORT = 0;

describe('AppModule over HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;

  async function get(path: string): Promise<Response> {
    return fetch(`${baseUrl}${path}`);
  }

  async function post(path: string, body?: object): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  }

  async function getFirstBook(): Promise<BookWithAuthor> {
    const books: BookWithAuthor[] = await (await get('/books')).json();
    return books[0];
  }

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE)
      .useFactory({ factory: () => createDatabase(':memory:') })
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(ANY_FREE_PORT);
    baseUrl = await app.getUrl();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists the authors and creates one', async () => {
    const created = await post('/authors', { name: 'Charlotte Brontë' });
    expect(created.status).toBe(HTTP_CREATED);
    const authors: Author[] = await (await get('/authors')).json();
    expect(authors.map((author) => author.name)).toContain('Charlotte Brontë');
  });

  it('lists the books and creates one', async () => {
    const firstBook = await getFirstBook();
    const created = await post('/books', {
      title: 'Persuasion',
      isbn: '9780141439686',
      authorId: firstBook.authorId,
    });
    expect(created.status).toBe(HTTP_CREATED);
    const book: Book = await created.json();
    expect(book.title).toBe('Persuasion');
  });

  it('borrows a book, lists the loan and returns it', async () => {
    const firstBook = await getFirstBook();
    const borrowed = await post('/loans', { bookId: firstBook.id, borrower: 'Ada' });
    expect(borrowed.status).toBe(HTTP_CREATED);
    const loan: Loan = await borrowed.json();
    const loans: Loan[] = await (await get('/loans')).json();
    expect(loans.map((item) => item.id)).toEqual([loan.id]);
    const returned = await post(`/loans/${loan.id}/return`);
    expect(returned.status).toBe(HTTP_CREATED);
    const returnedLoan: Loan = await returned.json();
    expect(returnedLoan.returnedAt).toBeTypeOf('string');
  });

  it('maps the service errors to HTTP status codes', async () => {
    const firstBook = await getFirstBook();
    await post('/loans', { bookId: firstBook.id, borrower: 'Ada' });
    expect((await post('/loans', { bookId: firstBook.id, borrower: 'Grace' })).status).toBe(
      HTTP_CONFLICT,
    );
    expect((await post('/loans', { borrower: 'Ada' })).status).toBe(HTTP_BAD_REQUEST);
    expect((await post('/loans/999/return')).status).toBe(HTTP_NOT_FOUND);
  });

  it('rejects a loan id that is not an integer', async () => {
    expect((await post('/loans/first/return')).status).toBe(HTTP_BAD_REQUEST);
  });
});
