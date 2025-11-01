# Centralized Jest Mocks

All reusable test mocks live here to keep spec files lean and focused on behavior. Avoid defining large inline mock objects/functions inside individual specs—place them here instead.

## Folder Structure

```
test/__mocks__/
	db/         # Mongoose model & document mocks (record, order)
	cache/      # Cache ports, redis client/module mocks
	external/   # External service mocks (token service)
	framework/  # Execution context & logger utilities
	domain/     # Domain/service/repository port mocks (records, orders)
	musicbrainz.dto.jest.mock.ts  # Module mock for MusicBrainz DTO validator
```

### db/

Contains DB-related helpers: `mongoose.model.mock.ts`, `record.document.mock.ts`, `order.document.mock.ts` and optional instance exports (`mongoose.model.instance.mock.ts`) if needed.

### cache/

Cache utilities: `cache-port.mock.ts` (CachePort), `cache.mock.ts` (simple key-value mock), `redis.client.mock.ts` (in-memory redis), plus key builder helpers.

### external/

Mocks representing external integrations currently in use: token service, musicbrainz DTO, and others as needed.

### framework/

Helpers tied to NestJS or runtime environment: execution context factories, global fetch mocking utilities, abort/error creators, and logger silencing helpers (`logger.mock.ts`).

### Removed Folders

Previous `factories/` and `config/` folders were removed or consolidated; README updated to reflect current structure.

## Naming Conventions

- `*.mock.ts` Function/class that returns a fresh mock (preferred vs exporting a single mutable object).
- `*.instance.mock.ts` Exports a pre-created instance when customization isn’t needed (avoid if per-test isolation is important).
- `*.factory.mock.ts` Returns plain JSON-like data (not jest.fn wrappers) for entities/DTOs.
- `*.jest.mock.ts` Exports a module shape intended for `jest.mock(<path>, () => exportedModule)` usage.

## Usage Examples

```ts
// Create a fresh mongoose model mock inside a spec
import { createMongooseModelMock } from '@test/__mocks__/db/mongoose.model.mock';
const model = createMongooseModelMock();

// Use a jest mock module
jest.mock(
  '@api/core/utils/hash.utils',
  () => require('@test/__mocks__/hash.utils.jest.mock').hashUtilsModule,
);

// Execution context helper
import { executionContextFactory } from '@test/__mocks__/framework/execution.context.factory.mock';
const ctx = executionContextFactory({ authorization: 'Bearer mock-token' });

// Order document mock
import { createMockOrder } from '@test/__mocks__/db/order.document.mock';
const orderDoc = createMockOrder({ qty: 3 });

// Silence Nest logger / use provided mock
import { silenceLogger } from '@test/__mocks__/framework/logger.mock';
silenceLogger();
```

## Guidelines

1. Prefer factory functions over exported mutable objects for isolation.
2. Keep mocks minimal: only stub methods used by current tests.
3. Reuse existing mocks before creating new ones—search this directory first.
4. If a mock grows large or is shared across many specs, consider splitting into smaller focused mocks.
5. Avoid coupling tests to internal implementation details—mock public contract only.
6. For logging assertions prefer spying on existing logger mock utilities over creating ad-hoc inline classes.
7. Remove unused mocks promptly to keep the surface area small.

## Adding New Mocks

1. Choose the proper folder.
2. Use the naming convention (`createXMock`, `xFactory`, etc.).
3. Export types when helpful for IDE autocomplete.
4. Update this README if introducing a new category.

### domain/

Holds mocks for domain ports (repository/service specialized interfaces) to support higher-level service & controller tests:

- `order.repository.port.mock.ts`
- `record.repository.port.mock.ts`
- `record-tracklist.service.port.mock.ts`
- `record.service.port.mock.ts`

Keep these focused on the subset of methods exercised by tests; avoid over-mocking unused behavior.
