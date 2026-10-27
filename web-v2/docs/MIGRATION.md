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

## Current status (2026-10-27)

- **Done**: most of the foundation (left: feature flags, parts of the app header), login and forgot password (left:
  Google login, Register), the directory listings (left: Duplicate, Copy), the first-run data source setup,
  and the dashboard through M7: every filter widget, header filters, drilldown, drill through, downloads, permissions,
  password, full screen and TV mode, auto refresh, View As, embedded route, edit mode without ChartBuilder, Share, Relationship (React Flow), and
  header, settings and widgets that look like v1 (checked with Playwright screenshots against v1).
- **Next**: ChartBuilder (Phase 4, [`CHART_BUILDER.md`](CHART_BUILDER.md), CB0 to CB4 done, CB5 next) for the chart types
  v2 already renders; the other chart types (stacked, pivot, ...) follow, each with its builder handler. ChartBuilder
  plugs into edit mode through `ChartBuilderBridge`.
- **Share links (`?token=`)**: the Share dialog (M7b) creates directory tokens, which the server accepts; opening
  them without a session still needs client work, see Phase 3 M5b. **Blocked by the server**: MySQL `like` and
  datetime `between` filters, see Decisions (M3b).
- **Open decision**: how v2 ships next to v1 (Coexistence above).

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
| Session and auth state | Login state, current user, permissions. v1: `src/store/modules/AuthenticationStore.ts`, `di-core/common/services/DataManager.ts`, `PermissionHandler.ts`. Done: `ssid` cookie and share token (`src/core/session/session.ts`), session expiry → clear cache and full reload to `/login` (`src/app/sessionExpiredHandler.ts`), no query retry on 4xx. Current user: `features/auth/current-user` (`check_session` query, seeded by login; logout calls `/user/auth/logout`, which v1 never did). Permissions: organization ones via `core/permission/PermissionService` (`admin/permissions/{username}/is_permitted`, `shared/permission/permissionQueries`), resource ones via `ResourcePermissionService` (`share/{type}/{id}/action_permitted`). Left: share token without a session (blocked by the server, see Phase 3 M5b) | In progress |
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
| My Data, Shared with me, Recent, Starred, Trash | `screens/directory` (routes `/mydata`, `/shared`, `/recent`, `/starred`, `/trash`) | 12 | In progress. Done (`features/directory`, `core/directory`, `core/dashboard`): the five listings at v1's paths (`/` redirects to `/mydata`), folders by `<slug>-<id>`, breadcrumbs, name sort, refresh; New folder/dashboard (in the open My Data folder, otherwise the root; v1 sent the section's virtual id, which the server rejects); rename (dashboards and queries through `dashboards/{id}/rename`), move (folder picker), star, move to trash; restore and delete forever in Trash. Left: Duplicate and Copy (the dashboard model and the password check now exist, in `core/dashboard` and `features/dashboard/access`), share-token (`?token=`) access, which v1 allowed without login (see Phase 3 M5b). Share: done (M7b), row share button (`row-actions/ShareButton`, hidden below sm) |
| Share and permission dialogs | `src/shared/components/SharePermissionManager.vue`, `di-core/share` | – | Done (M7b): `core/share` (`ShareService`, levels), `features/share` (`ShareModal`: people and groups, Get link, password protection, embed code), used by the directory rows and the dashboard's Options (`features/dashboard/share/useDashboardShare`). Password through `DirectoryService.setPassword` (the whole directory is put back with `data.config` set or dropped). Left: databases and ETL (v1 `ShareDatabaseHandler`, `DataCookShareHandler`) come with their features |

