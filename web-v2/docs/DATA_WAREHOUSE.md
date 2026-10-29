# Data Warehouse: databases, schema, query editor và relationship

Tài liệu sống của việc migrate Data Warehouse (Phase 5 trong [`MIGRATION.md`](MIGRATION.md)). Cập nhật cột **Trạng
thái** khi một bước xong. Data Cook (`/data-warehouse/data-cook`) nằm chung menu nhưng là Phase 7, không thuộc tài liệu
này.

## v1 hoạt động thế nào

- **Quy mô**: `screens/data-management` khoảng 10.5k dòng, cộng phần dùng chung: `DatabaseSchemaStore`,
  `di-core/schema`, `di-core/data-relationship`, Monaco formula (`shared/fomula`, `FormulaCompletionInput`) và relationship
  editor của dashboard (`dashboard-detail/components/relationship`). Nặng nhất: `QueryComponent.ts` (1005 dòng),
  `QueryEditor.ts` (791), `ManageRLSPolicy.vue` (747), `DataSchema.ctrl.ts` (731), `FieldManagement.vue` (657),
  `DatabaseListing.vue` (566), `DatabaseTreeView.ts` (483).
- **Không bị tắt bằng feature flag** (khác Ingestion). Header v2 đã có menu Data Warehouse trỏ tới các path của v1
  (`app/layout/header/header.utils.ts`), hiện đang ra Not found.
- **Routes** (`src/router/Router.ts:159-212`):
  - `/data-management/*` → `/data-warehouse` (redirect đường cũ).
  - `/data-warehouse` → `/data-warehouse/databases` → `/data-warehouse/databases/all` | `/trash` (sidebar All Database /
    Trash, cùng component `DatabaseListing`).
  - `/data-warehouse/schema?database&table`, `/data-warehouse/query-editor?adhoc|mode|database|table|tableDisplayName|tableType|token`,
    `/data-warehouse/relationship`.
- **Layout chung** (`DataManagement.vue`): header có icon + tên (Schema, Query Analysis, Relationship) và breadcrumb.
  Ba màn Schema, Query Editor, Relationship đều là split view: cây database bên trái (`DatabaseTreeView`), nội dung bên
  phải. State của cây đi qua `Provide/Inject` (`databaseSchemas`, `findSchema`, `loadShortDatabaseInfos`,
  `reloadShortDatabaseInfos`) dựa trên store toàn cục `DatabaseSchemaModule`.
- **Quyền**: không có kiểm tra quyền nào ở client, chỉ có kiểm tra đăng nhập. Server kiểm `database:*` (permission group
  ở Admin). Riêng Query Editor khi mở analysis đã lưu thì kiểm quyền dashboard như M5a (owner, `action_permitted`).

Code v1 cần đọc: `screens/data-management` (`views/`, `components/`, `store/`), `store/modules/data-builder/DatabaseSchemaStore.ts`,
`di-core/schema` (`SchemaRepository`, `RlsRepository`, `ExpressionParser`), `di-core/data-relationship`,
`screens/dashboard-detail/components/relationship`, `shared/components/formula-completion-input`, `shared/fomula`.

### Databases (All, Trash)

- Bảng: Name (icon + `display_name`), Owner (avatar), Created Time (`MMM DD, YYYY hh:mm A`, ẩn trên mobile), Action.
  Không sort phía server: v1 tải một lần `from=0,size=1000`, sort theo `display_name` và search substring ở client.
- Click dòng → `/data-warehouse/schema?database=<name>`. Trạng thái rỗng: "Your database is empty" / "Your trash is empty".
- Action: All có Share và Delete; Trash có Recover và Delete forever.

| Action | API |
|---|---|
| List | `GET databases/my_data?from&size`, `GET databases/trash?from&size` → `{ total, data: [{ database: { name, organization_id, display_name, created_time, updated_time }, owner }] }` |
| Delete (All) | `DELETE databases/{db}`: xoá hẳn, dù code gọi là "MoveToTrash" |
| Recover | `PUT databases/{db}/restore` |
| Delete forever | `DELETE databases/{db}` |
| Move to trash | `PUT databases/{db}/remove`: v1 ghi "unsupported by backend" và không dùng, nhưng `SchemaController` có route này |
| Create database (nút + của cây) | `POST databases { name, display_name }`, `name` là snake_case bỏ dấu của display name |
| Share | `GET databases/{db}/share/list`, `POST databases/{db}/share`, `PUT …/share/update`, `DELETE …/share/revoke` (xem dưới) |

- **Share database** không dùng `share/{type}/{id}` như dashboard mà có endpoint riêng (`SchemaShareController`):
  - `share/list` → `{ owner, total_user_sharing, users_sharing: [{ id, user, permissions, created_at, … }] }`.
  - Apply gửi song song ba request: `share` `{ resource_type: "database", resource_id, user_actions: { <username>: [actions] } }`,
    `share/update` `{ …, share_id_actions: { <shareId>: [actions] } }`, `share/revoke` `{ …, usernames }`; mỗi cái trả
    `{ username: bool }`.
  - Không có Get link, không có password. Mức quyền giống dashboard (Edit, View & Download, View, Remove access), user
    thêm mới mặc định `{org}:database:view:{db}`.
