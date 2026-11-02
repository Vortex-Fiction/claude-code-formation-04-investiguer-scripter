import type { Database } from './database';
import { authors, books } from './schema';

const SEED_AUTHORS = ['Jane Austen', 'Jules Verne', 'Mary Shelley'];

const SEED_BOOKS = [
  { title: 'Pride and Prejudice', isbn: '9780141439518', authorName: 'Jane Austen' },
  { title: 'Emma', isbn: '9780141439587', authorName: 'Jane Austen' },
  {
    title: 'Twenty Thousand Leagues Under the Seas',
    isbn: '9780199539277',
    authorName: 'Jules Verne',
  },
  { title: 'Around the World in Eighty Days', isbn: '9780199552566', authorName: 'Jules Verne' },
  { title: 'Frankenstein', isbn: '9780141439471', authorName: 'Mary Shelley' },
  { title: 'The Last Man', isbn: '9780199552351', authorName: 'Mary Shelley' },
];

export async function seedDatabase(database: Database): Promise<void> {
  const existingAuthors = await database.select().from(authors).limit(1);
  if (existingAuthors.length > 0) {
    return;
  }
  const insertedAuthors = await database
    .insert(authors)
    .values(SEED_AUTHORS.map((name) => ({ name })))
    .returning();
  const authorIdByName = new Map(insertedAuthors.map((author) => [author.name, author.id]));
  await database.insert(books).values(
    SEED_BOOKS.map((book) => {
      const authorId = authorIdByName.get(book.authorName);
      if (authorId === undefined) {
        throw new Error(`Seed author not found: ${book.authorName}`);
      }
      return { title: book.title, isbn: book.isbn, authorId };
    }),
  );
}
