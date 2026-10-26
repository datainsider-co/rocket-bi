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
| gridstack 2 (dashboard layout) | `react-grid-layout` 2 (`features/dashboard/grid`) |
| `vue-drag-drop` + `vuedraggable` (field drag and drop) | `@dnd-kit/core` (`shared/field-dnd`) |
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
| App layout | Header, navigation, page shell. Header done (`src/app/layout/header`, v1 `src/shared/components/HeaderBar.vue`): organization logo and name, Dashboards, Data Warehouse menu, Settings menu (profile, Organization Settings, dark mode, Sign Out), drawer below `md`. Links use v1 paths, so they show Not found until those pages land. Left: Change Password (v1 `ChangePasswordModal`, default login only), Assistant sidebar, trial days left (plan and billing), Lake House / Data Ingestion / CDP behind feature flags | In progress |
| Feature flags | v1 `VUE_APP_IS_DISABLE_*` (LakeHouse, Streaming, CDP, Ingestion, User activities) | Not started |
| Shared UI kit | Only components that two or more features need; ported on demand from `web/src/shared/components` | Ongoing |

### Phase 1: Authentication

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Login | v1 actually renders `screens/login-v2` (+ `basic-login` SignIn); `screens/login` is dead code. v2: `features/auth/login` (`/login`) and `features/auth/forgot-password` (`/forgot-password`: email → OTP → new password). Models in `core/auth`, `core/user`. Left: Google login (backend has it off, needs Google Identity Services), the Register link (`REGISTER_URL`), post-login billing check (the data source check is done, see Phase 6) | In progress |
| Register | route `/register` | – | Not started |
| Current user profile | `screens/current-user` (route `/settings/user-profile/me`) | 4 | Not started |
| Confirmation | `screens/confirmation` | 1 | Not started |
| Third-party auth (OAuth, Google) | routes `/third-party-auth/:config_type`, `/gauthen/:config_type` | – | Later |

### Phase 2: Directory

| Feature | v1 location | Size | Status |
|---|---|---|---|
| My Data, Shared with me, Recent, Starred, Trash | `screens/directory` (routes `/mydata`, `/shared`, `/recent`, `/starred`, `/trash`) | 12 | In progress. Done (`features/directory`, `core/directory`, `core/dashboard`): the five listings at v1's paths (`/` redirects to `/mydata`), folders by `<slug>-<id>`, breadcrumbs, name sort, refresh; New folder/dashboard (in the open My Data folder, otherwise the root; v1 sent the section's virtual id, which the server rejects); rename (dashboards and queries through `dashboards/{id}/rename`), move (folder picker), star, move to trash; restore and delete forever in Trash. Left: Duplicate and Copy (need the dashboard model and v1's `PasswordModal`), Share (row below), share-token (`?token=`) access, which v1 allowed without login |
| Share and permission dialogs | `src/shared/components/SharePermissionManager.vue`, `di-core/share` | – | Not started |

### Phase 3: Dashboard (view)

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Building blocks: widget grid, field drag and drop | `shared/components/gridstack`, `shared/components/DropArea.vue`, `DropItem.vue`, `chart-builder/config-builder/*Draggable` | – | Done, not yet used by a page (see notes below) |
| Dashboard viewer | `screens/dashboard-detail` (route `/dashboard/:name`) | 129* | In progress (plan below). Done: M0 to M3 |
| Chart rendering | `src/shared/components/charts`; query → series response → Highcharts options | – | In progress: series (column/bar/line/area), pie, KPI, flat table (M2). Next: stacked, drilldown, pivot, the rest |
| Filters (tab, dropdown, slicer, date, input, tree) | `src/shared/components/filters`, `widget-container/filters` | – | Done (M3a, M3b): every filter widget, main date filter, filter panel, inner filter, tab control, query parameters, pie and series cross filter. Left: `?filters=` (with drill through, M4) |
| Drilldown and drill-through | `stores/widget/DrilldownDataStore.ts`, `components/drill-through` | – | Not started |
| Embedded dashboard | route `/embedded/dashboard/:name` | – | Not started |

\* The 129 files cover both viewing and editing.

#### Dashboard page plan (view and edit, ChartBuilder excluded)

v1 spreads the page over seven Vuex stores that mutate shared query settings. v2 keeps the dashboard in TanStack
Query, builds each chart's request with a pure `buildQueryRequest(widget, filterState)` that doubles as its query key,
and keeps filter state in one `useReducer` context.

Decisions (2026-10-26):

- **Query settings stay raw JSON.** `ChartWidget.setting` is the stored backend `ChartSetting`; v2 reads what it needs
  with accessor and transform functions instead of porting v1's 35 QuerySetting and 40 ChartOption classes. ChartBuilder
  ports what it needs later.
- **Viz options (`setting.options.options`) get their own key conversion** (`core/query/vizOptions.ts`). v1 stored
  them snake_case (`plot_options`, `font_size`, `x_axis`), so they can't go to Highcharts as is. Only that subtree is
  converted, with lodash `camelCase` on read and `snakeCase` on write, exactly as v1 did. That includes keys that are
  data (series names under `plot_options.series.response`, `typesByLabel`): v1 converted those too and looks them up
  with `camelCase(name)`, so v2 does the same (`vizKey`) instead of skipping them, or stored per-series settings
  would stop matching. The result is typed as Highcharts options plus v1's own keys (`affectedByFilter`,
  `background`, ...), and merged over v1's defaults with lodash `merge` like v1.
