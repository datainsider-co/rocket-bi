# Data Cook: ETL, lịch sử, share và trình sửa ETL

Tài liệu sống của việc migrate Data Cook (Phase 7 trong [`MIGRATION.md`](MIGRATION.md)). Cập nhật cột **Trạng thái**
khi một bước xong.

## v1 hoạt động thế nào

- **Quy mô**: `screens/data-cook` (70 file) và `di-core/data-cook` (khoảng 35 file), cộng
  `screens/chart-builder/data-cook` (ChartBuilder bản rút gọn cho Transform / Pivot), tổng khoảng 14k dòng. Nặng nhất:
  `ManageEtlOperator.ts` (1168 dòng, cả trình sửa ETL nằm trong một class), `EtlOperator.ts` (754), `ListEtlJob.ts` (539),
  `DestDatabaseTableSelection.vue` (471), `ManageFields.ts` (452), `DiagramPanel.vue` (429).
- **Không bị tắt bằng feature flag.** Header v2 đã có link Data Cook trong menu Data Warehouse
  (`app/layout/header/header.utils.ts`), hiện ra Not found.
- **Routes** (`src/router/Router.ts:368-415`): `/data-warehouse/data-cook` → `my-etl`; `shared`, `history`, `trash`;
  `my-etl/create` và `my-etl/:name` (`<slug>-<id>`). Sidebar: My ETL, Share With Me, ETL History, Trash.
- **API** (`DataCookClient`, cùng `/api` với các client khác, không có header riêng):
  - Listing: `POST data_cook/my_etl`, `shared`, `trash`, `history` với `{ keyword, from, size, sorts }`.
  - ETL: `GET data_cook/{id}`, `POST data_cook/create`, `PUT data_cook/{id}`, `DELETE data_cook/{id}` (vào trash),
    `DELETE data_cook/trash/{id}` (xoá hẳn), `POST data_cook/trash/{id}/restore`.
  - Chạy: `PUT data_cook/{id}/force_run` `{ at_time, mode }`, `PUT data_cook/{id}/kill`.
  - Trình sửa: `GET data_cook/{id}/preview/database_name`, `POST data_cook/{id}/preview_sync` `{ operators, force }`
    (`preview` theo `progress_id` của v1 không còn dùng), `POST data_cook/{id}/view_query` `{ fields, extra_fields }`
    (Manage Fields), `POST data_cook/third_party/database/list` và `table/list` (Save To Database).
  - Share: `GET data_cook/{id}/share/list`, `POST data_cook/{id}/share`, `PUT .../share/update`,
    `DELETE .../share/revoke`. Không đi qua `share/{type}/{id}` như dashboard và database.
- **Model**: một ETL là `display_name`, `operators` (chỉ các **lá** của đồ thị), `schedule_time`, `config`
  (`map_incremental_config` theo tên bảng nguồn), `extra_data` (vị trí trên canvas). Mỗi operator lồng operator cha của
  nó, nên `operators` là một cây lồng nhau, và một operator dùng chung xuất hiện nhiều lần (nhận diện bằng
  `dest_table_configuration.tbl_name`).
  - 8 loại theo `class_name`: `get_data_operator` (bảng nguồn, giữ nguyên `table_schema`), `join_operator`
    (`join_configs`: left / right operator, conditions, `joinType`), `transform_operator` (query setting của Table),
    `pivot_table_operator` (query setting của Flatten Pivot), `manage_field_operator` (`fields`, `extra_fields`),
    `sql_query_operator`, `python_operator`, `send_to_group_email_operator`.
  - Mỗi operator có thể kèm đích: `persist_configuration` (Save To Data Warehouse, `Update` | `Append`),
    `third_party_persist_configurations` (Oracle, MySQL, SQL Server, PostgreSQL, Vertica, có SSL / JKS), email (cũ, đã
    thay bằng `send_to_group_email_operator`).
  - Lịch chạy: đúng format `ScheduleTime` mà Ingestion đã làm (`SchedulerSettingV2` với `ignoreMinutely`).
