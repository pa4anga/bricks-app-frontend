# Frontend

React + [MUI 6](https://mui.com/) app built on **Next.js 15 (Pages Router)**, with **SWR** data hooks generated from an OpenAPI spec via **Orval** (Axios transport).

## Requirements

- Node `>= 20` (see `.nvmrc` / Volta pin → 22.23.1)
- pnpm `>= 8` (repo uses 11.9.0)

## Getting started

```bash
pnpm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
pnpm gen                           # generate the API client from openapi/spec.yaml
pnpm dev                           # http://localhost:3000
```

## Scripts

| Script                                  | Description                                             |
| --------------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                              | Start the dev server                                    |
| `pnpm build` / `pnpm start`             | Production build / serve                                |
| `pnpm gen`                              | Regenerate the SWR + Axios client from the OpenAPI spec |
| `pnpm gen:watch`                        | Regenerate on spec changes                              |
| `pnpm lint` / `pnpm lint:fix`           | ESLint (Next config + import ordering)                  |
| `pnpm stylelint` / `pnpm stylelint:fix` | Lint SCSS                                               |
| `pnpm format` / `pnpm format:check`     | Prettier                                                |
| `pnpm typecheck`                        | `tsc --noEmit`                                          |
| `pnpm test` / `pnpm test:watch`         | Vitest (runs with `TZ=UTC`)                             |
| `pnpm test:coverage`                    | Vitest + V8 coverage                                    |

## Project structure

```
openapi/spec.yaml              # OpenAPI spec (replace with the real one)
orval.config.ts                # Codegen: SWR hooks + Axios, custom mutator
src/
  pages/                       # Next.js Pages Router (_app, _document, index)
  theme/                       # MUI theme
  styles/                      # Global SCSS + shared variables
  components/                  # UI components (PascalCase folders + *.module.scss)
  hooks/                       # Reusable React hooks (e.g. useDebounce)
  helpers/                     # getServerSideProps wrappers, redirects
  api/
    axiosInstance.ts           # Shared Axios instance (reads NEXT_PUBLIC_API_BASE_URL)
    mutator/customInstance.ts  # Orval mutator -> uses the shared instance
    endpoints/                 # GENERATED SWR hooks (via `pnpm gen`)
    model/                     # GENERATED types (via `pnpm gen`)
  mocks/                       # MSW handlers (tests + optional browser worker)
```

## API client workflow

1. Replace `openapi/spec.yaml` with the real spec, or point `orval.config.ts` `input.target` at its URL.
2. Run `pnpm gen`.
3. Import the generated SWR hooks, e.g. `import { useGetWidgets } from '@/api/endpoints/widgets/widgets';`.

All requests flow through `src/api/mutator/customInstance.ts`, so add auth headers, interceptors, or error mapping in `src/api/axiosInstance.ts`.

## Testing

Vitest + Testing Library + MSW (jsdom, `TZ=UTC`). Mock network in `src/mocks/handlers.ts`. Co-locate specs as `*.spec.ts(x)` next to source — except page tests, which live in `src/__tests__/` because every file under `src/pages/` is treated as a route.

## Conventions

- Interfaces prefixed with `I` (`ILayoutProps`); `import type` for type-only imports.
- Import order enforced by ESLint (external → internal `@/*` → relative → styles last).
- Single quotes, semicolons, 120 col, 2-space indent (Prettier).
- SCSS Modules named `componentName.module.scss`.

## Site template & pages

The app chrome is a reusable **`PageTemplate`** (`src/components/layout/PageTemplate`) that composes a `Header` (red bar + Wienerberger logo) and `Footer` (grey bar with links), matching the styling of `ceni.wienerberger.bg`. Use it on any page:

```tsx
import { PageTemplate } from '@/components/layout/PageTemplate';

const MyPage = () => (
  <PageTemplate title="My tab title" heading="My heading">
    …
  </PageTemplate>
);
```

- Brand tokens live in `src/theme/theme.ts` (red `#b30000`, greys `#eceded` / `#737575` / `#3f3f3f`) and `src/styles/_variables.scss`; the font is Noto Sans (loaded in `_document.tsx`).
- Clicking the logo returns to **our** home (`/`).
- Header/footer link targets are configured in `src/components/layout/navigation.ts`. `/terms`, `/impresum`, `/cookies` are internal; "Защита на личните данни" and "Wienerberger.com" point at the original external URLs.
- `/terms`, `/impresum`, `/cookies` reproduce the source pages' structure and styling. Their legal body copy is **generic placeholder text** — replace the bracketed `[…]` values with your own official content.
