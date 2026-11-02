import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Book, BookWithAuthor } from '@formation/shared';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/database';
import { DATABASE } from '../db/database.module';
import { authors, books } from '../db/schema';
import { parseCreateBookInput } from './books.input';

const ISBN_SEPARATORS = /[\s-]/g;

function normalizeIsbn(isbn: string): string {
  return isbn.replace(ISBN_SEPARATORS, '');
}

@Injectable()
export class BooksService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  list(): Promise<BookWithAuthor[]> {
    return this.database
      .select({
        id: books.id,
        title: books.title,
        isbn: books.isbn,
        authorId: books.authorId,
        isAvailable: books.isAvailable,
        authorName: authors.name,
      })
      .from(books)
      .innerJoin(authors, eq(books.authorId, authors.id));
  }

  async getById(id: number): Promise<Book> {
    const [book] = await this.database.select().from(books).where(eq(books.id, id));
    if (book === undefined) {
      throw new NotFoundException(`Book ${id} not found`);
    }
    return book;
  }

  async create(body: unknown): Promise<Book> {
    const input = parseCreateBookInput(body);
    const [author] = await this.database
      .select()
      .from(authors)
      .where(eq(authors.id, input.authorId));
    if (author === undefined) {
      throw new NotFoundException(`Author ${input.authorId} not found`);
    }
    const [sameIsbnBook] = await this.database
      .select()
      .from(books)
      .where(eq(books.isbn, input.isbn));
    if (sameIsbnBook !== undefined) {
      throw new ConflictException(`A book with ISBN ${input.isbn} already exists`);
    }
    const [book] = await this.database
      .insert(books)
      .values({ title: input.title, isbn: normalizeIsbn(input.isbn), authorId: input.authorId })
      .returning();
    return book;
  }
}