- **Trình sửa** (`ManageEtlOperator`): canvas tự vẽ (DOM + `ArrowConnector` / `CurvedConnector`), bảng nguồn bên trái,
  operator ở giữa, đích bên phải. Thêm nguồn bằng popover chọn database / bảng. Context menu trên mỗi bảng: Join, Manage
  Fields, SQL Query, Python Query, Pivot, Transform, Save To Database / Data Warehouse, Send To Email, Edit Display Name.
  Bấm một bảng là preview bảng đó (gọi `preview_sync` cho các lá chứa nó). Lỗi ở một bước lan xuống các bước sau
  ("There is errors at previous operations"). Save mở `SaveEtl` (tên, lịch, incremental theo từng bảng nguồn).
- **Tạo ETL**: vào `my-etl/create` là v1 gọi `data_cook/create` ngay với "Untitled ETL" (cần id để preview), nên mỗi lần
  bấm New rồi bỏ đi để lại một ETL rỗng.

Code v1 cần đọc: `screens/data-cook` (`views/`, `components/manage-etl-operator`, `manage-operator-modal`,
`save-*`, `send-to-email`, `diagram-panel`), `di-core/data-cook`, `screens/chart-builder/data-cook`.

### Anti-pattern và bug của v1 (không mang sang)

- Một class 1168 dòng giữ toàn bộ state của trình sửa, sửa thẳng vào cây operator đang render (`$set`, `$delete`),
  modal con mở bằng `@Ref` và trả kết quả qua callback.
- Operator là class tree với `getAllGetOperators` / `getAllNotGetOperators` / `getParentOperators` cài lại ở mỗi lớp
  con; cùng một operator nằm ở nhiều nhánh, sửa một chỗ phải đi tìm các bản sao.
- Convert snake / camel toàn cục, cả các key là dữ liệu: vị trí trên canvas và `map_incremental_config` đều có key là
  tên bảng; `EtlConfig.fromObject` phải `toSnakeCase(key)` để đoán lại tên bảng (sai với tên có chữ hoa hoặc số).
- Phát hiện thay đổi chưa lưu bằng `isEqual` trên model class (so cả getter và field private).
- Tạo ETL rỗng mỗi lần mở trang tạo (xem trên).

## Phát hiện ở DC0 (2026-11-02)

Chạy bằng curl và Playwright (v1 ở `localhost:5050`) trên docker local. Request và response lưu ở
`src/core/data-cook/etl.fixture.json`. Dữ liệu để lại cho các bước sau:

- ETL 1 "DC0 probe": tạo bằng curl, đủ 5 loại operator SQL (kèm Save To Data Warehouse `dc0_out.sales_by_region`), Pivot,
  Manage Fields (kèm expression field), Send To Email (gửi bảng của một Transform) và Python, lịch weekly.
- ETL 2 "DC0 v1 ETL": làm bằng trình sửa của v1, gồm Join, SQL, Manage Fields, Save To Data Warehouse
  (`dc0_v1_out.regioncount2`, Append), lịch daily, incremental trên `sales_1`, vị trí các box.
- Database `preview_etl_1`, `preview_etl_2`, `dc0_out`, `dc0_v1_out` trong warehouse.

**Server và API**

- **Server có Data Cook**: code không có trong `server/` của repo, nhưng image docker trả lời. JSON snake_case. Không cần
  header riêng; client của v1 cũng là `/api`.
- **Listing** (`my_etl`, `shared`, `trash`) trả ETL với `operators: []`: chỉ `GET data_cook/{id}` có operator.
- **Response của các lệnh ghi**:
  - `create`, `PUT`, `DELETE` (vào trash), `restore` và xoá hẳn đều trả lại ETL, không phải `boolean` như type của v1.
  - ETL trong trash `GET` ra 404. Xoá hẳn chỉ được trong trash; ETL ngoài trash trả 404.
  - `kill` luôn trả `{ success: true }`, kể cả khi không có gì đang chạy.
- **`next_execute_time`** là `Long.MaxValue` (9223372036854775807) khi không có lần chạy tới. JSON đọc ra thành số lớn
  hơn `MAX_SAFE_INTEGER`.
- **Sort**: server đưa thẳng tên cột vào `ORDER BY`, như DI0; cột lạ trả 500. Whitelist:
  - ETL: `id`, `display_name`, `owner_id`, `created_time`, `updated_time`, `next_execute_time`,
    `last_execute_time`. Không có `status`. v1 chỉ cho sort Name và Created Time.
  - History: `id`, `etl_job_id`, `created_time`, `updated_time`, `total_execution_time`, `status`, `message`.
  - `keyword` tìm theo tên ETL, ở cả hai listing.
