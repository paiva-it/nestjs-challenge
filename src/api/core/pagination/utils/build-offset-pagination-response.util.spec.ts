import { buildOffsetPaginationResponse } from './build-offset-pagination-response.util';

describe('buildOffsetPaginationResponse', () => {
  it('computes totalPages and page metadata', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    const res = buildOffsetPaginationResponse(data, 25, 1, 5);
    expect(res.totalPages).toBe(5);
    expect(res.page).toBe(1);
    expect(res.hasNextPage).toBe(true);
    expect(res.nextPage).toBe(2);
    expect(res.previousPage).toBeNull();
    expect(res.isFirstPage).toBe(true);
    expect(res.isLastPage).toBe(false);
  });

  it('normalizes page above totalPages', () => {
    const data = Array.from({ length: 3 }, (_, i) => ({ id: String(i) }));
    const res = buildOffsetPaginationResponse(data, 3, 10, 3);
    expect(res.page).toBe(1);
    expect(res.totalPages).toBe(1);
    expect(res.isLastPage).toBe(true);
  });

  it('handles zero total items', () => {
    const res = buildOffsetPaginationResponse([], 0, 1, 20);
    expect(res.totalItems).toBe(0);
    expect(res.totalPages).toBe(1);
    expect(res.resultsOnPage).toBe(0);
    expect(res.startIndex).toBe(0);
    expect(res.endIndex).toBe(-1);
  });

  it('calculates start/end indices correctly', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    const res = buildOffsetPaginationResponse(data, 12, 2, 5);
    expect(res.startIndex).toBe(5);
    expect(res.endIndex).toBe(9);
  });

  it('resultsOnPage equals data length and limit normalization', () => {
    const data = Array.from({ length: 2 }, (_, i) => ({ id: String(i) }));
    const res = buildOffsetPaginationResponse(data, 2, 1, 0);
    expect(res.pageSize).toBe(1);
    expect(res.limit).toBe(1);
    expect(res.resultsOnPage).toBe(2);
  });
});