- **Không có rename** database / table / column: `RenameActions`, `DiRenameModal`, `UpdateDatabaseSchema` đều là dead code.

### Cây database (dùng chung ba màn)

- Tải: `GET databases` (short info, không có bảng); mở một database thì `GET databases/{db}` (có spinner riêng từng
  database). Query Editor lúc mount lại gọi `POST databases/multi_gets { db_names }` theo lô 10 cho **mọi** database,
  để có autocomplete.
- Search debounce 300ms theo tên database hoặc tên / display name bảng; database khớp tự mở.
- Nút +: tạo database. Nút refresh.
- Theo màn:
  - Schema: menu "⋯" của bảng (Add calculated field, Add measure, Delete table), click chuột phải cột materialized
    (edit / delete).
  - Query Editor: click bảng hoặc cột chèn `` `db`.`tbl` `` vào editor tại con trỏ.
  - Relationship: kéo bảng (HTML5 drag, `type=drop_table`) vào canvas.

### Schema (`/data-warehouse/schema`)

- **Chọn**: đọc `?database&table`, không có thì lấy database đầu tiên; chọn database → view database, chọn bảng → tab
  Table Schema. Ghi lại URL bằng `router.replace`.
- **View database** (`TableManagement`): danh sách bảng, Create table, Delete table, Delete database, Share.
- **Bảng** có 5 tab: Table Schema, Table Data, Measure Schema, Calculated Field (hai tab này ẩn trên mobile), RLS. Có ô
  search cột ở ba tab schema. Bảng đang `Processing` thì poll `GET databases/{db}/tables/{tbl}` mỗi 30s.
- **Action menu**: Query table → Query Editor `?database&table`; Update schema by query (chỉ bảng `view`,
  `materialized`) → Query Editor `mode=update`; Delete table.

| Action | API |
|---|---|
| Create table | Modal tên (bắt buộc, ≤250 ký tự, không có `\/?*"<>:|`, không trùng) → mode tạo bảng với một cột string → `POST databases/{db}/tables { db_name, tbl_name, columns, primary_keys: [], order_bys: [], display_name }` |
| Edit schema | Nút Edit (ẩn với bảng `view`). Cột có sẵn sửa được nullable, type, description (≤255), default value; display name bị khoá, không xoá cột. Thêm cột mới. Có đổi type thì hỏi xác nhận. `PUT databases/{db}/tables/{tbl} { table_schema }` |
| Delete table | `DELETE databases/{db}/tables/{tbl}` (v1 gửi kèm `admin_secret_key`, v2 CB8 xoá được không cần) |
| Delete database | `DELETE databases/{db}` |
| Calculated field | Tab liệt kê `calculated_columns`; create / edit / delete qua `calc_column`, kiểm kiểu bằng `expression` |
| Measure | Tab liệt kê `expression_columns`; qua `expr_column`, kiểm kiểu bằng `aggregate_expression` |
| RLS | `POST policies/list { db_name, tbl_name }` → `{ data, total }`; `PUT policies { db_name, tbl_name, policies }` thay **toàn bộ** policy của bảng |

- **Table Data** (preview): `group_table_chart_setting` với một `Select` mỗi cột vật lý, `POST chart/query` trang 20
  dòng, sort theo header. Đi qua store của dashboard với id giả `-2`, nên **filter và main date của dashboard mở gần nhất
  bị gửi kèm** (`FilterStoreUtils.buildQueryRequest`).
- **RLS policy**: `{ policy_id, name, user_ids, user_attribute: { key, values, operator }, db_name, tbl_name, conditions }`.
  - Operator: Equal, NotEqual (một giá trị), Contain, NotContain (tags tách bằng Enter `,` `;`), IsNull, IsNotNull. Key
    snake_case hoá khi gõ.
  - Filter: View All `[{ class_name: "always_true" }]`, View Nothing `always_false`, Custom mở ChartBuilder ở chế độ
    filter (`RLSFilterBuilderConfig`), lấy `setting.filters` làm `conditions`.
  - Thêm policy `policy_id: -1`; xoá chỉ ở local; Save gửi cả danh sách; Cancel trả lại bản clone.
- **Expression**: calculated field là cột thường có `default_expression: { default_type: "MATERIALIZED", expr }`, `name =
  snakeCase(displayName)`. v1 cho gõ `[Display Name]` rồi đổi sang tên cột (`ExpressionParser`); measure giữ SQL nguyên
  văn. v2 đã làm phần này ở CB8 (`SchemaEditService`, `FormulaFieldDialog`).
- **AI description** của cột gọi thẳng OpenAI từ trình duyệt với key: không port (chatbot đã hoãn).

### Query Editor ("Query Analysis", `/data-warehouse/query-editor`)

