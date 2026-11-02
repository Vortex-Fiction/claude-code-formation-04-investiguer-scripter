import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  isbn: text('isbn').notNull().unique(),
  authorId: integer('author_id')
    .notNull()
    .references(() => authors.id),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
});

export const loans = sqliteTable('loans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookId: integer('book_id')
    .notNull()
    .references(() => books.id),
  borrower: text('borrower').notNull(),
  borrowedAt: text('borrowed_at').notNull(),
  returnedAt: text('returned_at'),
});
