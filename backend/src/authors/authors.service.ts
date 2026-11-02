import { Inject, Injectable } from '@nestjs/common';
import type { Author } from '@formation/shared';
import type { Database } from '../db/database';
import { DATABASE } from '../db/database.module';
import { authors } from '../db/schema';
import { parseCreateAuthorInput } from './authors.input';

@Injectable()
export class AuthorsService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  list(): Promise<Author[]> {
    return this.database.select().from(authors);
  }

  async create(body: unknown): Promise<Author> {
    const input = parseCreateAuthorInput(body);
    const [author] = await this.database.insert(authors).values({ name: input.name }).returning();
    return author;
  }
}