- **Share links (`?token=`) are in scope**, but blocked by the backend: the token from `share/dashboard/{id}/anyone`
  (and the older `dashboards/{id}/share`) carries `0:dashboard:view:<id>`, while `GET dashboards/{id}` checks
  `directory:view:<directoryId>`, so it answers 401 `not_allowed` (v1 is affected too). Needs a server fix.
- How filters reach charts (verified in v1 and on the server): every v1 filter widget has `isEnableFilter() = false`, so
  none of them sends a dashboard-wide `FilterRequest`. A chart is filtered only where its own filters hold a
  `dynamic_condition` naming the control; the server skips one without `final_condition`. v1's `mainFilterRequestMap`
  and `affected_by_filter` only matter for URL / header filters (`InternalFilter`), which come with drill through.
- Out of scope: Boost (hidden in v1), Copy to assistant / Summarize (chatbot deferred), tracking, deprecated widgets.

Decisions (M3b):

- **One controls state.** Filters, cross filters, inner filters, tab controls and the main date (fixed id
  `-99887766`) are all entries of the same map; v1 spread them over `QuerySettingStore`, `FilterStore` and
  `DashboardControllerStore`. A tab control's entry is the picked option keys in v1's format (`<camelCase name>_<index>`),
  a tree filter's also keeps its checked keys, a date select's its mode.
- **Filter panel children** show their change at once, but it waits per panel until Apply (v1 `GroupFilterInfo`).
- **Tab control** replaces, by one walk over the setting, every column whose `dynamic_function_id` names the control,
  and expands sorts on a `dynamic_function`; v1 had one replace method per query setting class.
- **Query parameters**: the chart's stored values (`setting.parameters`, else `query_parameter` in its viz options),
  overridden by the inputs listed in `parameter_widget_ids`. v1's code for the inputs was commented out, so changing
  one did nothing.