### Phase 3: Dashboard (view)

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Building blocks: widget grid, field drag and drop | `shared/components/gridstack`, `shared/components/DropArea.vue`, `DropItem.vue`, `chart-builder/config-builder/*Draggable` | – | Done, not yet used by a page (see notes below) |
| Dashboard viewer | `screens/dashboard-detail` (route `/dashboard/:name`) | 129* | Done (plan below): M0 to M6; share token blocked by the server |
| Chart rendering | `src/shared/components/charts`; query → series response → Highcharts options | – | In progress: series (column/bar/line/area), pie, KPI, flat table with server sort (M2, M4a); drilldown, date function and export work on them (M4a). Next: stacked, pivot, the rest |
| Filters (tab, dropdown, slicer, date, input, tree) | `src/shared/components/filters`, `widget-container/filters` | – | Done (M3a, M3b): every filter widget, main date filter, filter panel, inner filter, tab control, query parameters, pie and series cross filter. Title style, choice colours and v1's sizes done in M7e. Left: the filter panel's vertical header, the date select's min/max dates as calendar bounds |
| Drilldown and drill-through | `stores/widget/DrilldownDataStore.ts`, `components/drill-through` | – | Done (M4a, M4b). Left: maps |
| Embedded dashboard | route `/embedded/dashboard/:name` | – | Done (M5b) with the session cookie; with a share token once the server allows it |

\* The 129 files cover both viewing and editing.

#### Dashboard page plan (view and edit, ChartBuilder excluded)

