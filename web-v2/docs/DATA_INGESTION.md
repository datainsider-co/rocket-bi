# Data Ingestion: source, job, lịch sử và import CSV

Tài liệu sống của việc migrate Data Ingestion (Phase 8 trong [`MIGRATION.md`](MIGRATION.md)). Cập nhật cột **Trạng
thái** khi một bước xong.

## v1 hoạt động thế nào

- **Quy mô**: `screens/data-ingestion` (156 file) và `di-core/data-ingestion` (136 file), khoảng 36.5k dòng. Nặng nhất là
  `MultiJobCreationModal.vue` (1414 dòng), `JobCreationModal.vue`, `DataSourceScreen.vue` và `JobScreen.vue` (mỗi file
  trên 1100 dòng).
- **Bị tắt** ở cả dev lẫn prod: `VUE_APP_IS_DISABLE_INGESTION: true`, `VUE_APP_IS_DISABLE_STREAMING: true`.
- **Màn hình**: `/data-ingestion/*` có sidebar Data Sources, Jobs, Queued Jobs (vẫn là Jobs nhưng lọc
  `Queued/Initialized/Syncing`, có auto refresh), Streaming, Jobs History. Ngoài ra có `/shopify` và
  `/third-party-auth/:config_type` (trang popup OAuth do chính app v1 host).
- **API** (scheduler client, mỗi request gắn header cứng `access-token: job$cheduler@datainsider.co`):
  - `source/*`: create, list, update, `{id}` (get, put, delete), multi_delete, test, `{id}/database`, table, column, các
    endpoint token của Google / Facebook / TikTok / Shopify.
  - `job/*`: create, list (`current_statuses` để lọc Queued), update, delete, multi_delete, multi_create
    (`base_job` + `table_names`), multi_create_jobs, preview.
  - `schedule/job/{id}/now`, `schedule/job/multi_sync/now`, `schedule/job/{id}/kill`, `worker/job/test`, `history/list`.
  - `relay/streaming_job/*` (Kafka).
- **Model**: cây class đa hình phân biệt bằng `class_name`: 17 loại `JobName` (`jdbc_job`, `ga4_job`, …),
  `DataSourceInfo` theo từng loại, `TimeScheduler` 7 loại (`none_schedule`, `schedule_once`, `schedule_minutely`,
  `schedule_hourly`, `schedule_daily`, `schedule_weekly`, `schedule_monthly`; server: `ScheduleTime.scala`).
- **Code ngoài ingestion dùng lại**: Data cook dùng `TimeScheduler` và `SchedulerSettingV2`; connector config dùng
  `ManagePropertyModal`; ngoài ra `ForceRunSettingModal`, `StatusCell`, `RefreshButton`, và `DataIngestionTable` (Database
  management).

Code v1 cần đọc: `screens/data-ingestion` (`components/`, `form-builder/`, `store/`), `di-core/data-ingestion`,
`components/di-upload-document` (CSV), `shared/components/third-party-authentication`.

### Tạo job: hai modal

| | `JobCreationModal` (single) | `MultiJobCreationModal` |
|---|---|---|
| Dùng khi nào | Edit job của 12 loại; tạo job Palexy sau khi tạo source | Nút "Add Job"; tạo job GSC / Hubspot / Mixpanel sau khi tạo source; edit job Facebook, Google Ads |
| Chọn bảng | Một bảng | Thêm toggle **"Sync all tables"** (all-or-one) |
| Đích | `JobWareHouseConfig` (database + table) | Chọn all thì `MultiJobWareHouseConfig` (chỉ database, tên bảng theo nguồn) |
| Loại job | Có Palexy, TikTok (cố định single); không có Google Ads, Facebook, Hubspot | Có Google Ads, Facebook, Hubspot |
| Scheduler | Có Minutely | `ignoreMinutely` |
| Submit | Tự gọi create / update | Gọi callback; màn cha chọn create, multi_create, multi_create_jobs hay update |

Hệ quả: 6 cặp component con nhân đôi (`Jdbc`/`MultiJdbc`, `Mongo`/`MultiMongo`, `GenericJdbc`/`MultiGenericJdbc`,
`BigQuery`/`MultiBigQuery`, `Shopify`/`MultiShopify`, `WareHouse`/`MultiWareHouse`).

