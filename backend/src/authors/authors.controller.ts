import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import type { Author } from '@formation/shared';
import { AuthorsService } from './authors.service';

@Controller('authors')
export class AuthorsController {
  constructor(@Inject(AuthorsService) private readonly authorsService: AuthorsService) {}

  @Get()
  list(): Promise<Author[]> {
    return this.authorsService.list();
  }

  @Post()
  create(@Body() body: unknown): Promise<Author> {
    return this.authorsService.create(body);
  }
}
