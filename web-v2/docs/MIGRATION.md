# Migration plan: web (Vue 2) → web-v2 (React)

Living document. Update the **Status** column as features land.

## Goal

Rebuild the RocketBI frontend (`web/`, Vue 2 `v23.11.30`) in `web-v2/` with React 19, TypeScript 7 and an up-to-date
toolchain, refactoring modules on the way. The backend API stays the same.

## Principles

1. **`web/` is read-only.** It is the reference implementation and keeps running until v2 replaces it. Do not fix or
   refactor it as part of the migration.
2. **Feature by feature.** Each feature is ported, tested and usable on its own before the next one starts.
3. **Port behaviour, not code.** v1 code is a spec for what the feature does and which API it calls. Rewrite it in
   React idioms instead of translating Vue classes line by line, and do not copy v1 bugs.
4. **Same API contract.** v2 talks to the existing backend. Request and response shapes come from `web/di-core/` and are
   checked against the real server from the local docker stack (`docker/`).
5. **No external state library.** TanStack Query for server state; React Context + `useState`/`useReducer` for UI state.

## Mapping v1 → v2

| v1 (`web/`) | v2 (`web-v2/`) |
|---|---|
| Vue 2 class components, `vue-property-decorator` | Function components + hooks |
| Vuex modules (`vuex-module-decorators`) | TanStack Query (server data), Context providers (UI state) |
| `typescript-ioc` DI (`Di.init([...Module])`) | Own typed container without decorators (`src/core/di/Container.ts`): tokens, `DiModule`s bound at startup, `useDi()` in React |
| `vue-router` 3 (`src/router/Router.ts`) | React Router 8 (data mode), routes declared in `src/app/router.tsx`, pages in features |
| bootstrap-vue + ant-design-vue 1 | antd 6 |
| Highcharts 11 + `highcharts-vue` | Highcharts 13 + `highcharts-react-official` |
| gridstack 2 (dashboard layout) | To decide when the dashboard phase starts (`react-grid-layout` or gridstack 12) |
| monaco-editor-vue | `@monaco-editor/react` |
| SCSS themes in `src/themes/` | antd theme tokens (`ConfigProvider`); CSS for what tokens can't cover |
| Jest-style unit tests (`tests/unit/`) | Vitest + Testing Library, next to the code |
| `window.appConfig` from `public/config/*.js` | `import.meta.env` (`VITE_*`); runtime config only if deployment needs it |

### What to do with `di-core`

`web/di-core/` (887 files) is the domain and API layer. It has **no Vue imports**, so most of it can be ported almost
unchanged. But **254 of its files import back into `web/src/`** (`@/shared`, `@/utils`,
`@/screens/chart-builder/.../ConfigDataUtils`, `@/screens/data-ingestion/.../TimeScheduler`, ...), and services are wired
through `typescript-ioc` decorators.

Approach: port `di-core` **per feature**, into `web-v2/src/core/<module>/`, only the parts that feature needs:

- Domain models: rewrite as deneric2 entities whose schema maps every field explicitly, both ways. v1's HTTP client
  renamed every key of every request and response (snake_case ↔ camelCase, `JsonUtils`), which also rewrote keys that
  are data (column names, map keys). v2's HTTP client does no renaming, so check each field's casing against the real
  backend and leave `Record` keys untouched.
- Repositories and services: classes taking their dependencies in the constructor, bound in the module's `DiModule`
  (`di.bindSingleton(Token, d => new Impl(d.get(ApiClient)))`), and exposed through
  TanStack Query hooks inside the feature.
- Anything that pulls in `web/src/*`: move the needed piece into `core` or `shared`, never import from `web/`.

## Coexistence with v1

**Open decision.** Until it is made, v2 runs standalone in development against the local backend.

- **A. Standalone until parity.** v2 ships once all in-scope features are done. Simple; nothing in production until the
  end.
- **B. Route-level switch.** A reverse proxy sends migrated routes to v2 and the rest to v1 on the same domain, sharing
  the session. Ships earlier, but v1 and v2 must agree on auth storage and URLs.

## Phases

Size is the number of source files in v1 (`.vue`/`.ts`/`.tsx`), a rough measure of effort.

### Phase 0: Foundation