- **Reset Filters** resets every control except the main date (v1's button only cleared the header filters, M4).
- **UI differences**: the inner filter is a small dropdown at every width (v1 switched to tabs or an icon by width);
  the main date and date select use a preset select plus a range picker (v1 `DiCalendar`); the point menu opens on a
  left click (v1: right click, which Highcharts only reports with a module) and has only the filter items until M4.
- **Backend bugs on MySQL**, not worked around: `like` and `like_case_insensitive` conditions generate ClickHouse's
  `like()` function (SQL error), and a `between_and_including` on a datetime column answers 500 "No database
  selected", so the main date and date select filters fail on MySQL tables (v1 too).

| Step | Scope | Status |
|---|---|---|
| M0 | Real payloads: sample dashboard seeded on the local backend (MySQL `sample_v2.sales`), fixture in `core/dashboard/dashboard.fixture.json` | Done |
| M1 | Read-only page: `core/dashboard` (`Dashboard`, `DashboardSetting` with v1 defaults, `Widget` union), `DashboardService.get`, route with `<slug>-<id>` (outdated name rewritten, 404 → `/mydata`, permission message), theme variables scoped to the page (`features/dashboard/theme`), widget card, text (sanitized HTML), image, tab and filter panel grids, chart placeholder | Done |
| M2 | Query pipeline: `core/query` (`toQueryRequestJson`, `VisualizationResponse`, `QueryService`), `features/dashboard/chart-data/useWidgetData` (request = query key, max 7 at a time, previous data kept while updating). Viz options conversion. Renderers (`features/dashboard/charts`): series (column/bar/line/area, per-series settings, dual axis, datetime x axis), pie, KPI (icon, prefix/postfix, display units), flat table with server pages. Left for later steps: KPI comparison and trend line, table formatting/sorting/totals, stacked and the other chart types; filters render "not supported yet" until M3 | Done |
| M3a | Controls: `core/query/controlValues.ts` (fill `dynamic_condition.final_condition` from a control's values, pure), `features/dashboard/controls` (one `useReducer` context per dashboard, defaults from `options.default.setting.value`, Reset Filters). Tab filter in its four displays and the dropdown filter write their selection; a pie slice click is a cross filter. Only the charts whose conditions name a changed control get a new request | Done |
| M3b | `features/dashboard/controls`: every control in one reducer (values, pending filter panel changes, main date), `buildChartQuery` (pure: control values, tab control columns via `core/query/dynamicFunctions`, inner filter request via `core/query/filterRequests`, parameters via `core/query/queryParameters`). Main date filter in the header (`core/query/dateRanges`, choice kept in local storage under v1's key). Filter panel with Apply. Inner filter in the chart's action bar. Tab control. Slicer, date select, input and tree filters (`charts/filter/FilterRenderer`). A click on a series point opens a menu with Use as a filter / Reset filter. Charts the server can't query (inputs, tab controls) get an empty table without a request (`canQuerySetting`). Second fixture: `core/dashboard/filters.fixture.json`, dashboard "v2 Filters" seeded on the local backend with one widget per control. `?filters=` moved to M4 | Done |
| M4 | Widget actions: sort and paging, export CSV/Excel, drilldown, zoom, drill through, applied filters, `?filters=` from drill through (v1 `InternalFilter`, needs v1's condition builder) | Not started |
| M5 | Permissions, password-protected dashboards, fullscreen and TV mode, auto refresh, theme palette for charts, RLS View As, share token, embedded route | Not started |
| M6 | Edit mode without ChartBuilder: layout save, rename, add text/image/tab/filter panel, delete/duplicate, tab settings, setting modals, main date setup, copy/paste, leave guard; Add/Edit chart hook for ChartBuilder | Not started |

v1 bugs not carried over: resize listener never removed, text edits saved twice, query settings mutated in place,
inner filters kept after reset, the always-null `mainDateFilterRequest`, unsanitized text widget HTML, data label
min/max conditions that hid every non-zero value (`ChartUtils.isShowValue`), tab filters that forgot the selection on
remount and dynamic conditions that threw (and broke the chart) for values they can't hold. M3b: parameter inputs that
changed nothing, slicers on a date column sending epoch millis (and their end date at 00:00:00), tree filters sending a
checked node's value again for each checked child, date select defaults given as two dates applying nothing.

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

#### Notes for wiring the grid and the drop zones

Widget grid (`features/dashboard/grid/DashboardGrid`, stories in `Dashboard/DashboardGrid`):

- Controlled: pass the positions of one grid (the dashboard's top-level widgets, or one tab's widgets) and merge what
  `onPositionsChange` reports into the dashboard's full map. It reports only in edit mode, never on mobile, and
  also reports the compaction react-grid-layout applies to a stored layout with gaps.
- v1's sizes are kept (48 columns, 32px cells, 10px margin, 8px in tab and filter panel grids): `gridMetrics` maps
  gridstack's cell pitch to react-grid-layout's row height, so saved dashboards render the same.
- Overlap mode replaces v1's gridstack engine patch with react-grid-layout's `allowOverlap`; pressing a widget brings
  it to front. Mobile (`useIsMobile`, viewport below 768px) stacks widgets in one column, read only.
- Saving (`DashboardService.resizeWidgets`): the server rejects the request unless it has exactly one position per
  widget of the dashboard, tab children included, and it stores -1/-1 as is. Before saving, run `placeUnplaced` per
  grid (top level, each tab) and `normalizeZIndex`, then send the whole map. v1 saved once when leaving edit mode.
- Inside a widget, mark inputs and other interactive parts with `GRID_NO_DRAG_CLASS`; a grid nested in a widget
  already doesn't drag the widget around it.

Field drag and drop (`shared/field-dnd`, stories in `Shared/FieldDnd`):

- `FieldDndProvider` around the field tree and the zones, `FieldDraggable` on tree leaves, `FieldDropZone` per config
  zone. Give the provider a rule per zone (`size`, `maxItems`, `disabled`, `accepts`) and apply the `DropAction` it
  hands to `onDrop`, with `applyDrop` or by hand (v1 rebuilt the function node for the target zone and merged
  configs on replace: do that in the factory).
- Rules follow v1: append to the zone, insert at a gap, replace the item of a full single-item zone (only from the
  tree), reorder in a zone, move or copy between zones (`transferModeOf`: v1 copies to and from sorting and out of
  the filter zone). The filter zone's OR/AND groups can be a zone per AND group; the innermost zone wins.
- No live reordering animation, by design: gap lines show where the field lands, which keeps hit areas where they
  are drawn. Drags start after 4px, so clicks on an item's menus still work; text fields and `FIELD_NO_DRAG_CLASS`
  never start a drag.

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
| ClickHouse / connector config | `connector-config`, `di-core/connector-config`. Done: first-run setup (`features/data-source/setup`, mounted in `AppLayout` instead of v1's redirect to the settings page): permission check, pick type → form with test connection, SSH tunnel and properties → schema fetch progress. ClickHouse and MySQL only (`core/connection`). Left: the DataSource settings page (listing, Update Schema, Refresh, Change/Edit; on hold), BigQuery/PostgreSQL/Redshift/Vertica | In progress |
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
