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

function requireIsbn(value: unknown): string {
  const isbn = normalizeIsbn(requireText(value, 'isbn'));
  return requireText(isbn, 'isbn');
}

export function parseCreateBookInput(body: unknown): CreateBookInput {
  const fields = requireObject(body);
  return {
    title: requireText(fields.title, 'title'),
    isbn: requireIsbn(fields.isbn),
    authorId: requireInteger(fields.authorId, 'authorId'),
  };
}
