import { Module } from '@nestjs/common';
import { AuthorsController } from './authors/authors.controller';
import { AuthorsService } from './authors/authors.service';
import { BooksController } from './books/books.controller';
import { BooksService } from './books/books.service';
import { DatabaseModule } from './db/database.module';
import { LoansController } from './loans/loans.controller';
import { LoansService } from './loans/loans.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthorsController, BooksController, LoansController],
  providers: [AuthorsService, BooksService, LoansService],
})
export class AppModule {}