### Tạo source

- 19 class `*FormRender` (2110 dòng): JSX của Vue trong class thường, nhận `h` từ ngoài, mỗi field là một cặp
  getter/setter sửa thẳng vào domain object, validate bằng cách `throw` chuỗi lỗi.
- `DataSourceFormFactory` với `switch` 19 nhánh; `DataSourceConfigForm.tsx` chỉ gọi `formRender.renderForm(h)`.
- `DataSourceConfigModal.vue` bọc bên ngoài, ẩn / hiện Test connection, Add properties, Re-connect bằng cách kiểm tra
  từng loại. S3 có modal riêng, nguồn OAuth đi qua callback `onSubmit`.
- 5 loại JDBC (MySQL, SQL Server, PostgreSQL, Redshift, Oracle) gần như copy-paste nhau.

### Anti-pattern và bug của v1 (không mang sang)

- Bốn `switch` theo loại job chạy song song (template `v-if`, `loadFromData`, `handleSelectDataSource`,
  `isValidFromDatabase`), trong cả hai modal.
- Validate và load qua khoảng 20 `@Ref` (`child.isValidSource()`, `child.loadData()`, `child.setDatabaseName()`).
- Một object `job` mutable truyền `.sync` xuống khoảng 15 component con; `$forceUpdate()` trong watcher.
- Store toàn cục `DataSourceModule.databaseNames/tableNames` dùng chung giữa các modal, reset tay trong `handleHidden`.
- Logic submit nằm ở 3 nơi. `JobScreen.createJob` tạo `clonedJob` với `toSchedulerV2` nhưng gửi `job` gốc, nên format
  scheduler gửi lên khác nhau tuỳ chỗ mở modal. Custom metrics của bảng `event` GA4 chỉ có ở luồng JobScreen.
- `DataSourceScreen.verifyMessage` chỉ `return` khi origin sai, nên message `postMessage` từ origin nào cũng được xử lý.
- Convert snake / camel toàn cục; secret cứng `admin_secret_key=12345678` và `DI-SERVICE-KEY: 12345678` (CSV);
  repository mock nằm trong code production.

## Kiểm tra backend local (2026-10-29)

- Source server trong repo không có controller cho `source/*`, `job/*`, `history/*`, nhưng image docker trả lời:
  `history/list` 200; `source/list`, `job/list` 200 khi có header `access-token`, thiếu header thì 500 "unauthorized
  access". `relay/streaming_job/list` 404.
- JSON của server là snake_case (`class_name`, `start_time`, `recur_every`, `include_days`).
- **CSV** (`schema/controller/http/IngestionController.scala`) có hai luồng:
  - Cũ, v1 dùng: `ingestion/csv/register` → `ingestion/csv/upload` theo batch (server giữ `csv_id`; `upload` không yêu cầu
    đăng nhập). `GET ingestion/csv/{id}` của v1 không tồn tại (405).
  - Mới, v1 chưa dùng: `ingestion/csv/detect` (đoán schema, preview) → `ingestion/csv/schema` (tạo database nếu chưa có
    và tạo / merge bảng) → `POST ingestion/csv` theo batch (`db_name`, `tbl_name`, `csv_setting`, `data`; kiểm quyền
    `database:edit:*`).
  - `CsvSetting` của server chỉ có `include_header`, `delimiter`, `add_batch_info`; encoding xử lý ở client.

## Quyết định (2026-10-29)

- **Phạm vi**: bỏ Streaming (server 404), SDK tracking (v1 đã comment out), Lake job (Lake house không migrate), Google
  Analytics UA (Google khai tử 07/2024).
- **MVP**: MySQL, PostgreSQL, SQL Server, Oracle, Redshift, Generic JDBC và CSV. Catalog vẫn liệt kê các loại còn lại
  (MongoDB, BigQuery, S3, Hubspot, Mixpanel, Palexy, Google Sheets, GA4, Search Console, Google Ads, Facebook Ads, TikTok,
  Shopify) ở trạng thái disabled kèm tooltip "Coming soon", làm sau MVP.