- **Ba mode theo URL**: `?mode=update` → EditTable (sửa query của view / materialized, tự chạy); `?adhoc=<dashboardId>`
  → analysis đã lưu; không có → query mới (có `?database&table` thì điền `select * from db.tbl`, không tự chạy).
- **Analysis đã lưu là một dashboard** `directory_type: "queries"` (v2 đã link từ directory:
  `directory.utils.ts`). Widget 0 là bảng kết quả: `RawQuerySetting` + `options.raw_query`, `options.query_parameter`.
  Các widget sau là chart tạo bằng ChartBuilder trên bảng adhoc (`sql_views[0]` giữ query). Mở analysis: giống trang
  dashboard M1 + M5a (dashboard, directory, quyền, password, breadcrumb `directories/{id}/parents`).
- **Run** (nút hoặc Ctrl/Cmd+Enter): chạy cả đoạn hoặc phần đang bôi đen. Request `POST chart/query`:
  `{ query_setting: { class_name: "raw_query_setting", sql, sql_views, options: { class_name: "table_chart_setting", raw_query, query_parameter }, parameters }, from: 0, size: 20, parameters: { <name>: "'v'" } }`.
  Phân trang bằng from / size, không sort. SQL có `limit N` (regex chỉ bắt chữ thường) thì tắt phân trang và gửi
  `from=-1,size=-1`.
- **Parameters**: quét `{{ name }}` 1s sau mỗi lần gõ, tự thêm (kiểu text) / bỏ. Kiểu text, number, date, list. Server thay
  giá trị (`parameters` của request; text / date / list bọc `'…'` không escape, number để nguyên). Đổi giá trị thì chạy
  lại; menu Edit / Set Value as Default / Delete.
- **Tab chart**: nút + gọi `POST databases/adhoc/tables { query }` lấy schema rồi mở ChartBuilder; analysis đã lưu thì
  `widgets/create`, `widgets/{id}/edit`, `DELETE widgets/{id}`. Tab 0 không sửa / xoá được.
- **Save**: query mới → chọn folder → tên → `POST dashboards/create { name, parent_directory_id, directory_type: "queries", widgets, setting }`.
  Analysis → sửa widget 0, kèm **auto-save mỗi 5s** nếu text đổi. Actions → "Create Analysis" là Save As.
- **Actions khác**: Create Table (`POST databases/{db}/tables/from_query { db_name, display_name, tbl_name, query, is_override: false, table_type: view | materialized }`),
  Update Table (mode update, `is_override: true`, Ctrl+S), Download CSV / Excel (`query/csv|xlsx`), Add Chart To
  Dashboard (chọn dashboard, tạo một input filter mỗi parameter, chart với `parameter_widget_ids`, gói trong tab widget).
- **Autocomplete**: danh sách hàm theo connector (`GET connection`), bảng / cột từ toàn bộ schema đã tải; gợi ý sau `.`.
- **AI** `//@ai <prompt>` gọi chatbot: không port (chatbot đã hoãn).
- Không có rename, share, format SQL trong editor (rename và share làm ở directory).

### Relationship (`/data-warehouse/relationship`)

- Màn bọc mỏng quanh relationship editor của dashboard với `GlobalRelationshipHandler`, luôn ở chế độ sửa.
- Thêm bảng bằng cách kéo từ cây vào canvas; bảng đã có thì không thêm. Menu bảng có Remove (chỉ global), xoá bảng thì
  xoá luôn các join của nó.
- `GET` / `POST relationships/global`, cùng format với `relationships/{dashboard_id}` (v2 đã có `getGlobalRelationship`,
  `saveGlobalRelationship`). Save dựng `views` từ các bảng trên canvas. Có Discard (hỏi trước) và hỏi khi rời trang.
- `data-relationship/components/TableItem.*` là dead code (bản LeaderLine cũ).

### Anti-pattern và bug của v1 (không mang sang)

- **Databases**: `loadListTrashDatabase` lưu vào key của All (Trash luôn rỗng và đè All); Delete ở All xoá hẳn nên Trash
  gần như không bao giờ có gì; xoá database khỏi store trước khi request xong, không rollback; Recover reset cây.
- **Share database**: đóng modal reset nhầm store (`ShareModule` thay vì `ShareDatabaseModule`), thay đổi dở rò sang lần
  share sau; đổi quyền rồi bỏ user gửi cả update lẫn revoke; key của map trong response bị camelCase.
- **Cây**: `toggleTable` đọc thuộc tính của `undefined`; selector `[data-database=…]` không quote; database có 0 bảng bị
  tải lại mỗi lần (`isShortDatabaseInfo` = "không có bảng"); `float64` không có class `Column` nên cột bị rơi; tên
  database nối vào URL không encode (thay khoảng trắng bằng `+`).
- **Schema**: Save chuyển về view mode trước khi PUT nên lỗi là mất hết chỉnh sửa; cột mới khớp theo tên nên nhiều cột
  chưa đặt tên thì sửa nhầm dòng; `TableSchema.fromObject` bỏ `primary_keys` / `order_bys` nên PUT gửi rỗng; preview dính
  filter của dashboard qua id `-2`; interval poll không bao giờ được clear; RLS xoá được ở view mode, NotEqual /
  NotContain không validate; confirm xoá calculated field ghi "measure field"; `@ts-ignore` gọi method private của cây.