- **History** không có số dòng đã insert (type của v1 có `total_rows_inserted`). `message` là log nhiều dòng, mỗi bước
  một dòng. `etl_info` là ETL lúc chạy, không có operator.
- **Share** đi qua `data_cook/{id}/share` (`/list`, `/update`, `/revoke`):
  - Body giống share database: `resource_type: "etl"`, `resource_id` là chuỗi. Share id dạng `s_N`.
  - Quyền lưu là `0:etl:view:<id>`. Cấp `edit` cho user ngoài nhóm Editor bị 400.
  - `share/etl/{id}` là 500 (không có resource type `etl`).

**Operator**

- **JSON của operator**:
  - Nguồn (`get_data_operator`) giữ bảng đích ở `dest_table_config`; các loại khác dùng `dest_table_configuration`.
    `db_display_name` của nguồn là tên database nguồn, của bước trung gian là `ETL Database`.
  - v1 gửi kèm các cờ `is_join`, `is_get_data`, ... và các field `null`; server bỏ hết.
  - Server thêm `active_field_configs` vào Manage Fields.
  - Server không giữ field persist của Send To Email.
- **Preview** (`preview_sync`):
  - Mỗi bảng trung gian là một view trong `preview_etl_<id>`.
  - Field trong Join, Manage Fields, Transform và Pivot trỏ vào database preview (`db_name: preview_etl_<id>`, `tbl_name`
    là bảng của operator cha).
  - Transform (`table_chart_setting`, `options: {}`) và Pivot (`flatten_pivot_table_chart_setting`) chạy được; Pivot ra
    các cột dạng `Offline - total_revenue`.
  - Manage Fields giữ cả các cột không liệt kê trong `fields`.
  - `view_query` với payload thật trả SQL (`CONVERT(...)` của MySQL).
- **Nợ backend trên warehouse MySQL**:
  - SQL không ghi tên database (`from sales`) lỗi `No database selected`, cả khi preview lẫn khi chạy thật. Ghi
    `preview_etl_1.sales` thì preview chạy, và lần chạy thật cũng chạy nhưng đọc từ database preview.
  - Join lỗi `Duplicate column name 'region'` khi hai bảng có cột trùng tên.
  - Cả hai cần kiểm lại trên ClickHouse.
- **Python**: `preview_sync` trả 500 `None.get`; lưu thì được. Theo quyết định ở dưới, v2 không cho tạo Python Query.
- **Send To Email**: preview trả Done, nhưng chưa kiểm có mail đi không (stack local không có SMTP).
- **Save To Database**: chưa kiểm `third_party/*/list` (cần thông tin đăng nhập một database ngoài); để sau MVP như
  đã định.

**v1**

- **Key do v1 lưu**: v1 snake_case hoá mọi key khi gửi đi, cả key là tên bảng.
  - Vị trí trong `extra_data` (`table_position`, `operator_position`, ...) có key `snakeCase(camelCase(tên bảng))`:
    `sales_1_1` lưu thành `sales_11`. Hai tên chỉ khác nhau ở dấu `_` dùng chung một key.
  - `render_options` cũng theo key đó.
  - `map_incremental_config` có key `snakeCase(tên bảng)`, và server trả về không có `class_name`.
  - Vị trí là chuỗi `"20px"`; `stage_position` là số.
- **Hành vi khác của v1**:
  - Tên bảng đích của Save To Data Warehouse bị viết thường (`RegionCount2` → `regioncount2`).
  - "Create new database" tạo database ngay khi bấm Add, trước khi lưu ETL.
  - Bảng đích tự đặt tên `sales_1`, `sales_1_1`, `sales_1_2`, `sales_join_sales_copy`, như `makeDestTableConfig`.

## Quyết định (2026-11-02, đã xác nhận)

- **Phạm vi MVP**: listing (My ETL, Shared, Trash), History, Share, trình sửa với Get Data, Join, Manage Fields, SQL
  Query, Transform, Pivot, Save To Data Warehouse, lịch và incremental. **Sau MVP**: Save To Database (5 loại DB, SSL /
  JKS), Send To Email (cần SMTP trên stack local). **Python Query**: bỏ, vì server local không preview được (DC0);
  ETL v1 có operator Python vẫn mở được, node đó chỉ đọc.
