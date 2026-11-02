import type { Author, BookWithAuthor, Loan } from '@formation/shared';

interface ErrorBody {
  message?: string | string[];
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

async function getErrorMessage(response: Response): Promise<string> {
  const body: ErrorBody = await response.json();
  if (Array.isArray(body.message)) {
    return body.message.join(', ');
  }
  return body.message ?? `Request failed with status ${response.status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.json();
}

export function listBooks(): Promise<BookWithAuthor[]> {
  return request('/api/books');
}

export function listAuthors(): Promise<Author[]> {
  return request('/api/authors');
}

export function createAuthor(name: string): Promise<Author> {
  return request('/api/authors', { method: 'POST', body: JSON.stringify({ name }) });
}

export function listLoans(): Promise<Loan[]> {
  return request('/api/loans');
}

export function borrowBook(bookId: number, borrower: string): Promise<Loan> {
  return request('/api/loans', { method: 'POST', body: JSON.stringify({ bookId, borrower }) });
}

export function returnLoan(id: number): Promise<Loan> {
  return request(`/api/loans/${id}/return`, { method: 'POST' });
}
