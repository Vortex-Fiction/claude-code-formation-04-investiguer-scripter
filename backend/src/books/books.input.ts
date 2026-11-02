import { requireInteger, requireObject, requireText } from '../validation';

export interface CreateBookInput {
  title: string;
  isbn: string;
  authorId: number;
}

export function parseCreateBookInput(body: unknown): CreateBookInput {
  const fields = requireObject(body);
  return {
    title: requireText(fields.title, 'title'),
    isbn: requireText(fields.isbn, 'isbn'),
    authorId: requireInteger(fields.authorId, 'authorId'),
  };
}
