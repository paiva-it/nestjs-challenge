# General Notes

- Suggest different folder structure (module-first, then type) — kept original for PR readability and easier diff comparison.

# Future Improvements

- Better API decorators with more specific responses (e.g., 404 on update when not found) for better swagger documentation.

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

# Implement Record Creation and Editing with Repository and Service

## Repository

- Main concerns:
  - Implement `create` method for inserting new records with automatic search token generation using the token service.
  - Implement `update` method for modifying existing records with conditional token recomputation based on `modifiedPaths()`.
  - Handle duplicate key errors from unique constraints and transform them into domain-specific exceptions.
  - Handle not-found scenarios gracefully.
  - Generate search tokens automatically during record creation through the injected token service port.
  - For updates: load the current record, apply changes with `doc.set()`, and recompute tokens only when searchable fields (`artist`, `album`, `category`, `format`) are modified.
  - Use MongoDB transactions to ensure atomicity between record updates and token recomputation.
  - Depend on `RecordTokenServicePort` instead of internal helpers to keep token generation swappable and maintain separation of concerns.
- Add logging for failure scenarios to aid debugging.

## Record Token Service

- Exposed through a `RecordTokenServicePort` to allow swapping implementations without modifying repository logic.
- Responsible for generating search tokens based on key fields (`artist`, `album`, `category`, `format`) using N-gram generation.
- Offers `needsRecompute` to determine if token regeneration is required by checking modified document paths.
- Deduplicates tokens before returning to improve search efficiency.

## RecordAlreadyExistsException

- New custom exception to represent duplicate record scenarios.
- Extends `ConflictException` and provides a meaningful error message with the known record fields.

## Service

- For now, without MBID integration:
  - Implement `create` method that delegates to repository's `create`.
  - Implement `update` method that delegates to repository's `update`.

## Controller

- Cleanup existing create and update methods to use new service methods.
- Ensure proper DTO usage and response shaping.

## Testing

- Smaller implementation chunks allowed for focused unit tests.
- Comprehensive test coverage for all new features and edge cases.
- Utilized mocking and stubbing to isolate unit tests from external dependencies.

# Implement Orders

## Folder Structure

- Moved all current record-related files to `src/api/records`.
- Created new order-related files in `src/api/orders`.

## Order Schema

- Defined `Order` schema with fields `recordId` and `qty`, simple and extensible.

## Order Repository

- Implemented `OrderMongoRepository` with a `create` method to insert new orders.
- Decrease record stock atomically before creating an order to ensure consistency.
- If update failed, fetch record and validate existence / stock.
- Entire operation wrapped in a MongoDB transaction for atomicity.
- Add logging for failure scenarios to aid debugging.

## Order Service

- Implemented `create` method that delegates to repository's `create`.

## Order Controller

- Implemented POST `/orders` endpoint to create a new order.
- Validates input and returns created order.

# Refactor Order / Record repo relationship and use @nestjs/transactional for all transactions

## Research

- Investigated available NestJS packages for transaction management.
- Chose `@nestjs-cls/transactional` for its CLS-based context management.
- Looked at industry standards and best practices for transaction handling in Node.js with Mongoose.
- Prepared for a multiple Database setup in the future by decoupling transaction management from direct Mongoose session handling.
- Reviewed codebase and noticed services are not fully DB-agnostic due to model usage and mongoose utils.
- Redesigned controller, service, domain, and repository layers to use ports for better abstraction.

## Key Changes

- Refactored folder structure to separate concerns clearly and follow DDD principles.

```
src/
├── main.ts
├── app.module.ts
│
├── configuration/                      # Environment + infra configs (env, db, server, etc.)
│
└── api/
    ├── core/                           # Shared / cross-cutting modules (common)
    │   ├── log/                        # generic log utils
    │   ├── guards/                     # shared guards
    │   ├── pagination/                 # shared pagination logic
    │   │   ├── dtos/
    │   │   ├── exceptions/
    │   │   └── utils/
    │   ├── repository/                 # generic repository utils
    │   ├── tx/                         # transactions / CLS / decorators
    │   └── utils/                      # generic utils
    │
    └── <feature>/                      # e.g. records, orders, users, etc.
        ├── application/                # use cases, services, exceptions, ...
        │   ├── dtos/
        │   ├── exceptions/
        │   └── services/
        │
        ├── domain/                     # business models and interfaces
        │   ├── entities/
        │   ├── ports/
        │   └── services/
        │
        ├── infrastructure/             # database, external APIs, adapters
        │   └── adapters/               # external integrations
        │   └── repository/
        │       └── <technology>/       # e.g. mongoose/mongo, postgres, redis, memory, etc.
        │         ├── schemas/
        │         └── mappers/
        │
        ├── interface/                  # entrypoints (controllers, guards, presenters (DTOs), ...)
        │
        └── <feature>.module.ts       # Nest module wiring the feature
```

## Transactional Module Implementation

- Created a `TransactionManager` port to abstract transaction operations, serving `runInTransaction` and `getContext` methods.
- Created a MongoTxManager implementation using mongoose connection and CLS service, upgraded with a logger.
- Created a `TransactionalInterceptor` to wrap service methods in transactions automatically.
- Applied `@Transactional()` decorator to service methods that require transactions.
- Export a `MongoTransactionalModule` to encapsulate transaction-related providers for easy reuse in different modules.

## Schemas, Entities and Mappers

- Created `RecordEntity` and `OrderEntity` in the domain layer to represent business models.
- Created Mongoose schemas in the infrastructure layer to represent database models.
- Created mappers to convert from documents to entities for both records and orders.

## Repositories