- **Query Editor**: key của `setting.parameters` bị snake / camel hoá (`myParam` lưu thành `my_param`, không khớp
  `{{myParam}}`); auto-save và Save luôn ghi widget 0 dù đang ở tab khác; Create Table ghi đè text editor bằng SQL đã thay
  parameter; Update Table không thay parameter còn Create thì có; giá trị parameter không escape (vỡ SQL / injection);
  `limit` viết hoa không nhận ra; Save As để lại cảnh báo "chưa lưu" giả (`fixCommentInSql` thêm `" \n"`); multi-cursor
  lấy cột của selection đầu; gợi ý bảng bị nhân đôi giữa các database; Add Chart To Dashboard ghi `parameter_widget_ids`
  vào chart của analysis.
- **Relationship**: vị trí của bảng đã xoá vẫn nằm trong `table_positions`; key vị trí `camelCase(db + tbl)` có thể trùng
  (`ab`+`c` và `a`+`bc`); thả bảng không tính pan / zoom của canvas; kéo bảng về chỗ cũ vẫn tính là thay đổi.
- **Chung**: secret cứng (`DI-SERVICE-KEY: 123`, `admin_secret_key: 12345678`), OpenAI key trong trình duyệt, store nuốt
  lỗi, `cloneDeep` / `isEqual` để dirty check.

## v2 đã có gì dùng lại được

| Cần cho | Đã có ở v2 | Việc phải làm |
|---|---|---|
| Schema đọc | `core/schema/SchemaService` (`GET databases`, `databases/{db}`, `detectTableSchema` = `databases/adhoc/tables`), `fieldTypes` | Thêm field `organization_id`, `created_time`, `table_status`, `primary_keys`, `order_bys`, `is_nullable`, `default_value`, ... cho màn sửa schema; giữ `json` gốc của cột để PUT không mất field |
| Calculated / measure, xoá bảng, update query | `core/schema/SchemaEditService`, `features/chart-builder/field-actions` (`FormulaFieldDialog`, Monaco, danh mục hàm theo connector, `UpdateTableQueryDialog`) | Dùng lại dialog; tab Measure / Calculated chỉ là danh sách + mở dialog |
| Monaco | `features/chart-builder/field-actions/editor` (`CodeEditor`, `LazyCodeEditor`, `monaco.ts`) | Chuyển lên `shared/code-editor/` (feature thứ hai cần), thêm ngôn ngữ SQL và completion provider cho bảng / cột |
| Chạy query, bảng kết quả | `core/query/QueryService` (`chart/query`, `query/csv|xlsx`), `QueryRequest` biết `raw_query_setting`, renderer flat table có phân trang server (M2), `tableSort` (M4a) | Hàm thuần dựng request cho preview và raw query; không đi qua controls của dashboard |
| Chart trong Query Editor | ChartBuilder (`features/chart-builder`), `adhocTable` trong `useBuilderSession` | Tách `ChartBuilderHost` khỏi giả định "dashboard đang mở ở edit mode": host cho analysis (lưu bằng `widgets/*`) và cho query chưa lưu (giữ widget trong state) |
| RLS Custom filter | Zone Filter của ChartBuilder (CB4, nhóm AND/OR, trình sửa condition) | Tách trình sửa filter của zone Filter để dùng được ngoài modal builder |
| Analysis đã lưu | `core/dashboard` (`DashboardService.get`, `widgets/*`), `features/dashboard/access` (quyền, password), `features/directory/dialogs` (`useFolderPicker`, `NameModal`) | Dùng lại nguyên |
| Share database | `features/share/ShareModal`, `core/share` | Endpoint khác (`databases/{db}/share/*`) và không có link / password: cho `ShareModal` nhận một adapter |
| Relationship | `core/relationship` (đã có global), `features/dashboard/relationship` (React Flow) | Tách phần chung lên `shared/relationship/`, thêm thêm / xoá bảng, nguồn và hàm lưu truyền vào |
| Listing | `core/listing`, `features/ingestion/listing` (`useListingState`, debounce search, `listingPagination`) | Listing database phân trang ở client: chỉ dùng lại phần UI |

## Quyết định (2026-10-30)

- **Phạm vi**: Databases, Schema (kể cả RLS), Query Editor, Relationship. Không port: AI (`//@ai`, AI description), rename
  (v1 không có, server cũng không có endpoint rename database), AI prompt từ cây.
- **Delete ở All**: v1 xoá hẳn. Dự định chuyển vào Trash bằng `PUT databases/{db}/remove` nếu server làm được, không thì
  giữ như v1 và ẩn Trash. **DW0: server không có trash**, nên Delete xoá hẳn (hỏi xác nhận) và không có trang Trash
  (`/data-warehouse/databases/trash` chuyển về `all`).