- **Plain value giữ `json` gốc**, như `Job` của Ingestion: `EtlJob` và `EtlOperator` (union theo `class_name`, có kind
  `unsupported`) giữ bản server gửi, hàm ghi merge phần sửa lên `json`. Query setting của Transform / Pivot là raw JSON
  như chart (M2), `table_schema` của nguồn giữ nguyên.
- **Đồ thị phẳng trong trình sửa**: đọc cây `operators` thành `Map<tblName, node>` + danh sách cạnh (`etlGraph.ts`, hàm
  thuần), sửa trên đồ thị phẳng, khi lưu dựng lại cây từ các lá (`leavesFromGraph`). Một reducer cho trình sửa
  (`useReducer` trong context của trang), không sửa thẳng vào cây như v1. Có test round-trip: đọc rồi ghi lại khớp với
  JSON server lưu (trừ field server tự sinh).
- **Canvas bằng React Flow** (`@xyflow/react`, đã có từ M7c, chunk lazy riêng) thay cho canvas tự vẽ của v1. Vị trí giữ
  key của v1 trong `extra_data` (`table_position`, `operator_position`, `saved_table_position`, ... theo tên bảng), để v1
  và v2 đọc được layout của nhau (key `snakeCase(camelCase(tên bảng))`, xem DC0).
- **Tạo ETL lười**: `my-etl/create` hiện canvas trống, chỉ gọi `data_cook/create` khi thêm nguồn đầu tiên (preview cần
  id), rồi thay URL bằng `my-etl/<slug>-<id>`. Không còn ETL rỗng khi chỉ mở rồi bỏ.
- **Preview** là TanStack Query theo `[etlId, tblName, chữ ký của nhánh]`: sửa một operator chỉ làm mới các bảng phía
  sau nó. Dữ liệu bảng đọc từ database preview bằng `TableDataView` của DW6. Lỗi lan xuống các bước sau như v1, câu báo
  lỗi không chứa HTML.
- **Dùng lại**: `core/schedule` + `shared/schedule` (bỏ Minutely), `DatabaseTree` (DW3) để chọn nguồn, `shared/code-editor`
  (DW10) cho SQL Query với autocomplete trên database preview, `ShareModal` với adapter thứ ba (`{ type: 'etl' }`, chỉ
  people, như DW5), listing của Ingestion (`features/ingestion/listing` chuyển lên `shared/listing` vì đây là nơi thứ hai
  dùng), `JobStatusTag` và Force Run / Cancel.
- **Transform và Pivot nhúng ChartBuilder** của Phase 4 với một host mới: nguồn field là bảng của operator cha trong
  database preview, loại chart cố định (Table / Flatten Pivot), không có Settings, kết quả là `setting` + `extra_data`.
  Dựa trên phần tách host của DW11 (ChartBuilder chạy ngoài dashboard, đã xong).
- **Vị trí code**:

  ```
  src/core/data-cook/        EtlJob, EtlOperator (+ etlGraph), EtlHistory, EtlService, EtlShareService, DataCookModule
  src/features/data-cook/    layout/, listing/, history/, editor/ (graph/, preview/, operators/, targets/, save/)
  ```

  Tên `data-cook` (không dùng `data`, bị `.gitignore`).

## Quyết định ở DC1 (2026-11-02)

- **Plain value giữ `json` gốc**, theo DI1 (không dùng entity deneric2):
  - `EtlJob` có `operators` là các lá, `incrementalConfigs` (key như lưu) và `extraData` (JSON thô, đọc qua
    `etlExtraData`).
  - `EtlOperator` là union theo `kind`: `getData`, `join`, `transform` / `pivot` (chung `QuerySettingOperator`,
    `query` là JSON thô), `manageFields`, `sql`, `python`, `sendEmail` và `unsupported`.
  - Field của Join và Manage Fields giữ JSON `table_field` của server.
  - Save To Database (`thirdPartyPersists`) giữ nguyên JSON, chưa sửa được.
- **Ghi lại** (`etlOperatorToJson`): merge lên `json` và ghi nguồn ở `dest_table_config`. Bỏ ba thứ v1 không gửi hoặc
  server không giữ: `active_field_configs`, field persist của email, `left_field_name` / `right_field_name`. Test
  round-trip trên cả ETL 1 và ETL 2 khớp với JSON server lưu.
