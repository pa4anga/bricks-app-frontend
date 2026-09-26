import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { installBlobTextPolyfill } from '@/mocks/blobTextPolyfill';
import { ResizeObserverMock } from '@/mocks/resizeObserverMock';
import { server } from '@/mocks/server';

globalThis.ResizeObserver = ResizeObserverMock;
installBlobTextPolyfill();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