- **Dữ liệu tạo từ v1** thuộc loại v2 chưa hỗ trợ: vẫn hiện trong danh sách, delete / force sync / cancel dùng được, edit
  disabled kèm tooltip. Model giữ JSON gốc của các loại này để không ghi đè mất dữ liệu.
- **Header `access-token`**: v2 vẫn gửi để tương thích, qua một `SchedulerClient` riêng bind trong DI, giá trị từ
  `VITE_SCHEDULER_ACCESS_TOKEN`. Ghi nợ cho backend.
- **Một `JobFormModal`** thay hai modal, cấu hình qua props:

  ```tsx
  <JobFormModal
    initialJob={job}       // có id thì là edit, không thì là create
    lockSource             // không cho đổi source (mở từ dòng Data Source)
    allowMultiTable        // cho chọn nhiều bảng; edit luôn là single
    onSaved={...}
  />
  ```

  - Registry `JobKind` theo `class_name`: `defaultJob(source)`, zod `schema`, `SourceSection`, `SyncSection`, `multi`
    (`'tables'` | `'expand'` | `false`). Bốn `switch` của v1 thành một lần tra registry.
  - Form: react-hook-form với `z.discriminatedUnion('class_name', …)`, section đọc qua `useFormContext`, không ref.
  - Gợi ý database / bảng / cột: TanStack Query theo `[sourceId, db]`, không store toàn cục.
  - Submit: pure function `planJobSave(job, selection)` trả về `update` | `create` | `multiCreate` (job/multi_create) |
    `createJobs` (job/multi_create_jobs), có unit test. Hook `useSaveJob` thực thi (kể cả tạo database đích mới).
  - UX: multi-select bảng có "Select all" thay toggle all-or-one. Một bảng thì có ô tên bảng đích; từ hai bảng thì tên
    bảng đích theo bảng nguồn. Quy tắc Minutely đặt một chỗ.
  - S3 giữ wizard riêng (sau MVP).
- **Một `SourceFormModal`**, theo pattern của `features/data-source/setup` (`RegistryConnectionFieldsFactory`,
  `FormField`, `PropertiesFields`):

  ```ts
  interface SourceKind<V> {
    type; label; icon; status: 'available' | 'coming-soon';
    schema: ZodType<V>; defaults: V;
    Fields: ComponentType<{ control: Control<V> }>;
    toSource(values: V): DataSource; fromSource(source: DataSource): V;
    capabilities: { testConnection?: true; properties?: true; reauth?: OAuthType };
  }
  ```

  Footer hiện nút theo `capabilities`. `JdbcHostFields` dùng chung cho 5 loại JDBC. `PropertiesFields` chuyển lên
  `shared/`. Tạo xong source thì mở `JobFormModal` với `lockSource`.
- **CSV** dùng luồng mới của server (detect → schema → ingest), bỏ hai secret cứng. Đọc file bằng **papaparse** (chunk,
  encoding, xuống dòng trong ngoặc kép). Wizard: chọn file → delimiter / header / encoding → preview, sửa tên và kiểu cột
  → database và bảng đích → upload theo chunk, tiến độ theo số chunk, dừng được, retry hoặc bỏ qua chunk lỗi. CSV là
  import một lần, không tạo source hay job.
- **Vị trí code**:

  ```
  src/core/schedule/         ScheduleTime, dùng chung với Data cook
  src/core/ingestion/        source/, job/, history/, csv/, service, IngestionModule (DiModule)
  src/shared/schedule/       ScheduleForm, ForceRunModal
  src/shared/properties/     PropertiesEditor (dùng chung với connector config)
  src/features/ingestion/    layout/, sources/, jobs/, history/, csv/
  ```

  Tên `ingestion` (không phải `data-source`, đã dùng cho setup ClickHouse connector; không dùng `data`, bị `.gitignore`).

## Phát hiện ở DI0 (2026-10-29)

Chạy bằng curl trên docker local. Request và response lưu ở `src/core/ingestion/ingestion.fixture.json` (password thay
bằng `<password>`). Dữ liệu để lại cho các bước sau: source 1 "DI0 MySQL (edited)" (trỏ vào `rocket-bi-mysql`), job 1
(`sample_v2.sales` → `di0_ingest.sales`), job 2 (`caas.organization` → `di0_multi`), bảng CSV `di0_csv.products`.

