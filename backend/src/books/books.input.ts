import { requireInteger, requireObject, requireText } from '../validation';

const ISBN_SEPARATORS = /[\s-]/g;

export interface CreateBookInput {
  title: string;
  isbn: string;
  authorId: number;
}

function normalizeIsbn(isbn: string): string {
  return isbn.replace(ISBN_SEPARATORS, '');
}

export function parseCreateBookInput(body: unknown): CreateBookInput {
  const fields = requireObject(body);
  return {
    title: requireText(fields.title, 'title'),
    isbn: normalizeIsbn(requireText(fields.isbn, 'isbn')),
    authorId: requireInteger(fields.authorId, 'authorId'),
  };
}