v1 spreads the page over seven Vuex stores that mutate shared query settings. v2 keeps the dashboard in TanStack
Query, keeps every control in one `useReducer` context (`features/dashboard/controls/DashboardControlsContext`) and
builds each chart's query with the pure `buildChartQuery(widget, controls, widgets)`; the request it makes is the
chart's query key, so a chart re-queries only when a control it depends on changes.

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
- **Share links (`?token=`) are in scope.** Tokens made on the directory (`share/directory/{dirId}/anyone`, what v1's
  and v2's Share dialog create) hold `directory:view:<dirId>` and do open the dashboard (checked 2026-10-27). Only the
  token from `share/dashboard/{id}/anyone`
  (and the older `dashboards/{id}/share`) carries `0:dashboard:view:<id>`, while `GET dashboards/{id}` checks
  `directory:view:<directoryId>`, so it answers 401 `not_allowed` (v1 is affected too). Needs a server fix; still so
  in M5b, which lists what the client needs then.
- How filters reach charts (verified in v1 and on the server): every v1 filter widget has `isEnableFilter() = false`, so
  none of them sends a dashboard-wide `FilterRequest`. A chart is filtered only where its own filters hold a
  `dynamic_condition` naming the control; the server skips one without `final_condition`. The only `FilterRequest`
  a chart sends is its own inner filter's (`filter_id` = the chart's id). v1's `mainFilterRequestMap` and
  `affected_by_filter` only matter for URL / header filters (`InternalFilter`), which come with drill through.
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
| M4a | Widget actions (`features/dashboard/widgets/chart`): a menu in the chart's action bar (Change date function, Reset drill down, Download CSV / Excel) and a point menu, opened by a right click on any Highcharts point (`HighchartsChart.onPointContextMenu`) or a click on a series point (Use as a filter, Drill down by text field or date part, Reset filter, Reset drill down). Pure transforms in `core/query`: `zoom.ts`, `drilldown.ts`, `tableSort.ts`; the viewer's changes are a per-chart reducer (`chartView.utils`) applied before the controls. Tables sort on the server by one column (header click), back to the first page. Export: `QueryService.export` (`query/{csv,xlsx}`, every row). Drill fields from `core/schema/SchemaService` (`GET databases/{name}`, fixture `core/schema/database.fixture.json`) | Done |
| M4b | Header filters (v1 `InternalFilter`): `core/query/internalFilter.ts` (model, v1's condition builder), `core/query/filtersParam.ts` (`?filters=` in v1's JSON, read on load), one more entry of the controls state, sent by every chart as a `FilterRequest` (`buildChartQuery`'s `headerRequests`). Filter bar under the header (`controls/header-filters`: edit condition and values, turn off, remove) and the chart's filter icon (`AppliedFiltersView`, on/off per chart). Drill through in the point menu: `core/query/drillThrough.ts` (clicked value → filters), `DashboardService.listDrillThrough` (`dashboards/list_drill_through`, 40 per page, Load more), the dashboard opens in a new tab with `?filters=`. Field types in `core/schema/fieldTypes.ts` | Done |
| M5a | Access and display (`features/dashboard/access`, `features/dashboard/mode`): permissions (owner: all, else `share/dashboard/{id}/action_permitted` via `core/permission/ResourcePermissionService`; downloads hidden without `download`), password-protected dashboards (`data.config` of the directory, `DashboardService.getDirectoryId`; nothing is queried until the password is given), Full screen and TV mode in the header's Options, auto refresh (`useAutoRefresh`). The theme palette for charts was already done in M2 (`chartColors`) | Done |
| M5b | RLS View As (`features/dashboard/view-as`: user search via `core/user/UserService` `user/profile/suggest`, charts through `QueryService.queryAs` `chart/view_as`, offered with `rls:view:*`), embedded route (`EmbeddedDashboardPage`, outside the app layout). Left: share token (`?token=`), blocked by the server (see below) | Done, token blocked |
| M6a | Edit mode (`features/dashboard/edit`): Edit with the `edit` permission (desktop, not embedded, not under View As), grids editable, layout saved on Save (`layoutToSave`: each grid's unplaced widgets placed, z-index from 0), rename the dashboard, Adding (text, image by URL, tab, filter panel, paste), widget menus (edit title, edit text, replace image, copy, duplicate, delete), copy/paste through the clipboard, leave guard. Server writes in `DashboardService` (`widgets/create`, `widgets/{id}/edit`, `DELETE widgets/{id}`, `PUT dashboards/{id}` for the setting), cache updates in `useDashboardEditor`, new widget JSON in `core/dashboard/widgetJson`. `ChartBuilderBridge` adds Add chart / Config chart once ChartBuilder exists | Done |
| M6b | Tabs and filter panels (`edit/tabEdit.utils`): add, rename, delete and sort tabs, move widgets into a tab and back out, add and remove a filter panel's filters, header style (Config tab), now also rendered by `TabWidgetView` | Done |
| M6c | Dashboard settings in one dialog (`edit/settings`, split again in M7d): theme (with v1's border and background defaults), overlap, auto refresh, the date filter in the header and its default range, size, background, border, widget defaults (padding, card, title, subtitle) | Done |
| M7a | Header and main date like v1 (`features/dashboard/header`, `controls/main-date`): v1's borderless icon + text buttons (Options, Edit; Adding, Options, Save in edit mode), one Options menu per mode (view: Relationship, Full screen, TV mode, Share, View As; edit: Relationship, Settings; full screen and TV: Relationship, Share), Relationship and Share given as optional `DashboardOptionHandlers`. Main date: a dashboard without a stored setting has the All Time main date (`DashboardSetting.default()`, v1); its own trigger and popover (preset dropdown, Start and End calendars, Cancel / Apply, Remove and Edit Main Date in edit mode); Setup Main Date Filter in the header in edit mode, which replaces the settings dialog's date filter toggle | Done |
| M7b | Share (`features/share`, `core/share`), one dialog for dashboards and the directory listing: people and groups (user suggest, owner row, Edit / View & Download / View / Remove access, batched until Apply), Get link (`share/{type}/{id}/anyone`), password protection (owner, dashboards and queries, `data.config.hashed_password`), Copy embed code (dashboards). A dashboard is shared through its directory (`share/directory/{dirId}`); Options → Share with the `*` permission, not on mobile or embedded | Done |
| M7c | Relationship (`features/dashboard/relationship`, `core/relationship`) with React Flow (`@xyflow/react` 12, its own lazy chunk loaded on first open): `GET/POST relationships/{dashboard_id}`, a node per view (sql views under `adhoc_analysis`, columns from `databases/adhoc/tables`), collapsed nodes show id-like and joined columns, drag a column onto another table's column to join, click a line to remove it, positions in `extra_data.table_positions` under v1's keys, zoom / Fit content / Full screen, Discard Changes and Save in edit mode. Options → Relationship in every mode; edits only in edit mode | Done |
| M7d | Settings split back into v1's entry points (`edit/settings`): Options → Settings (edit mode) opens Themes (v1's thumbnails, Reset to default, Overlap mode); a gear at the canvas corner in edit mode opens Edit Dashboard (Size / Background / Color), Edit Widgets (Primary Text / Secondary Text / Padding and Border / Background color), Themes and Auto Refresh Data (submenu, saved at once). Replaces M6c's single dialog; saving is unchanged (whole stored setting, unknown keys kept). Every key v1 writes was already mapped in `DashboardSetting` | Done |
| M7e | Widgets and canvas like v1 (measured within 1px on both test dashboards): v1's grid gaps (20px, 16px in tabs and panels), chart background default `#FAFAFB`, widget menu on hover in view mode and v1's gear in edit mode (`widgets/menu`), tab widget with boxed tab headers and per-tab menus (`TabNavView`, no antd Tabs), filter panel without a card, KPI without a theme in v1's plain layout, flat table look (48px rows, sticky header, footer, v1 number format), HTML x-axis labels, resize handles on hover; filter widgets' title style, search box, tab filter boxes and choice colours, slicer, input, date select (opening the main date calendar) and tree filter sizes | Done |

Order: M7a, M7b and M7c in parallel (separate folders; M7b and M7c are wired into the header after M7a), then M7d and
M7e (both touch the header and the canvas). Each step is checked against v1 with Playwright screenshots of the same
dashboard on both apps.

Decisions (M4a):

- **Per-chart view state** (drill steps, date function, table sort) lives in the chart's own reducer, not in the
  dashboard's controls: it isn't shared, and Reset Filters leaves it (v1 too). It is lost when the chart unmounts (a
  tab switch), as v1 lost it on reload.
- **Point menu** opens on a right click on any point, like v1, plus a left click on series points (M3b). Pie slices keep
  their left click as cross filter.
- **Drill down** offers the text and date columns of the dimension's table, without those already drilled (v1);
  charts on ad hoc SQL tables get none (v1 parsed the SQL for a schema). Map charts wait for geo areas.
- **Export** sends every row (`from`/`size` -1). v1 sent a table's first page bounds, which the server ignored.
- **Not ported**: v1's zoom and drilldown icons in the action bar (`enable_icon_zoom`, `is_enable_drilldown`), and
  the widget-level "Use as a filter" / "Drill down" that ask for a value first (`DimensionPicker`): the point menu
  covers both.

Decisions (M4b):

- **`?filters=` keeps v1's format**, `JSON.stringify` of v1's `InternalFilter` with camelCase keys (its field's too),
  mapped key by key to the server's snake_case field, so drill through links work between v1 and v2. Only table and
  view fields are read; v1 never put other fields there.
- **Header filters are controls.** They live in the same reducer; Reset Filters puts them back to what the URL opened
  with (v1's button never touched them). Edits stay in memory, the URL is not rewritten (v1 too). v1's local storage
  filters (`DataManager.saveLocalFilters`) are not read: their Add Filter button was commented out in v1.
- **Who gets them**: every chart, filter widgets included, unless its setting turns `affected_by_filter` off or the
  viewer switches them off with the chart's filter icon (per-chart view state, like M4a). The inner filter's values
  follow its chart. The server only applies a filter to charts on the same table or a related one.
- **Editor**: one condition list per field type instead of v1's Range / Selection modes; list values are typed in
  (v1 offered the column's values from the server); dates are picked with a date time picker and sent as
  `yyyy-MM-dd HH:mm:ss`.
- **Drill through** carries the dashboard's header filters plus the clicked value: `in` for text, `equal` for numbers,
  two bounds for a histogram bin, nothing for bubbles. Dates get no filter: the chart groups them by a date function
  the filter can't hold. Disabled for tab filters (v1). The listing is the server's: dashboards with a filter widget
  on one of the carried fields, the current one excluded.

Decisions (M5a):

- **Permissions** only matter for downloads in view mode so far; `DashboardPermissions` (`canEdit`, `canShare`, ...)
  is ready for edit mode (M6) and Share (Phase 2). Until the server answers, the viewer may only view.
- **Password**: checked in the browser against the sha256 hex in `data.config.hashed_password`, like v1 (`@noble/hashes`,
  as `crypto.subtle` needs a secure context). The server doesn't enforce it: the dashboard's JSON is already loaded,
  only the charts wait. Asked on every visit, not of the owner; a directory that can't be read counts as unprotected
  (v1 then never loaded the charts). Setting a password belongs to the Share dialog (Phase 2).
- **Full screen** lays the page over the app (fixed, below antd's popups) instead of hiding the app header. **TV mode**
  also asks the browser for full screen on the whole document, so menus still show, and scales a dashboard taller
  than the screen to fit; Esc goes back to view.
- **Auto refresh** invalidates the dashboard's chart queries each interval: charts keep their data while they reload,
  their filters stay as they are (v1 re-ran its whole init), and nothing runs while the tab is hidden. Picking the
  interval is a setting, so it comes with edit mode (M6).
- Not ported here: Share, View As and Relationship in the Options menu (Phase 2, M5b, Phase 5).

Decisions (M5b):

- **View As** keeps the picked user's profile exactly as `user/profile/suggest` sent it and sends it back as
  `user_profile`: row level security reads its `properties`, whose keys v1 renamed. It is page state, not a mode:
  full screen still works while viewing as someone, and exports stay the viewer's own (the server has no View As
  export). Offered only with `rls:view:*`, which the server requires; v1 offered it to everyone.
- **Embedded** (`/embedded/dashboard/:name`): the page without the app layout, header filter bar, Back and Options;
  the title, Reset Filters and the main date stay (v1). Its name is rewritten to the embedded path; an unknown
  dashboard says "Dashboard not found" in place instead of leaving the iframe.
- **Share token**: a directory token (M7b) gets 200 on `GET dashboards/{id}`, `get_directory_id` and
  `directories/{id}` (checked 2026-10-27); what follows applies to dashboard tokens only. Checked 2026-10-26: with `Token-Id`, `chart/query` and
  `permission_tokens/{token}/action_permitted` answer, but `GET dashboards/{id}`, `dashboards/{id}/get_directory_id`
  and `directories/{id}` return 401. `DashboardPermissionFilter.requireTokenPermission` builds
  `directory:view:<directoryId>`, while the token holds `dashboard:view:<dashboardId>`. To open token links, the client
  still needs: the route guards to let a token through without a session, no `check_session` without a session
  (its 401 sends the viewer to login), and permissions from `permission_tokens/{token}/action_permitted`.

Decisions (M6):

- **What saves when**: every widget change is saved at once, like v1; only the layout waits for Save, which sends one
  position per widget (the server rejects anything else) and goes back to view. There is no Cancel (v1 had none).
  Auto refresh pauses while editing.
- **Leave guard**: leaving the dashboard while editing asks first (React Router `useBlocker`); renaming rewrites the URL
  and doesn't. Closing the tab with an unsaved layout asks through `beforeunload`.
- **New widgets** are v1's `empty()` JSON, verified on the local backend, placed at -1/-1 so the grid finds a free
  slot; Save turns that into real positions per grid.
- **Images by URL**: the open source server has no upload endpoint (`/upload`, `/media/upload` answer 404), and v1's
  stock image search is not ported.
- **Copy and paste** use v1's `CopiedData` envelope through the system clipboard, but the widget inside is the server's
  JSON (`format: server`); v1's copies hold camelCase objects only v1's global key renaming could read, so they are
  refused. Ctrl+V pastes in edit mode only (v1 pasted in view mode too); Paste in the menu reads the clipboard.
- **Inner filter ids** come from the chart's id when read (`-(id + 10)`, v1's rule): a chart v1 duplicated kept its
  original's, so both shared one selection.
- **Tabs**: the widget menu acts on the open tab (v1 had a menu per tab header); tabs are sorted with buttons, not by
  dragging. Deleting a tab or a tab widget puts its widgets back on the dashboard in free slots (v1 left them at their
  coordinates inside the tab, on top of other widgets). Widgets move in and out of tabs through a picker, like v1.
- **Settings**: v1's four dialogs are one, saved over the stored setting so unknown keys stay. Picking a theme applies
  its border and background like v1; corners share one radius. Setting up or removing the date filter restarts the
  dashboard's controls. Text widgets edit their font size, color, alignment and emphasis, not their background.
- **ChartBuilder** is not ported: `DashboardPage` takes an optional `ChartBuilderBridge`, and Add chart and Config chart
  appear once it is given. v1's inner filter items (add, update, delete a chart's filter) open ChartBuilder too; they
  come with it.

Decisions (M7a):

- **Main date default**: no stored setting means `DashboardSetting.default()` with an all_time main date (v1); a stored
  setting without `main_date_filter` has none. `settingJson` is never filled with defaults on read; the first save
  writes the whole setting, as v1 did.
- **Main date UI** has its own popover (`controls/main-date`), replacing M3b's preset select + range picker; the date
  select filter widget keeps `DateRangeModePicker`. The trigger is a button, not v1's typable input. Setup and Remove
  apply locally first, then save; Remove also clears the viewer's stored choice (`main_filter_mode_<id>`).
- **Options in full screen and TV** list Relationship and Share (v1 meant Share there, its check was a typo); the
  button hides when the menu would be empty. Reset Filters is hidden on mobile, like v1.

Decisions (M7b):

- **Only real changes are sent**: a user set back to their level sends nothing, an added user set to Remove access is
  not shared, and the password is only written when it changed (v1 removed it on every Apply). Turning a stored but
  disabled password back on enables it. Apply errors are shown and the edits kept.
- **Server shapes differ from v1's types**: share ids are strings (`"s_1"`); `PUT share/.../edit` answers
  `{username: true}`; `GET .../anyone` without a link is a 404 with an empty body (read as no link). `share/.../edit`
  refuses edit for users outside the Editor group (400, shown in the dialog); create does not check it.
- The user search hides the owner and the users already listed. Copy uses the clipboard with an `execCommand`
  fallback on plain http, and antd `message` for feedback (v1 a tooltip). Link slugs follow v2's `toSlug`; only the id
  is read back.

Decisions (M7c):

- **React Flow** instead of v1's Konva (the user's choice). It brings `zustand` as an internal dependency; v2 code still
  uses no state library. Its attribution link is left visible.
- **Saved lines are drawn in view mode**, read-only (v1 drew none). A joined column the schema no longer has is still
  drawn with the field's type; a schema that fails to load gives an empty table, a failed relationship request an error.
- **Positions** keep v1's keys (`camelCase(dbName + tblName)`) so v1 and v2 read each other's layout; other stored keys
  are kept. Moving a table back to where it was is not a change. Save sends `views` as loaded.
- The server fills `alias_name` and the `sql_query` extras when it stores views; v2 sends back only what v1 sent.

Decisions (M7d):

- **Background image** is a URL: the server has no upload endpoint, so v1's Upload Image is not ported.
- **Picking a theme leaves Overlap mode** as the dialog's switch has it (M6c turned it on with every theme).
- Dialogs render inside the dashboard page to take the theme's accent, but stay light in dark themes (v1's turned
  dark). B/I/U, alignment, link and corner icons come from `@ant-design/icons`. A failed save shows in the footer.

Decisions (M7e):

- **Chart menu**: a "⋮" shown on hover in view mode (always on touch screens); v1 had none and used a right click,
  which v2 keeps for the point menu. Edit mode shows v1's gear on every widget.
- **Kept on purpose**: a tab filter's selected normal tab keeps an active background (v1 read a misspelled variable
  and drew white on white); tree filter checkboxes fall back to v1's default inactive colour; the Item type dropdown
  shows a select (v1's renderer is deprecated and its card empty); a tab widget without a stored header style uses
  the theme's tab backgrounds, the defaults of the Config tab dialog. Choice labels follow `options.textColor` like v1,
  so a filter without one shows white labels.
- **Left**: submenus (date function, drill down) in antd's look, column charts' y-axis steps (v1 20M, v2 25M on
  Revenue by region), table per-field formatting, conditional colours and totals; a dashboard saved with a dark theme
  was not checked end to end.

v1 bugs not carried over: resize listener never removed, text edits saved twice, query settings mutated in place,
inner filters kept after reset, the always-null `mainDateFilterRequest`, unsanitized text widget HTML, data label
min/max conditions that hid every non-zero value (`ChartUtils.isShowValue`), tab filters that forgot the selection on
remount and dynamic conditions that threw (and broke the chart) for values they can't hold. M3b: parameter inputs that
changed nothing, slicers on a date column sending epoch millis (and their end date at 00:00:00), tree filters sending a
checked node's value again for each checked child, date select defaults given as two dates applying nothing. M4a:
zoom keeping the old function's `result_type`, query settings mutated by zoom and drilldown. M4b: a second drill
through dropping the first one's filters (v1 carried only local storage filters), drill through on a date sending an
`in` on the label that matched no row, number `between` checking its first value twice. M6: duplicated charts sharing
their inner filter, tab children left on top of other widgets, Ctrl+V pasting in view mode.

Chart types to support (v1 `ChartType` enum): Area, AreaRange, AreaInverted, AreaSpline, Bar, BellCurve, Bubble,
Column, ColumnRange, ColumnDrillDown, BarDrillDown, PieDrillDown, Funnel, Gauges, HeatMap, TreeMap, Histogram, Line,
Spline, LineInverted, Pareto, Pie, SemiPie, Pyramid, Scatter, Table, Kpi, WordCloud, StackedColumn, StackedBar,
StackedLine, Map, PivotTable, Parliament, SpiderWeb, Sankey, FlattenTable, FlattenPivotTable. The filter widgets
(TabFilter, SingleChoice, MultiChoice, DropDown, SlicerFilter, DateSelectFilter, InputFilter, TreeFilter) are done.

Suggested order: the common series charts (Column/Bar/Line/Area/Pie) and Kpi, then Table/Pivot, then the rest.

### Phase 4: Dashboard (edit) and Chart builder

| Feature | v1 location | Size | Status |
|---|---|---|---|
| Dashboard edit mode (layout, add/remove/resize widgets, settings) | `screens/dashboard-detail` | (see above) | Done (M6), without ChartBuilder: adding or configuring a chart and its inner filter come with it |
| Chart builder | `screens/chart-builder`, `screens/dashboard-detail/components/data-builder-modal` | 53 | In progress: plan, decisions and steps (CB0 to CB8) in [`CHART_BUILDER.md`](CHART_BUILDER.md); CB0 to CB4 done |
| Query/Viz setting resolvers and handlers | `src/shared/resolver`, `src/shared/module/ChartBuilderModule.ts`, `web/docs/CREATE_CHART_FLOW.md` | – | Done for the chart types in scope (CB1, `core/chart-builder`) |
| Chart settings (Settings tab) | `src/shared/settings` | 140 | Part of ChartBuilder (CB6) |

#### Notes for wiring the grid

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

The field drag and drop notes (`shared/field-dnd`) moved to [`CHART_BUILDER.md`](CHART_BUILDER.md).

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
