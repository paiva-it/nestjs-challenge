# General Notes

- Suggest different folder structure (module-first, then type) — kept original for PR readability and easier diff comparison.
- Add tests after committing the first version of the implementation for clearer focus on implementation and easier bug isolation.

# AI Usage

- ChatGPT for theoretical high-level architecture discussion and validation.
- ChatGPT + documentation for best practices validation.
- ChatGPT for code snippet review (not generation) — DTOs, config, builders, helpers (bug checks, improvements, best practices).
- Copilot inline autocomplete suggestions.
- Copilot Agent for documentation cleanup.

# Refactor app configuration to use @nestjs/config

- Updated `main.ts` to use `ConfigService` for host/port.
- Updated `app.module.ts` to use `MongooseModule.forRootAsync` with `ConfigService` instead of legacy direct call.
- Removed legacy `app.config.ts` in favor of modular config (`server`, `mongodb`, `pagination`).
- Added Joi validation for environment variables (`env.validation.ts`).
- Split configuration into dedicated files for scalability (`server.config.ts`, `mongodb.config.ts`, `pagination.config.ts`).
- Enforced DX & safety rules (required `MONGO_URL`, bounded pagination limits, explicit defaults, abortEarly=false for aggregated validation errors).
- Removed `dotenv` usage from the app in favor of `@nestjs/config` (kept for setup script only).

# Implementing better find performance

## Record Schema

- Removed redundant manual timestamp fields; rely on Mongoose timestamps with custom names (`created`, `lastModified`).
- Added indexes for frequently queried fields.
- Leverage default `_id` index for cursor pagination ordering.
- Added text index on group of fields (`artist`, `album`, `category`, `format`) to support unified `$text` search (`q`).
- Added unique compound index (`artist`, `album`, `format`) to prevent duplicate inventory entries.
- Added single-field indexes (`format`, `category`, `price`) to improve selective filtering.
- **NOTE:** no index on `qty` — current cardinality and update profile wouldn't benefit; can revisit if query frequency changes.

## Pagination

- Enforce a maximum `limit` to avoid large scans.
- Validate requested `limit` against configured maximum; reject when exceeded.
- Provide default limit via DTO initialization plus environment (`PAGINATION_DEFAULT_LIMIT`).
- Environment defines maximum (`PAGINATION_MAX_LIMIT`); can vary per environment (dev/staging/prod).

### CursorPaginationQueryDTO

- Generic DTO for forward-only pagination using `_id` cursor + limit (efficient for large datasets; avoids count query).
- Response DTO includes metadata (`startCursor`, `endCursor`, `nextCursor`, `previousCursor`, flags) for client navigation.
- Previous cursor currently mirrors prior request cursor; true backward traversal would require additional query logic (deferred).

### OffsetPaginationQueryDTO

- Generic DTO for random access pagination (`page`, `limit`) with `skip` calculation.
- Response DTO provides rich metadata (total counts, page boundaries, navigation helpers) based on concurrent `find` + `countDocuments`.
- More expensive for large page numbers due to increasing `skip`; suitable when total counts or random access are required.

## SearchRecordQueryDTO

- Encapsulates search filters: equality (`artist`, `album`, `format`, `category`), text search (`q`), numeric ranges (`price_gte`/`price_lte`, `qty_gte`/`qty_lte`).
- Facilitates future extensibility (e.g., adding date range or inventory flags) without controller signature changes.

## QueryBuilder

- Pure function builds a `FilterQuery<Record>` from DTO input; isolates transformation logic.
- Side‑effect free and easily unit-testable; DI overhead not justified at current complexity.
- Applies `$text` search when `q` present; merges numeric range predicates safely without overwriting.
- Avoids `$regex` / `$where`; relies on indexed equality and range lookups for performance.

## Repository and Port

- Introduced port (`RecordRepositoryPort`) for inversion of control; simplifies future replacement (e.g., different data source).
- Mongo repository implements port: encapsulates query execution + pagination specifics.
- Cursor pagination: fetch `limit + 1` documents (detect next page without count).
- Offset pagination: concurrent `find` + `countDocuments` via `Promise.allSettled` for robustness.
- Logging enhancements:
  - Slow query detection (`asyncTimer` with threshold from `mongodb` config).
  - Structured query logging (`stringifyMongoQuery`).
  - Error visibility (failed operations surfaced as exceptions).
  - Cursor edge case detection (e.g., invalid cursor exception).

## Service

- Service composes search query using builder and delegates pagination variant to repository.
- Keeps controller lean; central place for future cross-cutting concerns (e.g., caching).

## Controller

- Controller delegates search endpoints to service (`/records` cursor, `/records/offset` offset).
- Offset endpoint protected by `MockAuthGuard` to prevent exposure to unauthenticated users and safeguard against potential abuse.

## Module

- Module wires repository via port and registers schema; enables DI of repository + service.

# Allow for partial text search on find q parameter using nGrams

- Parity with original solution
- Create nGram generator helper function
- Update setup script to compute nGrams for existing records
- Once implementing add and update, explicitly compute nGrams for new/updated records
- Replace the text index with nGram-based indexing for improved partial matching.
- Update the QueryBuilder to utilize our searchFields and split q into tokens by space.
- Pros / Cons:
  - Pros: Improved partial matching capabilities; better user search experience.
  - Cons: Increased index size; write performance and storage trade-off.

# Testing pagination, helpers, exceptions and overall behaviour

- Tested all .util files and any relevant service, repository and controller behavior.
- Found multiple edge cases and fixed them accordingly.
- Updated some behaviours based on test findings.
