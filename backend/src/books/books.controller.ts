import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import type { Book, BookWithAuthor } from '@formation/shared';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(@Inject(BooksService) private readonly booksService: BooksService) {}

  @Get()
  list(): Promise<BookWithAuthor[]> {
    return this.booksService.list();
  }

  @Post()
  create(@Body() body: unknown): Promise<Book> {
    return this.booksService.create(body);
  }
}
