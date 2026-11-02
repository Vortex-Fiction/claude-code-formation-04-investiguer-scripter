import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Loan } from '@formation/shared';
import { eq } from 'drizzle-orm';
import { BooksService } from '../books/books.service';
import type { Database } from '../db/database';
import { DATABASE } from '../db/database.module';
import { books, loans } from '../db/schema';
import { parseCreateLoanInput } from './loans.input';

@Injectable()
export class LoansService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    @Inject(BooksService) private readonly booksService: BooksService,
  ) {}

  list(): Promise<Loan[]> {
    return this.database.select().from(loans);
  }

  async borrow(body: unknown): Promise<Loan> {
    const input = parseCreateLoanInput(body);
    const book = await this.booksService.getById(input.bookId);
    if (!book.isAvailable) {
      throw new ConflictException(`Book ${book.id} is already borrowed`);
    }
    const [loan] = await this.database
      .insert(loans)
      .values({ bookId: book.id, borrower: input.borrower, borrowedAt: new Date().toISOString() })
      .returning();
    await this.database.update(books).set({ isAvailable: false }).where(eq(books.id, book.id));
    return loan;
  }

  async returnLoan(id: number): Promise<Loan> {
    const [existingLoan] = await this.database.select().from(loans).where(eq(loans.id, id));
    if (existingLoan === undefined) {
      throw new NotFoundException(`Loan ${id} not found`);
    }
    if (existingLoan.returnedAt !== null) {
      throw new ConflictException(`Loan ${id} is already returned`);
    }
    const [loan] = await this.database
      .update(loans)
      .set({ returnedAt: new Date().toISOString() })
      .where(eq(loans.id, id))
      .returning();
    await this.database
      .update(books)
      .set({ isAvailable: true })
      .where(eq(books.id, existingLoan.bookId));
    return loan;
  }
}
