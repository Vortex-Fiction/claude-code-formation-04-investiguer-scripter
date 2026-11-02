# data

`legacy.json` is an export of the old library app, BiblioDesk. The borrowers in the file are not real people.

## Schema

The file is one JSON object:

- `exportedFrom` — the name and the version of the old app.
- `exportedAt` — the date and the time of the export.
- `books` — the list of books.
- `loans` — the list of loans.

Each item of `books` has these fields:

- `code` — the book code in the old app, for example `BK-0001`.
- `title` — the title of the book.
- `author` — the name of the author, as `Last, First`.
- `isbn` — the ISBN of the book, with or without hyphens.
- `added` — the date when the old app got the book.

Each item of `loans` has these fields:

- `code` — the loan code in the old app, for example `LN-0001`.
- `book` — the `code` of the book.
- `member` — the name of the borrower.
- `out` — the date when the borrower borrowed the book.
- `back` — the date when the borrower returned the book, or `null` when the book is not returned.

A date with slashes is `day/month/year`.