- **Auto-save của Query Editor**: v1 lưu mỗi 5s, luôn vào widget 0. v2 **bỏ auto-save**, Save / Ctrl+S
  tường minh, nút hiện `Save*` khi có thay đổi, hỏi khi rời trang (`useBlocker` như M6). Lý do: auto-save ghi đè analysis
  dùng chung khi người khác đang xem, và v1 lưu sai widget.
- **Add Chart To Dashboard**: tính năng riêng, khá nặng (tạo input filter, tab widget, `parameter_widget_ids`). Để sau
  cùng (DW12), có thể bỏ nếu không ai dùng.
- **Kiểm quyền ở client**: v1 không kiểm. v2 giữ như v1 (server quyết, hiện message lỗi của server), riêng
  analysis đã lưu thì kiểm quyền dashboard như M5a.
- **Một cây database dùng chung** (`features/data-warehouse/database-tree`): dữ liệu bằng TanStack Query (danh sách short
  info, mỗi database một query khi mở), không store toàn cục; mỗi màn truyền vào những gì nó cần (`onSelectTable`,
  `tableActions`, `columnActions`, `draggableTables`, `selected`). Thay Provide/Inject của v1.
- **Không tải toàn bộ schema lúc mở Query Editor**: autocomplete dùng các database đã có trong cache; gõ `db.` thì tải
  database đó (`GET databases/{db}`) rồi gợi ý. Bỏ `multi_gets` theo lô.
- **Preview dữ liệu bảng** (Table Data) và **kết quả query**: request dựng bằng hàm thuần (`tablePreviewQuery(table, page, sort)`,
  `rawQueryRequest(sql, params, page)`), không đi qua controls của dashboard (sửa bug filter rò qua id `-2`). Preview cho
  sort theo một cột như M4a.
