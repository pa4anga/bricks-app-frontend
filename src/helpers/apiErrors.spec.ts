import { describe, expect, it } from 'vitest';

import { getConflictField, isConflictError } from './apiErrors';

const axiosError = (status: number, data?: unknown) =>
  Object.assign(new Error('request failed'), { isAxiosError: true, response: { status, data } });

describe('isConflictError', () => {
  it('is true only for Axios errors with a 409 status', () => {
    expect(isConflictError(axiosError(409, { message: 'taken' }))).toBe(true);
    expect(isConflictError(axiosError(400, { message: 'bad' }))).toBe(false);
    expect(isConflictError(new Error('plain'))).toBe(false);
    expect(isConflictError(undefined)).toBe(false);
  });
});

describe('getConflictField', () => {
  it('returns the offending field from a 409 response', () => {
    expect(getConflictField(axiosError(409, { message: 'taken', field: 'sapNumber' }))).toBe('sapNumber');
    expect(getConflictField(axiosError(409, { message: 'taken', field: 'name' }))).toBe('name');
  });

  it('returns undefined when the field is missing, not a string, or the status is not 409', () => {
    expect(getConflictField(axiosError(409, { message: 'taken' }))).toBeUndefined();
    expect(getConflictField(axiosError(409, { message: 'taken', field: 123 }))).toBeUndefined();
    expect(getConflictField(axiosError(400, { message: 'bad', field: 'name' }))).toBeUndefined();
    expect(getConflictField(new Error('plain'))).toBeUndefined();
  });
});