- **Job chạy thật.** Không có worker riêng (`worker/job/test` 404), nhưng scheduler trong server tự chạy job: job 1
  Synced, history ghi 200 dòng; hai job tạo bằng `multi_create` cũng chạy ra bảng trong `di0_multi`. Warehouse của stack
  local là MySQL (`rocket-bi-mysql`), không có ClickHouse. Bỏ nút Test của job (v1 gọi `worker/job/test`).
- **Header `access-token`** bắt buộc cho `source/*`, `job/*`, `schedule/*`; `history/list` không cần.
- **Source JDBC**: `class_name: jdbc_source`, phân biệt bằng `database_type`: `MySql`, `SqlServer`, `Oracle`, `Redshift`,
  `Postgres`, `GenericJdbc` (giá trị khác thì 400 "key not found"). Host, port, database nằm trong `jdbc_url`, form edit phải
  tách ngược ra. v1 dựng URL:
  - MySQL `jdbc:mysql://host:port?k=v&…` (mặc định `connectTimeout=30000`).
  - SQL Server `jdbc:sqlserver://host:port;databaseName=db`.
  - PostgreSQL `jdbc:postgresql://host:port/db`, Redshift `jdbc:redshift://host:port/db`.
  - Oracle `jdbc:oracle:thin:@//host:port` + `/service` hoặc `:sid`, rồi `?k=v`. v1 tách properties bằng `&` sau service
    name nhưng dựng bằng `?`, nên properties của Oracle mất khi edit (bug v1, không mang sang).
  - Generic JDBC: người dùng nhập nguyên `jdbc_url`.
  - Giá trị properties không được URL-encode ở v1; v2 encode khi dựng và decode khi tách, kèm test.
- **Server trả password dạng plaintext** trong `source/list` và `source/{id}`. Form edit vẫn hiện password như v1 (ô
  `Input.Password`). Ghi nợ cho backend.
- **Body**: `source/create`, `PUT source/{id}` bọc `{ data_source }`; `source/test` gửi thẳng source; `job/create`,
  `PUT job/{id}` bọc `{ job }`; `job/multi_create` là `{ base_job, table_names }` và **nhận tập con bảng**: server tạo một job
  mỗi bảng, đặt tên `"<display_name> (database: caas, table: role)"`, bảng đích trùng tên bảng nguồn. Response của create /
  list là `{ job, source, creator }` và `{ data_source, creator }`.
- **Gợi ý**: `source/{id}/database` `{ extra_data }`, `source/table` `{ source_id, database_name, extra_data }`,
  `source/column` `{ …, table_name }`. `extra_data` là chuỗi JSON (v1 gửi `{"projectName":"","location":""}`, chỉ BigQuery
  dùng); với JDBC gửi `"{}"` được.
- **Sort** là tên cột trong MySQL, server đưa thẳng vào `ORDER BY` (cột lạ thì 500). Whitelist:
  - job: `id`, `name`, `job_type`, `creator_id`, `last_modified`, `sync_mode`, `source_id`, `last_successful_sync`,
    `next_run_time`, `last_sync_status`, `current_sync_status`. v1 sort cột Source bằng `source_name`, nên bị 500.
  - source: `id`, `name`, `creator_id`, `last_modified`, `data_source_type`.
  - history: `id`, `job_id`, `job_name`, `last_sync_time`, `total_sync_time`, `sync_status`, `total_inserted_rows`.
  - Mặc định như v1: job và source `last_modified`, history `id`.
  - Search bằng `keyword`; lọc Queued bằng `current_statuses`.
- **Scheduler**: format của server là `ScheduleTime.scala` (v1 gọi là "V2"); v2 chỉ mô hình hoá format này.
  - `at_hour`, `at_minute`, `at_second` là giờ **UTC** (v1 đổi từ giờ local). Khi đổi làm lệch ngày, v1 không dời
    `include_days` / `recur_on_days`; v2 dời theo, có test.
  - `include_days` viết hoa: `MONDAY` … `SUNDAY`.
  - Gửi format UI của v1 (`at_time`) thì server bỏ qua và đặt `start_time` bằng lúc lưu: đã xác nhận bug của luồng "Add
    Job" trong v1.
  - Job `schedule_once` đã chạy có `next_run_time = 99999999999999` (không chạy nữa); hiện là "–".
