import { describe, expect, it } from 'vitest';

import { getPageWindow } from './getPageWindow';

describe('getPageWindow', () => {
  it('starts at page 1 when on the first page', () => {
    expect(getPageWindow(1, 100)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('ends at the last page when on the last page', () => {
    expect(getPageWindow(100, 100)).toEqual([91, 92, 93, 94, 95, 96, 97, 98, 99, 100]);
  });

  it('centres the window around the current page in the middle', () => {
    expect(getPageWindow(50, 100)).toEqual([45, 46, 47, 48, 49, 50, 51, 52, 53, 54]);
  });

  it('returns every page when there are fewer than the window size', () => {
    expect(getPageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns a single page when there is only one', () => {
    expect(getPageWindow(1, 1)).toEqual([1]);
  });

  it('returns nothing when there are no pages', () => {
    expect(getPageWindow(1, 0)).toEqual([]);
  });

  it('respects a custom window size', () => {
    expect(getPageWindow(1, 100, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});