- **Parameters**: map `parameters` gửi lên luôn dựng từ `options.query_parameter` (tên đúng như gõ), không đọc
  `setting.parameters` đã lưu (key bị v1 đổi, DW0 đã xác nhận). Giá trị text escape `'` thành `''`, rồi escape `\` và `$`
  vì server thay bằng `String.replaceAll` (xem DW0). Hàm thuần `syncParams(sql, params)`, `paramValue(param)`, có test.
- **`LIMIT`**: dùng đúng luật của server (` limit ` có khoảng trắng hai bên, không phân biệt hoa thường): SQL có `limit`
  thì không phân trang và hiện số dòng nhận được, vì `total` server trả là số dòng khi bỏ `limit`.
- **Lưu analysis**: Save ghi widget của tab đang sửa query (widget 0 là query chính, tab chart giữ `sql_views` của nó),
  không bao giờ gửi `parameter_widget_ids`. Create Table / Update Table không đổi text trong editor; cả hai cùng thay
  parameter như nhau.
- **Schema edit**: form sửa schema là react-hook-form + zod (`useFieldArray`), cột khớp theo index ổn định (key riêng
  cho cột mới), Save lỗi thì giữ nguyên form. Cột giữ `json` gốc và ghi đè phần sửa (như `Widget`, `DataSource` của DI1)
  để PUT không làm mất `primary_keys`, `order_bys`, `input_formats`, `is_encrypted`, ...
- **RLS**: một form cho cả danh sách (`useFieldArray`), validate đủ 6 operator, xoá chỉ ở edit mode, rời tab RLS khi có
  thay đổi thì hỏi. Lưu là thay cả tập như server.
- **Relationship**: tách `features/dashboard/relationship` thành phần chung ở `shared/relationship/` (canvas, node, edge,
  control bar, utils) với adapter `{ load, save, allowTableEdit }`. Global thêm bảng bằng cách thả từ cây (vị trí qua
  `screenToFlowPosition`), xoá bảng xoá luôn vị trí của nó, key vị trí giữ format của v1 để v1 và v2 đọc được của nhau.
- **Vị trí code**:

  ```
  src/core/schema/              mở rộng: DatabaseService (my_data, create, delete),
                                TableService (create, update schema, from_query), DatabaseShareService
  src/core/rls/                 RlsPolicy, RlsPolicyService (policies/list, PUT policies)
  src/core/query/rawQuery.ts    raw query request, parameters (thuần); analysis ↔ dashboard JSON làm ở DW11
  src/shared/code-editor/       Monaco chuyển từ chart-builder, thêm SQL completion
  src/shared/relationship/      phần chung của relationship editor
  src/features/data-warehouse/  layout/, database-tree/, databases/, schema/, rls/, query-editor/, relationship/
  ```

  Tên `data-warehouse` theo path của v1 (không dùng `data`, bị `.gitignore`).

## Phát hiện ở DW0 (2026-10-30)

Chạy trên docker local (warehouse MySQL), bằng script gọi API và bằng v1 điều khiển qua Playwright (analysis). Request và
response lưu ở `src/core/schema/warehouse.fixture.json`. Không request nào cần `DI-SERVICE-KEY` hay `admin_secret_key`.

- **Không có trash.** `SchemaModule` của server dùng `MySqlSchemaMetadataStorage`, trong đó `remove` và `restore` trả
  `true` mà không làm gì, `databases/trash` luôn rỗng (bản SSDB có trash thật nhưng không được dùng). Đây là server bản
  open source, không chỉ stack local.
- **`databases/my_data`** bỏ qua `from` / `size` (luôn trả hết, `total` là số phần tử), đã lọc các database ẩn theo
  `hidden_db_name_patterns` (`etl_<n>`, `preview_etl_<n>`) nhưng vẫn có `mysql`, `sys`, `information_schema`,
  `performance_schema` (v1 cũng hiện). `owner` chỉ có khi `creator_id` khớp một user: database có sẵn trong warehouse
  không có owner, database tạo qua API có. `GET databases` không có `owner`; `multi_gets` có `{ database, owner? }`.
- **Display name của database và bảng không được lưu** (MySQL storage): `POST databases` với `display_name: "DW0 Probe"`
  trả `display_name: "dw0_probe"`; bảng cũng vậy, kể cả bảng tạo từ query. Display name, description, default value của
  **cột** thì lưu được.
- **PUT schema** (`{ table_schema }`) chạy thật: đổi kiểu cột đổi luôn kiểu trong MySQL (`double` → `longtext`), thêm cột
  có default value, đổi display name của cột (v1 khoá ô này; server cho sửa). Response là bảng đầy đủ, có thêm
  `partition_by`, `temporary`, `table_status` không có trong response tạo bảng.
- **`from_query`**: `view` tạo và ghi đè (`is_override: true`) được; tên trùng thì 400 `table big_qty already exist in db
  dw0_probe`; `materialized` thì **501 `Unsupported table type materialized`** trên MySQL; SQL sai thì 500 với message
  của database (đôi khi khó hiểu: `No database selected`).
- **`chart/query` với `raw_query_setting`**:
  - Server bọc SQL thành `select * from (<sql>) as v limit <size> offset <from>`, nên hai câu lệnh hay DDL đều lỗi cú
    pháp: editor chỉ chạy được một câu `select`.
  - SQL khớp regex ` limit ` (không phân biệt hoa thường) thì server không phân trang, nhưng `total` vẫn là số dòng khi
    bỏ `limit` (5 thay vì 3). `limit` trong subquery hoặc trong chuỗi (`'no limit 5'`) làm server cắt SQL sai và lỗi.
  - Response `json_table_response`: `headers` (`key` là `"0"`, `"1"`, …, `label` là tên cột), `records` là chuỗi
    (`"1"`, `"true"`, `"2026-10-01 08:00:00.0"`).
  - **Parameters** (`QueryParser.applyParameters`): regex `\{\{\s*<key>\s*\}\}` (key không escape), thay bằng
    `String.replaceAll`, nên `\` và `$` trong giá trị là ký tự đặc biệt (`'O\'Brien'` thành lỗi cú pháp). `'O''Brien tea'`
    chạy đúng. Parameter thiếu trong map thì `{{x}}` còn nguyên trong SQL và lỗi cú pháp. List gửi `1,3` hay `'1','3'`
    đều được. Key lấy từ map `parameters` ở ngoài cùng của request.
  - v1 thực tế gửi SQL ở cả `sql` lẫn `sql_views[0].query.query` (alias ngẫu nhiên `view_xxxxxxxxxx`), thêm `" \n"` vào
    cuối, `options: {}`, và parameter rỗng thành `''` (`qty > ''` trên MySQL trả mọi dòng).
  - **Đã xác nhận bug key của v1**: với `{{minQty}}`, `parameters` ngoài cùng có `minQty` nhưng `query_setting.parameters`
    (phần được lưu) thành `min_qty`.
- **Chuỗi tiếng Việt trong SQL không khớp**: `where name = 'Phở'` trả 0 dòng dù dữ liệu đúng UTF-8 (`hex` khớp, `like 'Ph%'`
  ra dòng đó). Filter `in` của chart cũng vậy. Cùng nợ backend với DI8 (charset của kết nối JDBC tới warehouse).
- **Preview bảng** bằng `group_table_chart_setting` với một `select` mỗi cột chạy được, header `key` là hash, sort bằng
  `sorts: [{ class_name: "order_by", order, function: { class_name: "select", field } }]`.
- **Share database**: ba endpoint chạy như mô tả. `permissions` trong `share/list` có tiền tố org
  (`0:database:view:dw0_probe`), còn request gửi tên action ngắn (`view`, `download`, …). Như M7b, `share/update` từ chối
  mọi quyền ngoài `view` với user không thuộc nhóm Editor (400 `Target user is not an editor…`), kể cả View & Download;
  `share` (tạo) thì không kiểm. Id share là chuỗi (`s_5`). `share/database/{db}` (endpoint chung) trả 500. Viewer được
  share `view` thấy database trong `my_data` và `GET databases`, sửa hay xoá thì 403.
- **RLS**:
  - `policies/list` và `PUT policies` (cần `rls:view:*` / `rls:edit:*`) chạy; PUT thay cả tập, policy có `policy_id`
    cũ giữ id, `-1` được cấp id mới, policy vắng mặt bị xoá. **`name` không được lưu** (model của server không có field
    này). `user_attribute: null` bị bỏ khỏi response.
  - **Áp dụng RLS hỏng trên MySQL**: mọi query (raw SQL lẫn object query) của user bị một policy nhắm tới đều 500 (lỗi
    cú pháp quanh alias `tbl_xxxxxx`, hoặc `Every derived table must have its own alias`). Giá trị trong condition của
    policy không được escape (`O'Brien tea` làm vỡ SQL); filter `in` thường thì có escape. Policy không có `user_ids` và
    `user_attribute` không áp vào ai. Nợ backend; DW8 làm phần quản lý policy, phần thực thi không kiểm được trên stack
    này.
