import { requireInteger, requireObject, requireText } from '../validation';

export interface CreateLoanInput {
  bookId: number;
  borrower: string;
}

export function parseCreateLoanInput(body: unknown): CreateLoanInput {
  const fields = requireObject(body);
  return {
    bookId: requireInteger(fields.bookId, 'bookId'),
    borrower: requireText(fields.borrower, 'borrower'),
  };
}