- **Action**: `schedule/job/{id}/now` và `multi_sync/now` cần `{ at_time, mode: "Continuous" }` (`OnceTime` bị từ chối;
  v1 cũng chỉ gửi `Continuous`), nên không có lựa chọn mode. `multi_sync/now` trả `{ "<id>": true }`. `kill` trả
  `{ success: false }` khi job không chạy. `DELETE job/multi_delete`, `source/multi_delete` nhận body `{ ids }`.
- **Lỗi** có message đọc được, ví dụ test connection hỏng trả 400 `unable to connect to data source: …`: hiện nguyên.
- **CSV, luồng mới chạy được**:
  - `detect` xử lý đúng dấu ngoặc kép và xuống dòng trong ô, nhưng đoán kiểu yếu (`id`, `price` ra `string`), nên bước sửa
    kiểu cột là cần thiết.
  - `schema` tạo database nếu chưa có, không cần secret.
  - `POST ingestion/csv` **bỏ qua `include_header`**: header bị insert thành một hàng. v2 tự bỏ header và luôn gửi
    `include_header: false`.
  - Giá trị sai kiểu thành `NULL` mà không báo lỗi: preview phải cho thấy cột nào ra rỗng trước khi upload.

## Quyết định ở DI1 (2026-10-29)

- **Plain value giữ `json` gốc**, như `Widget` (không dùng entity deneric2): `DataSource` và `Job` là union theo `kind`
  (`jdbc` | `unsupported`), có `json` là bản server gửi. `jdbcSourceToJson` / `jdbcJobToJson` merge phần sửa lên `json`,
  nên field v2 không mô hình hoá (`query_statement`, `selected_columns`, `row_restrictions` của generic job, …) không mất.
  Loại chưa hỗ trợ không có hàm ghi.
- **Vị trí**: `core/schedule/ScheduleTime.ts`; `core/ingestion/` gồm `DataSource`, `Job` (kèm `JobInfo`, `canCancelJob`,
  `hasNextRun`), `JobHistory`, `DataSourceService`, `JobService`, `JobHistoryService`, `IngestionModule`, fixture DI0 và
  `testing.ts` (`fakeHttp`). `SortOrder` chuyển từ `DirectoryService` sang `core/listing/Listing.ts` cùng
  `ListingRequest`, `ListingPage` (ingestion là nơi thứ hai cần).
- **Ba service** thay vì một, mỗi cái một repository của v1. Sort field là union theo whitelist DI0 (`SourceSortField`,
  `JobSortField`, `JobHistorySortField`), nên không gửi được cột lạ.
- **`SchedulerClient`** (`core/http/tokens.ts`, bind trong `HttpModule`): cùng prefix, session và xử lý hết phiên như
  `ApiClient`, thêm header `access-token` lấy từ `VITE_SCHEDULER_ACCESS_TOKEN`, mặc định là giá trị mặc định của server.
  Cả ba service đều dùng nó (`history/list` không cần nhưng không sao).
- **Job mới** gửi các giá trị mặc định như v1 (`org_id: -1`, `sync_interval_in_mn: 60`, `destinations: ["Clickhouse"]`,
  `max_fetch_size: 0`, `last_synced_value: "0"`, status `Initialized`); job đọc từ server giữ giá trị của nó.
  `incremental_column` rỗng gửi `null`, như server trả.
- **`hasNextRun`** dựa vào `next_run_time` (> 0 và khác `NEVER_RUNS`), không theo schedule và status như v1.
- **Status lạ** đọc thành `Unknown`; schedule lạ đọc thành `none`; ngày của weekly không hợp lệ bị bỏ khi đọc.
- **Đổi giờ local ↔ UTC** của schedule (kèm dời ngày) chưa làm: thuộc `ScheduleForm` ở DI6a.

## Quyết định ở DI2 (2026-10-29)