- **Bốn service** thay cho một `DataCookRepository`, bind trong `DataCookModule` với `ApiClient`:
  - `EtlService`: listing, get, create, update, trash, restore, xoá hẳn, force run, cancel.
  - `EtlPreviewService`: database preview, `preview_sync`, `view_query`.
  - `EtlHistoryService`.
  - `EtlShareService`: cùng dạng với `DatabaseShareService`, nên DC5 làm adapter thứ ba cho `ShareModal`.
  - Sort field là union theo whitelist DC0.
- **`etlGraph`** (hàm thuần):
  - `etlGraphFromLeaves`: map tên bảng → operator, cha trước con, bản đầu tiên thắng như `EtlOperator.unique` của v1.
  - `leafNames` và `leavesFromGraph`: dựng lại cây; một operator sửa trên đồ thị vào mọi nhánh đọc nó; gặp vòng thì
    dừng.
  - `baseTableName` và `uniqueTableName`: port đúng cách đặt tên của `makeDestTableConfig`. Test trên ETL 2 ra đúng tên
    v1 sẽ đặt tiếp (`sales_1_3`).
- **`etlExtraData`**: `positionKey` = `snakeCase(camelCase(tên))` để đọc và ghi đúng key của v1. Vị trí đọc ra số
  (`{ x, y }`), ghi lại `"Npx"`. `render_options` cũng theo key đó. Hai tên đụng key thì dùng chung vị trí như v1.
- **Incremental**: key `incrementalKey` = `snakeCase(tên)` như v1. Entry không có `class_name` là incremental; entry
  `full` bị bỏ khi đọc (v1 bỏ khi lưu). Chưa rõ server khớp key với tên bảng thế nào khi tên có chữ hoa hoặc số; giữ
  cách của v1 để không làm hỏng ETL đã có.
- **`hasNextExecution`**:
  - Không có lịch, hoặc `next_execute_time` ≤ 0 hay ≥ `MAX_SAFE_INTEGER` → không có lần chạy tới.
  - Run once → có lần chạy tới chỉ khi status là `Initialized` hoặc `Queued`, như v1.
  - `canCancelEtl`: `Queued`, `Running`, `Syncing`.
- **Status lạ** đọc thành `Unknown`.

## Quyết định ở DC2 (2026-11-02)

- **Không có feature flag**: v1 không tắt Data Cook. Header đã có link từ trước.
- **Routes** là con của `/data-warehouse` (`dataCookRoute` trong `app/router.tsx`), layout lazy load như Ingestion:
  - `/data-warehouse/data-cook` → `my-etl`.
  - `my-etl`, `shared`, `trash` dùng chung `EtlListingPage`, chọn section theo path như `ListEtlJob` của v1.
  - `history`.
  - `my-etl/create` và `my-etl/:name` (`<slug>-<id>`, `etlEditorPath` / `etlIdFromParam`) dùng chung `EtlEditorPage`.
  - Path lạ ra Not found.
  - Test cũ "Data Cook ra Not found" của Data Warehouse đã bỏ.
- **Layout** (`features/data-cook/layout`):
  - Sidebar giống Ingestion, có nút "New ETL" (mở `my-etl/create`) và bốn mục với tên, icon của v1.
  - Trình sửa nằm trong layout và giữ My ETL được chọn, như v1.
- **Trang** hiện chỉ có header; DC3, DC4, DC6a (đã xong) điền nội dung. Trang tạo hiện "My ETL › Untitled ETL" như v1.
  Hai route của trình sửa gộp làm một ở DC6a.
- Đã kiểm bằng Playwright trên `pnpm dev` (1440px và 375px): redirect, chọn mục, nút New ETL, không lỗi console.

## Quyết định ở DC3 / DC4 (2026-11-02)

- **Dùng chung với Ingestion**: `features/ingestion/listing` chuyển lên `shared/listing` (nơi thứ hai dùng), kèm
  `formatDuration` (từ Job History) và `StatusTag` + `statusIcon` (icon status của v1). `JobStatusTag` và
  `EtlStatusTag` chỉ còn map status → icon. Không dùng `JobsRefreshButton` (auto refresh): v1 Data Cook chỉ có nút Refresh.