| Item | Notes | Status |
|---|---|---|
| Project scaffold | React 19, TS 7, Vite 8, Vitest, Storybook, antd 6, Highcharts 13, TanStack Query/Router, oxlint | Done |
| Dev proxy to local backend | `/api` → `localhost:8080` | Done |
| Theme (light/dark) via Context | Reference for the state pattern | Done |
| HTTP client | `src/shared/http/createHttpClient.ts` (ky): prefix, timeout, headers from a `getHeaders` callback, errors → `ApiError`, `onUnauthenticated` callback, no retries (TanStack Query owns them). Returns plain JSON, no key conversion. `HttpClientBuilder` mirrors v1's builder; the app's `ApiClient` is bound in `src/app/di/HttpModule.ts`. v1: `di-core/common/misc/ClientBuilder.ts`, `di-core/common/services/HttpClient.ts` | Done |
| Dependency injection | `src/core/di/Container.ts`: `token<T>()`, `bindValue` / `bindSingleton` (v1 only used singletons), lazy, circular-dependency check, later modules override earlier ones (test modules). Modules listed in `src/app/di/appModules.ts`, container created in `main.tsx`, passed to `DiProvider` (`useDi`). No decorators or `reflect-metadata`. v1: `di-core/common/modules/` | Done |
| Session and auth state | Login state, current user, permissions. v1: `src/store/modules/AuthenticationStore.ts`, `di-core/common/services/DataManager.ts`, `PermissionHandler.ts`. Done: `ssid` cookie and share token (`src/core/session/session.ts`), session expiry → clear cache and full reload to `/login` (`src/app/sessionExpiredHandler.ts`), no query retry on 4xx. Current user: `features/auth/current-user` (`check_session` query, seeded by login; logout calls `/user/auth/logout`, which v1 never did). Left: permissions | In progress |
| Route guards | `src/app/routeGuards.ts` (loaders): no session → `/login?redirect=<path>`; logged-in users skip login and forgot password. v1: `router.beforeEach` in `Router.ts` | Done |
| App layout | Header, navigation, page shell | Not started |
| Feature flags | v1 `VUE_APP_IS_DISABLE_*` (LakeHouse, Streaming, CDP, Ingestion, User activities) | Not started |
| Shared UI kit | Only components that two or more features need; ported on demand from `web/src/shared/components` | Ongoing |

### Phase 1: Authentication

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Login | v1 actually renders `screens/login-v2` (+ `basic-login` SignIn); `screens/login` is dead code. v2: `features/auth/login` (`/login`) and `features/auth/forgot-password` (`/forgot-password`: email → OTP → new password). Models in `core/auth`, `core/user`. Left: Google login (backend has it off, needs Google Identity Services), the Register link (`REGISTER_URL`), post-login billing/ClickHouse checks | In progress |
| Register | route `/register` | – | Not started |
| Current user profile | `screens/current-user` (route `/settings/user-profile/me`) | 4 | Not started |
| Confirmation | `screens/confirmation` | 1 | Not started |
| Third-party auth (OAuth, Google) | routes `/third-party-auth/:config_type`, `/gauthen/:config_type` | – | Later |

### Phase 2: Directory

| Feature | v1 location | Size | Status |
|---|---|---|---|
| My Data, Shared with me, Recent, Starred, Trash | `screens/directory` (routes `/mydata`, `/shared`, `/recent`, `/starred`, `/trash`) | 12 | Not started |
| Share and permission dialogs | `src/shared/components/SharePermissionManager.vue`, `di-core/share` | – | Not started |

### Phase 3: Dashboard (view)

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Dashboard viewer | `screens/dashboard-detail` (route `/dashboard/:name`) | 129* | Not started |
| Chart rendering | `src/shared/components/charts`; query → series response → Highcharts options | – | Not started |
| Filters (tab, dropdown, slicer, date, input, tree) | `src/shared/components/filters`, `widget-container/filters` | – | Not started |
| Drilldown and drill-through | `stores/widget/DrilldownDataStore.ts`, `components/drill-through` | – | Not started |
| Embedded dashboard | route `/embedded/dashboard/:name` | – | Not started |

\* The 129 files cover both viewing and editing.

