import { defineConfig } from 'orval';

// Point input.target at the real spec (file or URL) when supplied, then run `pnpm gen`.
export default defineConfig({
  api: {
    input: {
      target: './openapi/spec.yaml',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/endpoints',
      schemas: 'src/api/model',
      client: 'swr',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: './src/api/mutator/customInstance.ts',
          name: 'customInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});
