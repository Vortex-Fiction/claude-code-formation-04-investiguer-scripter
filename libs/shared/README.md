# @formation/shared

The TypeScript types that the API and the app share. The lib has no runtime code.

## Public API

`src/index.ts` exports these types:

- `Author` — a person who wrote one or more books.
- `Book` — a book, with its ISBN and its availability.
- `BookWithAuthor` — a `Book` with the name of its author. `GET /api/books` returns this type.
- `Loan` — a book that a borrower borrows. `returnedAt` is `null` until the borrower returns the book.

## Usage

`backend` and `frontend` declare the lib as an npm workspace dependency. Import only types:

```ts
import type { Book, Loan } from '@formation/shared';
```

The lib has no build step. Each workspace reads `src/index.ts` directly.