- **Feature flag** `VITE_ENABLE_INGESTION` (`src/app/featureFlags.ts`): chỉ chuỗi `true` mới bật, không đặt là tắt; đọc
  lúc build. `.env.development` bật nó cho `pnpm dev` (Vitest chạy mode `test` nên không đọc), build mặc định tắt. Tắt
  thì không có route `/data-ingestion/*` (ra Not found) và không có link trên header.
- **Header**: `HEADER_NAV_ITEMS` thành `headerNavItems(flags)`; container `HeaderBar` truyền `navItems` xuống
  `HeaderBarView` và `MobileNavDrawer`. Data Ingestion đứng sau Data Warehouse như v1, icon port từ v1 `DatabaseIcon.vue`.
- **Routes** ở path của v1: `/data-ingestion` → `/data-ingestion/data-source`; `job`, `queued-job` (cùng `JobsPage`, chọn
  theo path như v1 `JobScreen`), `job-history`. Khai báo trong `app/router.tsx`, page lazy load.
- **Layout** (`features/ingestion/layout`): `IngestionLayout` (sidebar + `Outlet`), `IngestionSidebar` (giống
  `DirectorySidebar`, thu gọn dưới `md`), `IngestionPageHeader` (icon, tiêu đề, chỗ cho action). Sidebar không có
  Streaming. Nút "Add Data Source" / "Add Job" của v1 làm cùng DI4 và DI6, khi đã có modal để mở.
- Các trang hiện chỉ có header; DI3, DI5, DI7 điền listing. Đã kiểm bằng Playwright trên `pnpm dev`: redirect, chọn
  section, không lỗi console.

## Quyết định ở DI3a, DI4a, DI5a, DI7 (2026-10-29)

Bốn listing làm song song bằng 4 sub-agent, mỗi agent một thư mục; phần dùng chung làm trước rồi gom lại sau.

- **Dùng chung** (`features/ingestion/`):
  - `listing/`: `ListingState` (trang, cỡ trang, từ khoá, sort; đổi từ khoá / sort / cỡ trang thì về trang 1),
    `useListingState`, `useDebouncedCallback` / `useDebouncedSearch` (400ms như v1), `useKeepPageInRange` (khi `total` giảm,
    ví dụ job rời khỏi Queued lúc auto refresh, kéo trang về trang cuối thay vì hiện trang rỗng), `listingPagination`
    (luôn hiện "Total: N", cỡ trang 20/30/50/100/200 như `ListingFooter` của v1), `formatDateTime` (`MMM DD, YYYY HH:mm:ss`).
  - `ingestionQueries.ts` (key và query options, giữ trang cũ trên màn hình khi tải trang mới), `status/JobStatusTag`
    (icon v1 trong `public/ingestion/status/`), `testing.ts` (fake service), `renderIngestionPage.tsx` (render trang
    với provider; route thật nằm sau feature flag nên test không dùng `renderAppAt`).
  - Sort chỉ trên cột có trong whitelist DI0; mỗi cột map tường minh sang tên cột DB.
- **Data Sources** (`sources/`): cột Name, Owner, Type, Last Modified như v1, cả 4 sort được. Type hiện tên dễ đọc
  (MySQL, Microsoft SQL, PostgreSQL, …; v1 hiện `SqlServer`, `Postgres`), loại chưa hỗ trợ đặt tên theo `class_name`. Tên
  loại hiện khai báo cả ở đây và ở catalog: gộp khi dựng registry `SourceKind` ở DI4b. Chưa có icon theo loại.
- **Catalog** (`catalog/`): `SourceCatalogModal` (tiêu đề "Add Data Source"), 20 loại theo thứ tự v1; entry
  `available` có `form` (`{ kind: 'jdbc', databaseType }` | `{ kind: 'csv' }`) để DI4b mở đúng form, entry `coming-soon`
  không bấm được, có tooltip "Coming soon". Sửa cách viết của v1: MySQL, CSV. Icon trong `public/ingestion/sources/`;
  5 file SVG của v1 thực ra bọc ảnh raster (riêng Facebook 680 KB) nên render lại thành PNG 236×160 (2x), cả thư mục
  còn 192 KB. Chưa gắn vào trang: nút "Add Data Source" làm ở DI4b.
