export interface Author {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  isbn: string;
  authorId: number;
  isAvailable: boolean;
}

export type BookWithAuthor = Book & { authorName: string };

export interface Loan {
  id: number;
  bookId: number;
  borrower: string;
  borrowedAt: string;
  returnedAt: string | null;
}