Chart types to support (v1 `ChartType` enum): Area, AreaRange, AreaInverted, AreaSpline, Bar, BellCurve, Bubble,
Column, ColumnRange, ColumnDrillDown, BarDrillDown, PieDrillDown, Funnel, Gauges, HeatMap, TreeMap, Histogram, Line,
Spline, LineInverted, Pareto, Pie, SemiPie, Pyramid, Scatter, Table, Kpi, WordCloud, StackedColumn, StackedBar,
StackedLine, Map, PivotTable, Parliament, SpiderWeb, Sankey, FlattenTable, FlattenPivotTable; filter widgets TabFilter,
SingleChoice, MultiChoice, DropDown, SlicerFilter, DateSelectFilter, InputFilter.

Suggested order: the common series charts (Column/Bar/Line/Area/Pie) and Kpi, then Table/Pivot, then the rest.

### Phase 4: Dashboard (edit) and Chart builder

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Dashboard edit mode (layout, add/remove/resize widgets, settings) | `screens/dashboard-detail` | (see above) | Not started |
| Chart builder | `screens/chart-builder` | 53 | Not started |
| Query/Viz setting resolvers and handlers | `src/shared/resolver`, `src/shared/module/ChartBuilderModule.ts`, `web/docs/CREATE_CHART_FLOW.md` | – | Not started |

The v1 resolver/handler registry (QuerySetting, VizSetting, PanelSetting per chart type) should become a typed map from
chart type to handler, not a DI container.

### Phase 5: Data warehouse

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Databases (all, trash) | `screens/data-management` (`/data-warehouse/databases`) | 49 | Not started |
| Schema explorer | `/data-warehouse/schema`, `di-core/schema` | – | Not started |
| Query editor (Monaco) | `/data-warehouse/query-editor` | – | Not started |
| Relationships | `/data-warehouse/relationship`, `di-core/data-relationship` | – | Not started |

### Phase 6: Organization settings

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Overview, user management, user detail | `screens/organization-settings`, `screens/user-management`, `di-core/admin` | 86 | Not started |
| Token management, SSO | `token-management`, `sso-config` | – | Not started |
| User activity log, system monitor (query/user usage) | `user-activity-log`, `system-monitor` | – | Not started |
| ClickHouse / connector config | `connector-config`, `di-core/connector-config` | – | Not started |
| Plan and billing | `plan-and-billing`, `plan-detail`, `di-core/billing` | – | Not started |

### Phase 7: Data cook (ETL)

| Feature | v1 location | Size | Status |
|---|---|---|---|
| My ETL, shared, history, trash, ETL editor | `screens/data-cook` (`/data-warehouse/data-cook`), `di-core/data-cook` | 70 | Not started |

### Deferred (disabled in v1 by feature flags or unused)

Port only if still needed. Decide before starting.

| Feature | v1 location | Size | Note |
|---|---|---|---|
| Data ingestion (sources, jobs, queued, streaming, history) | `screens/data-ingestion`, `di-core/data-ingestion` | 156 + 136 | `VUE_APP_IS_DISABLE_INGESTION: true` |
| Lake house | `screens/lake-house`, `di-core/lake-house` | 10 + 33 | `VUE_APP_IS_DISABLE_LAKE_HOUSE: true`. **Won't migrate** (decided 2026-10-22). It was the only v1 user of byte-level upload progress, so v2 has no XHR upload helper |
| CDP, tracking profile | `screens/tracking-profile`, `di-core/tracking` | 17 + 14 | `VUE_APP_IS_DISABLE_CDP: true` |
| Shopify integration | routes `/shopify`, `/shopify/redirect` | – | |
| Chat bot (OpenAI) | `src/shared/components/chat`, `di-core/chat-bot` | – | |
| Mail builder | `screens/mail-builder` | 0 | Empty in v1 |

## Definition of done (per feature)

- Works end to end against the local backend (`docker/`), including empty, loading and error states.
- Behaviour matches v1, or the differences are written down in the feature's PR.
- Unit tests for logic (parsers, `fromObject`, reducers, query-setting builders) and at least one component test.
- Stories for reusable UI components.
- `pnpm typecheck`, `pnpm lint`, `pnpm test:run` and `pnpm build` pass.
- Status in this file updated.