- **Listing** (`features/data-cook/listing`, một `EtlListing` cho ba section, remount theo section như v1):
  - Phân trang trên server như các listing của Ingestion (v1 tải thêm khi cuộn).
  - Sort mặc định `created_time` DESC (v1 không gửi sort, server trả cũ nhất trước). Sort được: Name, Created Time như v1,
    thêm Last Run, Next Run. Owner không sort (`owner_id` không có nghĩa với người dùng).
  - Last Run là status hiện tại của ETL và giờ chạy cuối (`--` khi chưa chạy), như Last Sync của Ingestion. Next Run `--`
    khi không có lần chạy tới, và luôn `--` trong Trash.
  - **Tự reload 5s khi có ETL đang chạy hoặc tới giờ chạy** (cancel được, hoặc `next_execute_time` ≤ bây giờ), dừng khi
    hết; v1 chỉ reload khi bấm Refresh. Đã kiểm trên docker: sau Force Run, status đi Initialized → Queued → Error rồi thôi
    poll.
  - **Force Run** mở dialog chọn ngày như `ForceRunSettingModal` của v1 (mặc định hôm nay, ngày đã qua bị khoá). Đã kiểm:
    `at_time` thành `next_execute_time`, tức ETL chạy vào lúc đó. Hôm nay → chạy ngay (`now`), ngày sau → đầu ngày đó.
  - Menu Edit / Share / Delete. Share bị khoá tới DC5 (giờ đã mở). Delete đưa vào trash,
    Trash có Restore và Delete forever; cả ba hỏi xác nhận (antd, không HTML). Dòng trong Trash không mở trình sửa.
  - Rỗng: My ETL mời tạo ETL đầu tiên (link `my-etl/create`); search không ra gì nói rõ từ khoá.
- **History** (`features/data-cook/history`):
  - Sort mặc định `id` DESC như v1. Sort được History Id, Last Run (`updated_time`), Total Run Time, Status; ETL Name và
    Message không.
  - Có ô search (v1 có nhưng ẩn); server tìm theo tên ETL.
  - ETL Name là link tới trình sửa (v1 chỉ là chữ). `--` khi server không gửi `etl_info`.
  - Message hiện dòng cuối của log (cách run kết thúc, v1 hiện dòng đầu luôn là `execute ELT <tên>`) và "View log" mở
    toàn bộ log trong dialog.
  - Total Run Time theo millis (`formatDuration`): run trên docker chỉ vài chục ms.
- `renderAppAt` bind fake `EtlService` / `EtlHistoryService` (`features/data-cook/testing.ts`); test trang thay bằng
  module riêng. Đã kiểm bằng Playwright trên `pnpm dev` (1440px và 375px): listing, sort, Force Run, polling, history,
  View log, Delete → Trash → Restore, không lỗi console, không cuộn ngang ở 375px.

## Quyết định ở DC5 (2026-11-02)

- **Adapter thứ ba của `ShareModal`**: `ShareTarget` / `PeopleResource` thêm `{ type: 'etl', id }` (id là số; quyền
  `0:etl:view:<id>` đọc đúng bằng `shareLevelOf`). `sharePeopleApi` chọn endpoint theo loại: directory qua
  `share/directory/{id}`, database và ETL qua endpoint riêng của chúng (`EtlShareService` của DC1).
- **Chỉ people**, như v1 (`DataCookShareHandler`): không có Get link, không có password; mức quyền như database (không
  có View & Download). `etlShare(etl)` dựng request từ dòng của listing.
- Menu Share của listing (My ETL, Share With Me) mở dialog; không còn khoá. Đã kiểm bằng Playwright: dialog đọc
  `data_cook/1/share/list`, không có link.

## Quyết định ở DC6a (2026-11-02)

- **Dùng chung**: `database-tree` và `useUnsavedGuard` (+ `leavesPage`) chuyển từ `features/data-warehouse` lên
  `shared/` (Data Cook là nơi thứ hai dùng). Key danh sách database của Data Warehouse thành `schemaKeys.entries`, để cây
  (giờ ở `shared`) làm mới nó khi tạo database. `useUnsavedGuard` thêm tham số `stays`: những URL vẫn là trang đang sửa
  thì không hỏi.
- **Một route** `my-etl/:name` cho cả `create` (thay hai route của DC2), để trình sửa không remount khi ETL mới có id và
  URL. `useEditorSession` (hàm thuần `editorSession.utils`) giữ session khi URL chuyển sang đúng ETL vừa tạo, mở session
  mới (remount) khi sang ETL khác hoặc bấm New ETL. `my-etl/<không có id>` là Not found.
