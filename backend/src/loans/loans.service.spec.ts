import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { BooksService } from '../books/books.service';
import { createDatabase } from '../db/database';
import { LoansService } from './loans.service';

describe('LoansService', () => {
  let booksService: BooksService;
  let loansService: LoansService;
  let bookId: number;

  beforeEach(async () => {
    const database = await createDatabase(':memory:');
    booksService = new BooksService(database);
    loansService = new LoansService(database, booksService);
    const [firstBook] = await booksService.list();
    bookId = firstBook.id;
  });

  it('borrows an available book and marks it unavailable', async () => {
    const loan = await loansService.borrow({ bookId, borrower: 'Ada' });
    expect(loan.returnedAt).toBeNull();
    expect((await booksService.getById(bookId)).isAvailable).toBe(false);
  });

  it('rejects borrowing an unavailable book', async () => {
    await loansService.borrow({ bookId, borrower: 'Ada' });
    await expect(loansService.borrow({ bookId, borrower: 'Grace' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects a loan with an empty borrower', async () => {
    await expect(loansService.borrow({ bookId, borrower: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a loan without a book id', async () => {
    await expect(loansService.borrow({ borrower: 'Ada' })).rejects.toThrow(BadRequestException);
  });

  it('rejects borrowing a missing book', async () => {
    await expect(loansService.borrow({ bookId: 999, borrower: 'Ada' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns a loan and marks the book available again', async () => {
    const loan = await loansService.borrow({ bookId, borrower: 'Ada' });
    const returnedLoan = await loansService.returnLoan(loan.id);
    expect(returnedLoan.returnedAt).toBeTypeOf('string');
    expect((await booksService.getById(bookId)).isAvailable).toBe(true);
  });

  it('rejects returning a loan twice and keeps the first return date', async () => {
    const loan = await loansService.borrow({ bookId, borrower: 'Ada' });
    const returnedLoan = await loansService.returnLoan(loan.id);
    await loansService.borrow({ bookId, borrower: 'Grace' });
    await expect(loansService.returnLoan(loan.id)).rejects.toThrow(ConflictException);
    const [storedLoan] = (await loansService.list()).filter((item) => item.id === loan.id);
    expect(storedLoan.returnedAt).toBe(returnedLoan.returnedAt);
    expect((await booksService.getById(bookId)).isAvailable).toBe(false);
  });

  it('rejects returning a missing loan', async () => {
    await expect(loansService.returnLoan(999)).rejects.toThrow(NotFoundException);
  });

  it('lists the loans', async () => {
    await loansService.borrow({ bookId, borrower: 'Ada' });
    expect(await loansService.list()).toHaveLength(1);
  });
});
