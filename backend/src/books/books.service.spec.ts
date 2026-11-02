import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../db/database';
import { BooksService } from './books.service';

describe('BooksService', () => {
  let service: BooksService;

  beforeEach(async () => {
    service = new BooksService(await createDatabase(':memory:'));
  });

  it('lists the books with their author name', async () => {
    const books = await service.list();
    expect(books).toHaveLength(6);
    expect(books[0].authorName).toBeTypeOf('string');
  });

  it('creates a book for an existing author', async () => {
    const [firstBook] = await service.list();
    await service.create({
      title: 'Persuasion',
      isbn: '9780141439686',
      authorId: firstBook.authorId,
    });
    expect(await service.list()).toHaveLength(7);
  });

  it('rejects a book without a title', async () => {
    await expect(service.create({ isbn: '1', authorId: 1 })).rejects.toThrow(BadRequestException);
  });

  it('rejects a book with an empty isbn', async () => {
    await expect(service.create({ title: 'X', isbn: '', authorId: 1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects an author id that is not an integer', async () => {
    await expect(service.create({ title: 'X', isbn: '1', authorId: '1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a body that is not an object', async () => {
    await expect(service.create('book')).rejects.toThrow(BadRequestException);
  });

  it('rejects a book whose author does not exist', async () => {
    await expect(service.create({ title: 'X', isbn: '1', authorId: 999 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects a duplicated isbn', async () => {
    const [firstBook] = await service.list();
    await expect(
      service.create({ title: 'Copy', isbn: firstBook.isbn, authorId: firstBook.authorId }),
    ).rejects.toThrow(ConflictException);
  });

  it('gets a book by id', async () => {
    const [firstBook] = await service.list();
    expect((await service.getById(firstBook.id)).title).toBe(firstBook.title);
  });

  it('rejects a missing book id', async () => {
    await expect(service.getById(999)).rejects.toThrow(NotFoundException);
  });
});
