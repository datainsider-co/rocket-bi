# AGENTS.md

Guidance for AI agents and developers working in `web-v2/`.

## What this is

`web-v2/` is the React rewrite of the RocketBI frontend. The old app is in `../web/` (Vue 2) and is the reference
implementation. Work is migrated **feature by feature**; the plan and per-feature status are in
[`docs/MIGRATION.md`](docs/MIGRATION.md). Read it before starting a feature and update it when one lands.

## Commands

Package manager is **pnpm** (pinned via `packageManager`, enabled with `corepack enable pnpm`). Do not use npm or yarn.

```sh
pnpm dev          # Vite dev server, http://localhost:3000
pnpm typecheck    # tsc (TypeScript 7), no emit
pnpm lint         # oxlint
pnpm test         # vitest watch; pnpm test:run for one pass
pnpm storybook    # http://localhost:6006
pnpm build        # tsc && vite build
```

Before calling a change done, run `typecheck`, `lint`, `test:run` and `build`.

## Backend

There is no mock server. Development uses the real backend from the local docker stack in `../docker/`
(`docker compose up -d`; login `hello@gmail.com` / `123456`). The Vite dev server proxies `/api/*` to
`http://localhost:8080` with the `/api` prefix stripped (server routes are like `/user/auth/login`). Override with
`VITE_API_TARGET`.

`../docker/docker-compose.override.yml` and `../docker/nginx.conf` are local-only fixes, excluded through
`.git/info/exclude`. Never commit them or add them to `.gitignore`.

## Stack

React 19 · TypeScript 7 · Vite 8 · React Router 8 (data mode) · TanStack Query · react-hook-form + zod · Tailwind 4 · antd 6 · Highcharts 13 · Vitest +
Testing Library (jsdom) · Storybook 10 · oxlint · deneric2 (JSON → entity parsing for API responses).

## Rules

### State management

- **No external state libraries**: no Zustand, Redux, Jotai, MobX, Valtio, and so on.
- Server data: TanStack Query. Do not copy API responses into context or component state.
- Shared UI state: a context provider plus a `useX()` hook that reads it with `use()` and throws outside the provider.
  Use `useReducer` once the state has more than a couple of transitions. Reference:
  `src/app/theme/ThemeContext.tsx`.
- Local state stays local (`useState`). Lift it only when two components need it.
- Memoize context values (`useMemo`/`useCallback`) so consumers don't re-render on every provider render.

### TypeScript 7

TS 7 is the native (Go) compiler and does **not** ship the classic JS compiler API. Tools that `import 'typescript'`
for type information break. That is why linting uses oxlint (not `typescript-eslint`) and Storybook uses
`react-docgen` (not `react-docgen-typescript`). Check TS 7 compatibility before adding any such tool.

`tsconfig.json` is strict, with `noUncheckedIndexedAccess` and `verbatimModuleSyntax`: use `import type` for
type-only imports.

### Working with v1 (`../web/`)

- **Never edit `../web/`** as part of v2 work, and never import from it.
- Treat v1 as a spec: read the screen in `web/src/screens/`, its store and the `web/di-core/` services it calls to
  learn the behaviour and the exact API requests and responses. Then write idiomatic React; don't translate Vue class
  components line by line, and don't carry over v1 bugs.
- Confirm request and response shapes against the running backend, not just the v1 types.
- When a domain model from `web/di-core/` is needed, port it into `src/core/<module>/` as a deneric2 entity, fixing
  types for strict mode. Replace `typescript-ioc` injection with the v2 container (`src/core/di/Container.ts`): no
  decorators; classes take dependencies in the constructor, each module exports a `DiModule` that binds them to
  tokens, and the module is added to `src/app/di/appModules.ts`. Components read them with `useDi(Token)`. Route
  loaders run outside React and have no container; if one needs a service, pass the container into
  `createAppRouter`. Tests build their own container and override bindings with a test module.
- HTTP goes through `src/shared/http/createHttpClient.ts`. It returns plain JSON (`unknown`) with keys as the server
  sent them. **Never add a global snake_case ↔ camelCase conversion**: map each field explicitly in the deneric2 schema
  (both `fromJson` and `toJson`), verify casing against the real backend, and never rename keys inside `Record` /
  map-like fields, which are data (v1 corrupted column names this way).

## Project layout

```
src/
  app/            app-wide providers, query client, theme, DI modules and `useDi` (app/di), app shell (app/layout)
  app/router.tsx  every route, declared in code (React Router `createBrowserRouter`); guards in app/routeGuards.ts
  features/<name>/  one folder per migrated feature: components, hooks, API queries, feature-local state
  core/<module>/  domain models and API functions ported from web/di-core, no React
  shared/         UI components, charts and utilities used by two or more features
  test/           test setup
```

Routes stay thin: `app/router.tsx` maps a path to a page component that lives in its feature
(`features/auth/login/LoginPage.tsx`). Pages are lazy loaded with `lazyPage(() => import(...), m => m.Page)`, so a
page's dependencies (zod, Highcharts, ...) stay out of the main bundle; anything the router imports directly
(layouts, guards, error pages, `*.utils` they use) ships with every page, so keep those light. Inside a feature, group by page (`features/<name>/<page>/`), like Next.js.

`@/` maps to `src/`. Put code in a feature first; move it to `shared/` or `core/` only once a second feature needs it.

## Conventions

- Components and their files are PascalCase (`HighchartsChart.tsx`); hooks are `useX.ts`.
- Named exports, except where a tool requires a default export (Storybook meta, config files).
- Tests sit next to the code as `*.test.ts(x)`; import `describe/it/expect` from `vitest` (no globals).
- Reusable components get a `*.stories.tsx`.
- Styling: antd components and theme tokens first, Tailwind utilities for layout, spacing and one-off sizes. Tailwind
  runs without preflight (`src/app/global.css`); antd's CSS-in-JS is put in `@layer antd` by `StyleProvider layer`,
  ordered before `utilities`, so a Tailwind class on an antd component wins. Brand values (`colorPrimary` #0066ff,
  Roboto) are set once in `ThemeContext` and mirrored as `--color-brand` / `--font-sans` in `global.css`.
- Forms: react-hook-form with a zod schema (`zodResolver`); schemas live in the feature's `*.utils.ts` and are unit
  tested. Lay fields out with antd via `features/auth/FormField.tsx` (move it to `shared/` when a second feature
  needs it).
- Charts go through `src/shared/charts/HighchartsChart.tsx`.
- CommonJS-only packages: a default import can be the whole `module.exports` in the browser (Vite pre-bundle) but the
  real export in Vitest, so green tests don't prove it renders. Check the page in `pnpm dev` after adding such a
  dependency (see `HighchartsChart.tsx` for the workaround).
- Route errors render `src/app/error/RouteErrorPage.tsx` (`errorElement`); unknown paths behind login render
  `NotFoundPage`.
