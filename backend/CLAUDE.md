# backend

## Rules

- esbuild bundles the API and does not emit decorator metadata. Give each constructor parameter an explicit `@Inject(Class)` or `@Inject(TOKEN)`.
- Each service validates its own input with the `parse…Input` function of `<entity>.input.ts`, built on the helpers of `src/validation.ts`. Do not add a `ValidationPipe` or `class-validator`.
- A controller passes the raw `@Body() body: unknown` to its service.
- Throw `NotFoundException` for a missing row and `ConflictException` for a forbidden state.
- Test a service with a real in-memory database: `createDatabase(':memory:')`. Do not use mocks.

## Where things go

- New entity → `src/<entity>/`: `<entity>.input.ts`, `<entity>.service.ts`, `<entity>.controller.ts`, `<entity>.service.spec.ts`.
- New entity → add its controller and its service to `AppModule` in `src/app.module.ts`.
- New table → `src/db/schema.ts` and `src/db/create-tables.ts`. `src/db/schema.spec.ts` checks that the two agree.
- New route → an HTTP test in `src/app.module.spec.ts`.

## Checks before done

- `curl http://localhost:3000/api/<entity>` returns the expected JSON when `npm run back` runs.

## Pointers

- `src/loans/` — the most complete example: input, service, controller and tests.