- **Tạo lười**: trang tạo vẽ canvas trống "Untitled ETL"; nguồn đầu tiên gọi `data_cook/create` (cùng lúc lấy JSON bảng),
  rồi URL thay bằng `my-etl/untitled-etl-<id>`, phần sửa vẫn chưa lưu. Đổi tên một ETL chưa có id rồi Save thì Save tạo
  trước.
- **Nguồn**: `EtlService.getSourceTable` lấy JSON bảng từ `GET databases/{db}` nguyên vẹn làm `table_schema` (v1 gửi lại
  `TableSchema` nó đọc). Tên bảng đích như v1 (`tbl_name` của bảng, không phải display name, thêm `_1`, `_2` nếu trùng);
  `db_display_name` là display name của database. Chọn lại một bảng đã là nguồn: báo "… is already a source of this ETL"
  (v1 bỏ qua im lặng). Thêm nguồn bằng `DatabaseTree` trong modal "Add Source".
- **Draft và reducer** (`editor/draft`): `EtlDraft` = ETL server trả + tên + `EtlGraph` + `extraData`. `etlEditorReducer`
  (created, saved, discard, rename, addSource, remove, renameTable, move). "Có thay đổi" = so `etlJobToJson` của draft với
  bản gốc, nên **kéo box cũng tính** (v1 không tính, nên vị trí kéo bị mất khi rời trang mà không lưu).
- **Layout** (`etlLayout.utils`): công thức của v1 (`MIN_TOP` 20, 380 / 200 / 160, box lệch +200 / +80) cho bảng và
  operator chưa có vị trí, ghi vào `extra_data` lúc mở. Sửa bug v1 (operator mới tự tính chính nó là anh em ở top 0, nên
  con đầu tiên của một nguồn ở top 20 nằm ở 160). Các box của một bảng xếp chồng (cách 70) thay vì đè nhau.
  `stage_position` giữ nguyên như đã lưu (v1 tự đọc sai nó); mở ETL thì fit vào khung, tối đa 100%.
- **Canvas** (`editor/canvas`): bảng (database trên, bảng dưới, nút "+" tròn mở menu), hình thoi của operator (bấm mở
  menu; join ghi kiểu join như v1), box Save To Data Warehouse / Save To Database / email. Cạnh `smoothstep` có mũi tên.
  React Flow giữ vị trí trong lúc kéo; draft nhận vị trí khi thả (một lần sửa). Control bar dùng lại của Relationship:
  zoom, Fit content, Full screen, **Discard Changes** (hỏi, như Relationship) và Save. Bỏ "Clear All" của v1 (xoá hết
  không hỏi).
- **Menu**: bảng có Join Table, Manage Fields, SQL Query, Pivot Table, Transform Table, Save To Data Warehouse (khoá,
  "Not supported yet", tới DC7 – DC9), Edit Display Name (chỉ bảng của operator, như v1), Remove. Bỏ Python Query, Save
  To Database, Send To Email (sau MVP). Hình thoi và box: Edit (khoá), Remove.
