# 2026-10-27 — `POST /api/books` returns 500 for a known ISBN with hyphens

## Symptom

Since 2026-10-27, the API sometimes returns a 500. The logs of 2026-10-27, 2026-10-28 and 2026-10-29 have 8 requests with the status 500. All 8 are `POST /api/books` from `catalog-sync/2.3.1`.

## Cause

`BooksService.create` checked for a duplicate ISBN with the ISBN of the request, as the client wrote it. Then it inserted the ISBN without hyphens and spaces. The database keeps each ISBN without hyphens.

When the client sends an ISBN that is already in the catalog, with hyphens or spaces, the duplicate check finds no book. The insert then breaks the `UNIQUE` constraint on `books.isbn`. The API changes this database error into a 500.

## Evidence

- Each ERROR entry has a `requestBody` with hyphens or spaces in `isbn`, for example `978-0-1414-3951-8`.
- In the same entry, the failed query has the ISBN without hyphens, `9780141439518`. The cause is `SQLITE_CONSTRAINT: UNIQUE constraint failed: books.isbn`.
- `GET /api/books` on the local app shows `9780141439518` for "Pride and Prejudice". The ISBN is already in the catalog.
- On the local app, the request body of the logs gives a 500. The same body with `9780141439518` gives a 409 with "A book with ISBN 9780141439518 already exists".
- The logs have the same difference: a 409 for a known ISBN without hyphens, and a 201 for a new ISBN with hyphens.
- The first 500 is after the deploy of `library-api-00042-kex` on 2026-10-27 at 07:58.

## Leads that we did not keep

- Disk latency and API latency alerts. The nightly snapshot of `/data/library.db` causes them. Four failing requests are in an alert window, but the other four are not. Each 500 took 9 ms to 17 ms. The slow requests in the alert windows all return 200 or 201.
- A lock on the database. No entry has `SQLITE_BUSY`. Each failing request has the same cause, a `UNIQUE` constraint, at all times of the day.

## Fix

`parseCreateBookInput` in `backend/src/books/books.input.ts` removes the hyphens and the spaces from the ISBN. The duplicate check and the insert now use the same ISBN. A known ISBN with hyphens now gets a 409.

Tests that failed before the fix:

- `books.service.spec.ts` — "rejects a duplicated isbn written with hyphens or spaces".
- `app.module.spec.ts` — "answers 409, not 500, for a known isbn written with hyphens".

## Next time

- A 500 with `SQLITE_CONSTRAINT` is a check in the code that does not agree with a constraint in the database. Compare the value that the code checks with the value that it writes.
- Compare the `requestBody` of the ERROR entry with the `params` of the failed query.
- Look for a deploy before the first error.