- **Relationship global**: `GET` (rỗng là `{ views: [], relationships: [], extra_data: {} }`), `POST` → `{ success:
  true }`, `DELETE relationships/global` có. Server cấp `alias_name` (`tbl_<hash>`) và lưu `extra_data` nguyên văn (key
  thừa vẫn còn). Dashboard chưa lưu relationship riêng thì `relationships/{id}` trả bản global.
- **Analysis của v1** (`dashboards/create`): widget `class_name: "chart_v3"`, `extra_data.current_chart_type: "table"`,
  setting `raw_query_setting` có `options` là `table_chart_setting` đầy đủ kèm `raw_query` và `query_parameter: [{
  display_name, value_type, value, list }]`; `directory_type: "queries"`, `setting` của dashboard mặc định. Mở lại `?adhoc=`
  gọi `dashboards/{id}`, `get_directory_id`, `directories/{id}`, `directories/{id}/parents`. **Auto-save** mỗi khoảng 5s
  đã thấy thật: `PUT dashboards/{id}/widgets/{wid}/edit` sau khi sửa text.

Dữ liệu để lại cho các bước sau: database `dw0_probe` (bảng `products` 5 dòng có tiếng Việt và `O'Brien tea`, view
`big_qty`), analysis "DW0 Analysis" (dashboard 5) trong My Data, user `dw0.viewer@example.com` / `123456` (nhóm Viewer)
để thử share. Policy, share và relationship global đã trả về như cũ.

## Quyết định ở DW1 (2026-10-30)

- **`TableDefinition`** (`core/schema/TableDefinition.ts`) là model riêng cho trang Schema, không mở rộng `TableSchema` mà
  ChartBuilder đang đọc. Bảng và từng cột giữ `json` gốc; ghi thì merge phần sửa lên đó, nên PUT gửi lại nguyên
  `primary_keys`, `order_bys`, `partition_by`, measure, calculated column. Cột **đổi kiểu** chỉ giữ các key chung của mọi
  loại cột (`name`, `display_name`, `description`, `is_nullable`, `is_encrypted`, `is_private`, `default_value`,
  `default_expression`), vì server đọc cột theo `class_name`; description rỗng và default value chưa đặt thì bỏ khỏi
  JSON. Bảng đọc từ fixture ghi ra đúng bằng JSON của server (test `toStrictEqual`).
- **Service** (bind trong `WarehouseModule` và `RlsModule`, đều trên `ApiClient`, không header bí mật nào):
  - `DatabaseService`: `listMyData` (một request, không phân trang), `create`, `delete`. `DatabaseEntry` có `owner`
    khi server trả.
  - `TableService`: `getTable`, `createTable` (`tbl_name`, `primary_keys: []`, `order_bys: []` như request DW0),
    `updateTable` (`{ table_schema }`), `createTableFromQuery` (`is_override: false`). Ghi đè query của view và xoá bảng
    vẫn ở `SchemaEditService` (CB8); `tablePath` của nó được export để dùng chung.
  - `DatabaseShareService`: như `ShareService` nhưng theo tên database, không có link. Trả `ResourceSharing` có sẵn
    nên `ShareModal` dùng lại được ở DW5.
  - `RlsPolicyService`: `list`, `put` (thay cả tập, trả lại danh sách đã lưu). `RlsPolicy` không có `name` (server
    không lưu); `conditions` là JSON thô của trình sửa filter; `ALWAYS_TRUE` / `ALWAYS_FALSE` cho View All / View
    Nothing; operator lạ đọc thành `IsNull`.
- **Parameters** (`core/query/queryParameters.ts`, dùng chung với dashboard):
  - `formatParamValue` nhân đôi `'` và escape `\`, `$` (kiểm trên server: `O'Brien`, `US$ 5`, `a$1b` ra đúng). Dấu `\`
    đơn vẫn bị MySQL hiểu là ký tự escape trong chuỗi (`back\slash` thành `backslash`); tuỳ connector nên không xử lý.
  - `storedParameters` lấy từ `query_parameter` trong viz options (cả dạng mảng của query editor lẫn dạng map của
    builder v1), chỉ dùng `setting.parameters` khi không có. Đây là thay đổi cho cả chart trên dashboard: trước đây v2
    ưu tiên `setting.parameters` như v1, nên `{{minQty}}` không được thay.