- **Remove** xoá bảng và mọi bước phía sau (như v1); **hỏi khi có bước phía sau** ("Remove 'x' and the 2 steps after
  it?"), v1 không hỏi. Input còn lại của một join bị xoá thành lá. Xoá box chỉ bỏ cấu hình đích. Vị trí của những gì bị
  xoá cũng bỏ.
- **Đổi tên** ETL (bút chì ở header) và bảng (Edit Display Name) dùng chung `EtlNameModal`, luật của v1 (bắt buộc, tối đa
  250, không có `\/?*"><:|@(){}` và backtick), và **nằm trong draft tới khi Save** (v1 đổi tên ETL là lưu cả ETL ngay).
- **Save** (DC6a, chưa có dialog của DC9): `PUT data_cook/{id}` với draft, giữ lịch và incremental như server trả; báo
  "ETL saved", **ở lại trang** (v1 quay về My ETL), URL theo tên mới. Rời trang khi có thay đổi: hỏi với câu của v1.
- Trang ETL không tồn tại hoặc trong trash (404): "ETL not found" và nút về My ETL.
- **Đã kiểm bằng Playwright** trên `pnpm dev` với docker: mở ETL 2 (vị trí khớp v1), menu, tạo lười (một `create`, URL
  đổi, không remount), chọn lại cùng bảng, kéo + đổi tên + Save (server giữ nguồn, vị trí theo key v1, lịch `none`),
  guard, Remove + Discard, 375px không cuộn ngang, không lỗi console. **v1 mở được ETL v2 tạo** (đúng vị trí, preview
  được nguồn). Để lại ETL 11 "DC6a probe" (nguồn `di0_ingest.sales`) cho DC6b.

## Các bước

| Bước | Phạm vi | Trạng thái |
|---|---|---|
| DC0 | **Spike và payload thật.** Tạo bằng v1 trên docker local một ETL có đủ Join, Manage Fields (cả expression field), Transform, Pivot, SQL, Save To Data Warehouse, incremental và lịch; lưu JSON server trả làm fixture (`core/data-cook/etl.fixture.json`). Kiểm: key trong `extra_data` và `map_incremental_config`, payload `view_query`, Python operator, `third_party/*/list` với `rocket-bi-mysql`, Send To Email có SMTP không, trash / restore / xoá hẳn, `kill`, sort được theo cột nào (whitelist như DI0), share người dùng | Xong (xem DC0) |
| DC1 | **Core.** `EtlJob`, `EtlOperator` (8 loại + `unsupported`, giữ `json`), `etlGraph` (cây ↔ đồ thị phẳng, đặt tên bảng đích không trùng như `makeDestTableConfig` của v1), `EtlHistory`, `EtlService`, `EtlShareService`, `DataCookModule`. Test round-trip với fixture DC0 | Xong (xem DC1) |
| DC2 | **Khung.** Routes `/data-warehouse/data-cook/*` ở path của v1 (`my-etl`, `shared`, `history`, `trash`, `my-etl/create`, `my-etl/:name`), layout có sidebar, page lazy load | Xong (xem DC2) |
| DC3 | **Listing.** My ETL, Shared, Trash: phân trang, search, sort theo whitelist, refresh. Cột Name, Owner, Created Time, Last Run (status), Next Run, Action (Force Run hoặc Cancel, menu Edit / Share / Delete). Trash: Restore, Delete forever. Click dòng mở trình sửa | Xong (xem DC3 / DC4) |
| DC4 | **ETL History.** Cột History Id, ETL Name (link tới ETL), Last Run, Total Run Time, Status, Message (log nhiều dòng xem được đầy đủ) | Xong (xem DC3 / DC4) |
| DC5 | **Share ETL.** Adapter `etl` cho `ShareModal` trên `data_cook/{id}/share/*`, chỉ people | Xong (xem DC5) |
| DC6a | **Trình sửa: khung.** Load / tạo lười, reducer trên đồ thị phẳng, canvas React Flow (nguồn, operator, đích, vị trí từ `extra_data`), thêm nguồn từ `DatabaseTree`, context menu, xoá / đổi tên operator, đổi tên ETL, Save (giữ lịch hiện có), hỏi khi rời trang có thay đổi | Xong (xem DC6a) |
| DC6b | **Trình sửa: preview.** `preview_sync` theo nhánh, trạng thái loading / lỗi trên node, lỗi lan xuống, panel dữ liệu (`TableDataView` trên database preview), Retry, force refresh | Chưa làm |
| DC7 | **Operator không cần ChartBuilder.** SQL Query (`shared/code-editor`, autocomplete bảng của database preview), Join (chọn bảng thứ hai, kiểu join, nhiều điều kiện), Manage Fields (đổi tên, ẩn, đổi kiểu, thêm expression field, xem SQL qua `view_query`) | Chưa làm |
| DC8 | **Transform và Pivot** bằng ChartBuilder nhúng (host mới, dựa trên phần tách host của DW11) | Chưa làm |
| DC9 | **Đích và lưu.** Save To Data Warehouse (database / bảng có sẵn hoặc mới, Update / Append), dialog Save (tên, `ScheduleFields` không Minutely, incremental theo bảng nguồn) | Chưa làm |
| Sau MVP | Save To Database (5 loại, SSL / JKS), Send To Email, Python Query (nếu server chạy được) | Chưa làm |

Thứ tự: DC0 → DC1 → DC2, rồi DC3, DC4, DC5 song song (thư mục riêng); DC6a → DC6b → DC7 và DC9 song song; DC8 (DW11
đã xong). Mỗi bước kiểm bằng Playwright trên `pnpm dev` với backend docker, so với v1 cùng ETL.