- **Jobs** (`jobs/`): một listing cho Jobs và Queued Jobs (`key` theo section nên đổi trang thì reset search / sort).
  **Cả hai trang đều auto refresh như v1** (v1 tạo cả hai handler với `isAutoRefresh = true`), mặc định 5s, có các lựa
  chọn 15s / 30s / 1m / Manual; dùng `refetchInterval` nên dừng khi tab bị ẩn. Cột Name, Source Name (không sort được:
  `source_name` là 500), Sync Mode, Last Sync (status kèm thời điểm sync thành công gần nhất), Next Sync (`--` khi
  không có lần chạy tới), Current Status. Không mang sang: sort Source, crash khi source đã bị xoá, năm 5138, Last Sync
  ẩn status khi chưa từng thành công.
- **Job History** (`history/`): cột Sync Id, Job Name, Last Sync Time, Total Synced Time, Status, Message, Total
  Inserted Rows như v1, mặc định `id` DESC. Thời gian dưới 1s hiện theo ms (v1 hiện `0s`), số dòng có dấu phân cách,
  message dài cắt một dòng kèm tooltip.
- Trạng thái lỗi có Retry (cả khi Refresh lỗi); rỗng và không có kết quả tìm kiếm là hai thông báo khác nhau. Các link
  "Click here" tạo source / job ở trạng thái rỗng của v1 làm cùng DI4b và DI6.
- Bảng Jobs và History rộng hơn khung ở 1280px, cuộn ngang (`scroll.x`).

## Các bước

| Bước | Phạm vi | Trạng thái |
|---|---|---|
| DI0 | **Spike và payload thật.** Trên docker local: tạo MySQL source và job, bấm sync, xem job có chạy thật không. Xác minh `multi_create` nhận tập con bảng, format scheduler server cần (`toSchedulerV2`), luồng CSV mới. Lưu request / response làm fixture | Xong |
| DI1 | **Core.** `core/schedule`; `core/ingestion` cho 6 loại JDBC và loại "unsupported" giữ JSON gốc; service, `SchedulerClient`, DiModule. Test round-trip với fixture DI0 | Xong |
| DI2 | **Khung.** Feature flag (`VITE_ENABLE_INGESTION`, kèm mục Feature flags của Phase 0), routes `/data-ingestion/*`, sidebar (Data Sources, Jobs, Queued Jobs, Job History), link trên header | Xong |
| DI3a | **Listing Data Sources.** Bảng phân trang, search, sort phía server, refresh; dòng của loại chưa hỗ trợ vẫn hiện | Xong |
| DI3b | **Action Data Sources.** Delete, multi-delete, edit (mở form DI4b), click dòng → tạo job (DI6); loại chưa hỗ trợ không edit | Chưa làm |
| DI4a | **Catalog loại source.** Modal liệt kê đủ loại kèm icon; coming-soon disabled kèm tooltip | Xong |
| DI4b | **`SourceFormModal`** cho 6 loại JDBC, Test connection, Properties, create / update; nút "Add Data Source" mở catalog | Chưa làm |
| DI5a | **Listing Jobs.** All và Queued (lọc `current_statuses`), cả hai auto refresh như v1, `JobStatusTag`, next run | Xong |
| DI5b | **Action Jobs.** Force sync, cancel, delete, multi force sync, multi delete, edit (DI6) | Chưa làm |
| DI6a | **Khung `JobFormModal`.** `planJobSave`, `useSaveJob`, `ScheduleForm`, database đích, sync mode | Chưa làm |
| DI6b | **`JobKind` JDBC.** `jdbc_job`, `generic_jdbc_job`, chọn nhiều bảng | Chưa làm |
| DI7 | **Job History.** Bảng lịch sử phân trang, search, sort. Link "Click here" tạo job ở trạng thái rỗng làm cùng DI6 | Xong |
| DI8 | **CSV.** Wizard như phần Quyết định | Chưa làm |
| Sau MVP | MongoDB, BigQuery → S3 → Hubspot, Mixpanel, Palexy (`'expand'`) → các connector OAuth (popup `/third-party-auth/:type` trong v2, kiểm origin của `postMessage`) | Chưa làm |
