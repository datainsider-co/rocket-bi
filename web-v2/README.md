# RocketBI web-v2

React rewrite of [`web/`](../web), migrated feature by feature.

- Migration plan and status: [docs/MIGRATION.md](docs/MIGRATION.md)
- Rules for agents and contributors: [AGENTS.md](AGENTS.md)

## Stack

| Concern | Choice |
|---|---|
| UI | React 19, antd 6 |
| Language | TypeScript 7 (native `tsc`) |
| Build / dev | Vite 8 |
| Routing | React Router 8, routes declared in `src/app/router.tsx` |
| Server state | TanStack Query |
| UI state | React only: Context + `useState`/`useReducer`, read with `use()` |
| Charts | Highcharts 13 via `highcharts-react-official` |
| JSON parsing | deneric2 (API JSON → typed entities) |
| Styling | antd 6 + Tailwind 4 (utilities only, no preflight) |
| Forms | react-hook-form + zod |
| Tests | Vitest + Testing Library (jsdom) |
| Components | Storybook 10 |
| Lint | oxlint |

## Scripts

```sh
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # watch mode; test:run for a single run
pnpm typecheck
pnpm lint
pnpm storybook      # http://localhost:6006
pnpm build
```

## Backend

The dev server proxies `/api/*` to `http://localhost:8080` with the `/api` prefix stripped, i.e. the server from the
local docker stack in [`docker/`](../docker). Override with `VITE_API_TARGET=http://host:port pnpm dev`.

## Conventions

- **No external state library.** Server data goes through TanStack Query. Shared UI state is a context provider with a
  `useX()` hook that throws outside its provider. See `src/app/theme/ThemeContext.tsx`.
- `@/` maps to `src/`.
- Tests sit next to the code as `*.test.tsx`; stories as `*.stories.tsx`.

## TypeScript 7 notes

TS 7 no longer ships the classic JS compiler API, so tools built on it do not work:

- `typescript-eslint` requires `typescript < 6.1`, so linting uses **oxlint**.
- Storybook uses `react-docgen` instead of `react-docgen-typescript`.
