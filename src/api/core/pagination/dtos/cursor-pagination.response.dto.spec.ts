import { buildCursorPaginationResponse } from './cursor-pagination.response.dto';

function makeDocs(count: number): { _id: string }[] {
  return Array.from({ length: count }, (_, i) => ({
    _id: i.toString().padStart(24, '0'),
  }));
}

describe('buildCursorPaginationResponse', () => {
  it('returns page limited data and nextCursor when more data exists', () => {
    const docs = makeDocs(5);
    const res = buildCursorPaginationResponse(null, docs, 3);
    expect(res.data).toHaveLength(3);
    expect(res.hasNextPage).toBe(true);
    expect(res.nextCursor).toBe(docs[2]._id);
    expect(res.startCursor).toBe(docs[0]._id);
    expect(res.endCursor).toBe(docs[2]._id);
    expect(res.hasPreviousPage).toBe(false);
  });

  it('sets previousCursor and hasPreviousPage when cursor provided', () => {
    const docs = makeDocs(4);
    const res = buildCursorPaginationResponse(docs[0]._id, docs.slice(1), 2);
    expect(res.previousCursor).toBe(docs[0]._id);
    expect(res.hasPreviousPage).toBe(true);
  });

  it('omits nextCursor when data length <= limit', () => {
    const docs = makeDocs(2);
    const res = buildCursorPaginationResponse(null, docs, 5);
    expect(res.hasNextPage).toBe(false);
    expect(res.nextCursor).toBeNull();
  });

  it('handles empty data', () => {
    const res = buildCursorPaginationResponse(null, [], 3);
    expect(res.data).toHaveLength(0);
    expect(res.startCursor).toBeNull();
    expect(res.endCursor).toBeNull();
    expect(res.hasNextPage).toBe(false);
    expect(res.hasPreviousPage).toBe(false);
  });

  it('deriveFromIds=false does not set start/end cursors', () => {
    const docs = makeDocs(3);
    const res = buildCursorPaginationResponse(null, docs, 3, false);
    expect(res.startCursor).toBeNull();
    expect(res.endCursor).toBeNull();
  });
});