- Created `RecordRepositoryPort` and `OrderRepositoryPort` in the domain layer to define repository interfaces.
- Implemented `RecordMongoRepository` and `OrderMongoRepository` in the infrastructure layer to handle database operations.
- Repositories now are transaction-agnostic, relying on the @Transactional decorator at the service layer.

## Services

- Created `RecordService` and `OrderService` in the application layer to handle business logic.
- Services now handle transactions using the `@Transactional()` decorator.
- `OrderService` interacts with `RecordService` to manage stock during order creation.

## Controllers

- Created `RecordController` and `OrderController` in the interface layer to handle HTTP requests.
- Controllers now have the associate services injected via ports.

## Testing

- Dropped most previous tests as they were tightly coupled to Mongoose and the previous structure.
- Prepared the repo for new unit tests on a future implementation, more decoupled and easier to mock.

# Extend API to use MBIDs for Records

## Record Schema

- Added tracklist field to Record schema to store array of track names.

## Configuration

- Added "external" configuration namespace for external service settings.
- Configured default timeout for external service calls.

## Port and Service

- Created `RecordTracklistServicePort` to abstract MB integration.
- Implemented `MusicBrainzXMLServiceAdapter` to fetch record details from MusicBrainz API using XML.
- Keep all the MusicBrainz-related logic isolated in its own service for easier testing and future replacement.
- Use fast-xml-parser to parse XML responses into JS objects.

## Reference MBID response structure XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://musicbrainz.org/ns/mmd-2.0#">
  <release id="bdb24cb5-404b-4f60-bba4-7b730325ae47">
    <title>Pieds nus sur la braise</title>
    <status id="4e304316-386d-3409-af2e-78857eec5cfe">Official</status>
    <quality>high</quality>
    <packaging id="8f931351-d2e2-310f-afc6-37b89ddba246">Digipak</packaging>
    <text-representation>
      <language>fra</language>
      <script>Latn</script>
    </text-representation>
    <date>2006-05</date>
    <country>FR</country>
    <release-event-list count="1">
      <release-event>
        <date>2006-05</date>
        <area id="08310658-51eb-3801-80de-5a0739207115">
          <name>France</name>
          <sort-name>France</sort-name>
          <iso-3166-1-code-list>
            <iso-3166-1-code>FR</iso-3166-1-code>
          </iso-3166-1-code-list>
        </area>
      </release-event>
    </release-event-list>
    <barcode>828768226629</barcode>
    <asin>B000F5FQ0O</asin>
    <cover-art-archive>
      <artwork>true</artwork>
      <count>21</count>
      <front>true</front>
      <back>true</back>
    </cover-art-archive>
    <medium-list count="1">
      <medium id="0fad4903-b8cf-3cf1-b462-0a1a914084e3">
        <position>1</position>
        <format id="9712d52a-4509-3d4b-a1a2-67c88c643e31">CD</format>
        <track-list count="13" offset="0">
          <track id="74fab6d0-7084-34e6-9fff-071a40076f2b">
            <position>1</position>
            <number>1</number>
            <length>158400</length>
            <recording id="70493038-55be-4258-a4bf-cd8f2504f432">
              <title>Pavillons kamikazes</title>
              <length>158000</length>
              <disambiguation>album version</disambiguation>
              <first-release-date>2006-05</first-release-date>
            </recording>
          </track>
          ...
        </track-list>
      </medium>
    </medium-list>
  </release>
</metadata>
```

- We are looking to access metadata.release.mediumList.medium.trackList.track.recording.title for each track.

## DTO

- Created `MusicBrainzReleaseResponseDto` that validates and types the relevant parts of the MB response.
- Focused on the nested structure to extract track titles safely.

## Service Usage

- Updated `RecordService` to accept a `tracklistService` port.
- In `create` method, fetch tracklist from service and include in new record.
- In `update` method, if tracklistService indicates the need to refetch, fetch updated tracklist from service and update record.

## Philosophy

- Decouple external service integration from core business logic using ports and adapters.
- Isolate MusicBrainz-specific logic in its own adapter for easier testing and future replacement.
- Create the port as API-agnostic, receiving the entire object for flexibility.
- The service implementation handles the specifics of calling MusicBrainz and using the `mbid` field and parsing the response.

## Future considerations

- Caching MB responses to reduce latency and external calls.
- More comprehensive error handling for various failure scenarios (network issues, invalid MBIDs, parsing errors).

# Implement Caching

## Redis

- Configured in String Mode for key value pairs.
- Using AOF (append only file) for data durability and more safety on crash.
- Using last-recently-used (LRU) eviction policy to keep the most relevant data in cache when memory limit is reached.

## Caching in MusicBrainzXMLServiceAdapter

- Injected `CachePort` to store/retrieve tracklists by MBID.
- Cache lookup before MB API calls; store results with 30-day TTL asynchronously.
- Graceful cache failure handling to preserve main flow integrity.
- Automatic negative caching with shorter TTL for failed fetches through existing architecture.

## Caching Record

- Cache individual `RecordEntity` objects keyed by `record:<id>` to avoid repeated DB lookups.
- Set on cache-miss during `findById`, and invalidate asynchronously on update/stock changes.
- Use a 10-minute TTL to balance freshness and performance without complex invalidation logic.
- Hydrate from cache before hitting the database, falling back gracefully on cache failures.
- Keeps payloads small and domain-consistent by caching mapped entities rather than raw documents.

## Caching Record Search

- Cache sorted lists of record IDs derived from search filters, keyed by hashed normalized queries.
- Slice IDs in memory for offset/cursor paging, hydrating entities individually via `findById`.
- Use a short 60-second TTL to avoid storing stale search results while accelerating repeated queries.
- Avoid complex multi-key invalidation by relying on expiration and lightweight negative caching.
- Only select `_id` from database on cache population to minimize payloads and improve throughput.