- **`core/query/rawQuery.ts`**: `parameterNames` (tên chỉ gồm ký tự word, như server thay được), `syncParameters`,
  `parameterValues`, `hasLimit` (đúng regex của server), `rawQuerySetting`; request dựng bằng `toQueryRequestJson` có
  sẵn. Phần analysis ↔ dashboard JSON để DW11.
- **`fakeHttp`** chuyển từ `core/ingestion/testing.ts` sang `src/test/fakeHttp.ts`: module thứ hai cần nó.

## Các bước

| Bước | Phạm vi | Trạng thái |
|---|---|---|
| DW0 | **Spike và payload thật** trên docker local (warehouse MySQL): `databases/my_data`, `trash`, `remove` / `restore` có chạy không; tạo database, tạo bảng, PUT schema (đổi type, thêm cột, default value), `from_query` view và materialized; share database (ba endpoint); `policies/list`, `PUT policies` với user attribute và condition; `chart/query` với `raw_query_setting` + parameters (text, number, date, list) và `limit`; tạo analysis bằng v1 rồi lưu JSON; `relationships/global`. Có cần `DI-SERVICE-KEY` / `admin_secret_key` không. Lưu fixture | Xong (không có trash, RLS không chạy trên MySQL, xem DW0) |
| DW1 | **Core.** `DatabaseService`, `TableService`, `DatabaseShareService`, `RlsPolicyService`, mở rộng `TableSchema` / cột (giữ `json` gốc), raw query request và parameters thuần. Test round-trip với fixture DW0 | Xong (xem DW1) |
| DW2 | **Khung.** Routes `/data-warehouse/*` ở path của v1 (kể cả redirect `/data-management/*`), layout có header icon + tên, `/data-warehouse/databases/trash` chuyển về `all` (không có trash, DW0), page lazy load | Chưa làm |
| DW3 | **Cây database dùng chung.** Short info + tải khi mở, search, refresh, tạo database, slot action cho bảng / cột, kéo bảng, Storybook | Chưa làm |
| DW4 | **Databases.** Listing (search, sort, phân trang ở client, Owner trống khi server không trả), click dòng → Schema, Delete (xoá hẳn, hỏi xác nhận), trạng thái rỗng / lỗi | Chưa làm |
| DW5 | **Share database.** `ShareModal` nhận adapter, không có link / password, chỉ gửi thay đổi thật như M7b | Chưa làm |
| DW6 | **Schema đọc.** Chọn database / bảng theo URL, view database (danh sách bảng), tab Table Schema (search cột), Table Data (preview phân trang, sort), poll bảng `Processing`, Action menu (Query table, Update schema by query → Query Editor, Delete table, Delete database) | Chưa làm |
| DW7 | **Schema sửa.** Create table (modal tên + form cột), Edit schema (nullable, type có xác nhận, description, default value theo kiểu, thêm cột), Measure và Calculated Field (danh sách + `FormulaFieldDialog` của CB8), menu bảng / cột trên cây | Chưa làm |
| DW8 | **RLS.** Danh sách policy, form user / user attribute / operator, View All / View Nothing / Custom (trình sửa condition của CB4), Save / Cancel, preview làm mới sau khi lưu | Chưa làm |
| DW9 | **Relationship global.** Tách `shared/relationship`, adapter cho dashboard (không đổi hành vi M7c) và global; thả bảng từ cây, xoá bảng, Save / Discard, hỏi khi rời trang | Chưa làm |
| DW10 | **Query Editor: editor và chạy.** `shared/code-editor` với SQL, autocomplete bảng / cột / hàm, Run (cả đoạn / phần bôi đen, Ctrl+Enter), bảng kết quả phân trang, `limit`, parameters (thanh param, modal thêm / sửa, chạy lại khi đổi), chèn từ cây, Download CSV / Excel, mode query mới với `?database&table` | Chưa làm |
| DW11 | **Analysis đã lưu.** Mở `?adhoc=` (quyền, password, breadcrumb), Save / Save As (folder + tên), tab chart bằng ChartBuilder (host cho analysis và cho query chưa lưu), sửa / xoá tab, hỏi khi rời trang | Chưa làm |
| DW12 | **Bảng từ query và phần còn lại.** Create Table (view / materialized), mode `update` (Update Table, Ctrl+S) thay `UpdateTableQueryDialog` khi cần sửa dài, Add Chart To Dashboard nếu giữ | Chưa làm |

Thứ tự: DW0 → DW1 → DW2 → DW3, rồi ba nhánh song song theo thư mục: **Databases + Share** (DW4, DW5), **Schema** (DW6 →
DW7 → DW8), **Relationship** (DW9). Query Editor (DW10 → DW11 → DW12) đi sau DW6 vì Action menu của Schema mở nó, và DW11
cần ChartBuilder tách host. Mỗi bước kiểm bằng Playwright trên `pnpm dev` với backend docker, so screenshot với v1 như các
phase trước.
