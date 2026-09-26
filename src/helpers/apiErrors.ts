import { isAxiosError } from 'axios';

export const isConflictError = (error: unknown): boolean => isAxiosError(error) && error.response?.status === 409;

export const getConflictField = (error: unknown): string | undefined => {
  if (!isAxiosError(error) || error.response?.status !== 409) {
    return undefined;
  }

  const data = error.response.data as { field?: unknown } | undefined;

  return typeof data?.field === 'string' ? data.field : undefined;
};
