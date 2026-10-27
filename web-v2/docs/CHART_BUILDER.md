# ChartBuilder: tạo và sửa chart

Tài liệu sống của việc migrate ChartBuilder (Phase 4 trong [`MIGRATION.md`](MIGRATION.md)). Cập nhật cột **Trạng
thái** khi một bước xong.

## v1 hoạt động thế nào

- **Luồng mở**: `ChartBuilderComponent` mở `VisualizeSelectionModal` (chọn loại chart), rồi đến `ChartBuilderModal`,
  một modal toàn màn hình gồm:
  - `DatabaseListing`: cây field.
  - `ConfigBuilder`: các zone thả field theo từng loại chart, cùng zone Filter và Sorting.
  - `VizPanel`: preview.
  - Tab Settings (`shared/settings`).
- **State**: `ConfigBuilderStore` giữ:
  - `configsAsMap`: ConfigType → `FunctionData[]`.
  - `filterAsMap`: group id → `ConditionData[]`.
  - Loại chart đang chọn và chart option.
- **Dựng query**: `QuerySettingResolver` chuyển state trên thành query setting, mỗi loại chart một handler.
- **Lưu**: chart giữ query trong `setting`, còn state của builder nằm trong
  `extra_data = { configs, filters, current_chart_type }`. Khi mở lại, builder đọc từ `extra_data`.
- **Key**: v1 snake_case hoá mọi key khi gửi đi, nên server lưu kiểu `configs.x_axis[].function_family`,
  `legend_optional`, …

Code v1 cần đọc:

- `screens/chart-builder`
- `screens/dashboard-detail/components/data-builder-modal`
- `src/shared/resolver`
- `src/shared/module/ChartBuilderModule.ts`
- `web/docs/CREATE_CHART_FLOW.md`
- `di-core/common/services/function-builder` và `condition-builder`

## Quyết định (2026-10-27)

- **`extra_data` giữ đúng format của v1.** Mỗi field được map tường minh theo cả hai chiều, để chart tạo ở v2 mở được
  bằng builder v1 và ngược lại.
- **Query setting vẫn là raw JSON** (theo M2). Builder sinh ra đúng JSON của server.
- **Resolver của v1 thành một typed map** `chartType → { canBuild, build }` gồm các hàm thuần, không dùng DI container.
- **Vị trí code:**
  - `core/chart-builder`: logic thuần, gồm FunctionData, ConditionData, các builder function / condition / query
    setting và viz options mặc định.
  - `features/chart-builder`: UI và reducer. Sau này RLS policy và query editor cũng dùng lại.
  - Modal là một lazy chunk riêng.
- **Loại chart làm trước**: chỉ những loại v2 đã render được:
  - Column, Bar, Line, Spline, Area và các biến thể inverted (series).
  - Pie, Donut, Semi pie.
  - Number và Table (flatten).
  - 8 filter widget và 2 loại inner filter.

  Các loại còn lại hiện trong picker ở trạng thái disabled, thay vì cho tạo chart không render được. Chúng được bổ
  sung dần cùng từng loại chart (CB7).
- **Chart không có `extra_data.configs`** (tạo tay hoặc từ bản cũ) mở ra với các zone trống, giống v1. Preview vẫn
  hiện setting đang lưu, và setting chỉ bị thay khi người dùng sửa config. Không dựng ngược configs từ setting.
- **Preview** áp các control hiện tại của dashboard (`buildChartQuery`), giống v1.
- **Tạm thời chưa làm trong builder:**
  - Add Calculated Field, Add Measure, Update Table By Query và Delete table trong cây field. Phần này phải làm
    sau khi ChartBuilder xong (CB8).
  - Matching location của Map: không port, vì đây là anti-pattern của v1. Map sẽ có thiết kế riêng.

## Phát hiện ở CB0 (2026-10-27)

- **Image docker cũ hơn `web/`.** Picker của `rocket-bi-web:latest` không có Spline, Line / Area Inverted Axes và Semi
  Pie. JSON của các loại này lấy theo source `web/`: dùng chung handler series và pie, chỉ khác chart type.
- **Những điểm bất thường trong dữ liệu đã lưu, phải giữ nguyên:**
  - `num_elems_shown` là chuỗi (`"10"`), không phải số.
  - Condition `in` vẫn ghi hai giá trị đầu vào `first_value` / `second_value`.
  - `current_chart_type` của Donut viết hoa chữ D (`Donut`).
  - Bar hiển thị zone Y-Axis trước X-Axis, nhưng group by vẫn lưu trong `x_axis` như các chart series khác.
- **Inner filter** được lưu bằng cách sửa chart cha (`widgets/{id}/edit` kèm `chart_filter`, id `-(id + 10)`,
  `current_chart_type: drop_down_filter`), không có widget riêng.
- **Filter gắn chart control:**
  - Trong `extra_data`, condition giữ `control_id` và `all_values` rỗng.
  - Trong `setting`, filter thành `dynamic_condition` gồm `dynamic_widget_id`, base condition với
    `possible_values: ["0", "0"]` và `extra_data.control_types: []`.
  - Danh sách control của v1 liệt kê mọi chart trong dashboard, không chỉ filter.
- **Chart adhoc** (setting có `sql_views`) mở builder trên bảng adhoc (`databases/adhoc/tables`, v1
  `AdhocBuilderConfig`): không chọn database, không có action trên bảng. Danh sách control của dashboard bỏ chính
  chart đang sửa.
- **Chưa có trong fixture**, sẽ bổ sung khi cần:
  - Filter nhóm OR: UI v1 không cho tạo rõ ràng, cần đọc `FilterDraggable`.
  - Dynamic function: thả một chart control vào zone trục.
  - Spline, Inverted, Semi Pie: image không có, xem ý đầu tiên.

Cách tạo lại fixture: mở v1 ở `http://localhost:5050` và dùng Playwright tạo chart qua chính builder của v1. Trong mỗi
zone có link "click here", dùng để chọn field thay cho kéo thả. Sau đó lưu kết quả của `GET dashboards/3`. Nút
Add/Cancel của v1 là `div.di-button`, không phải `<button>`.

Có hai fixture:

- `builder.fixture.json`: dashboard như server lưu.
- `builderRequests.fixture.json`: body mà v1 gửi khi Add, cùng `chart_filter` của inner filter.

Test so với **fixture thứ hai**. Lý do là server chuẩn hoá lại setting trước khi lưu:

- Thêm `group_by_func` / `aggregate_func`, `result_type`, `drill_through_fields`, `is_include_null`,
  `dynamic_function_ids`.
- Đổi `num_elems_shown` thành số.
- Bỏ giá trị trùng trong `possible_values`.

## Quyết định ở CB1 (2026-10-27)

- **`FunctionData` và `ConditionData` là interface thuần, không phải entity deneric2**, có hàm `fromJson` / `toJson` map
  từng field. Lý do: deneric2 tự điền default cho key vắng mặt (`dynamic_function: {}`), mà v1 coi mọi
  `dynamic_function`, kể cả `{}`, là chart control, nên chart sẽ hỏng. Ngoài ra, giá trị bất biến cũng hợp với reducer
  hơn. Key nào vắng thì vẫn vắng khi ghi lại: round-trip `extra_data` của cả hai fixture cho ra đúng JSON ban đầu.
- **Key zone dùng đúng key đã lưu** (`x_axis`, `legend_optional`, ...), không đổi tên.
- **Condition dùng chung `conditionBody` với `core/query/internalFilter`.** Riêng danh sách condition của từng family
  theo builder của v1: family date có thêm `equal` / `not equal`.
- **Default viz options theo v1 đang chạy**, không theo source. Hai bản lệch nhau ở chart series: bản đang chạy có
  legend ở đáy và `plot_options.area.stacking`. Các type mà v1 đang chạy không có thì theo source. Options được viết ở
  dạng camelCase như code v1, rồi đổi key bằng chính `snakeCase` của v1 (`toStoredKeys` trong `core/query/vizOptions`).
- **Đổi loại chart** thì lấy default của type mới và chỉ giữ lại title cũ (v1 `mergeWith`).
- **Bug v1 không mang sang:**
  - Condition gắn chart control trên cột nested bị mất `get_array_element`. v2 giữ nó trên base condition.
  - v1 ghi giá trị hiện tại của control vào setting lúc lưu (`applyDynamicFilters`). v2 chỉ áp giá trị đó lúc query.
- **Giữ như v1:**
  - First, Last và Week of Year không dựng được function, nên item đó bị bỏ khỏi setting.
  - Number gửi `compare_request: null`.
  - Slicer trên cột date bỏ scalar function của cột.

## Quyết định ở CB2 (2026-10-27)

- **Một reducer thuần** (`features/chart-builder/state/builderState.utils.ts`) bọc trong `useBuilderState`. Context
  dùng chung cho các panel sẽ thêm ở CB4, khi đã có panel cần đến nó.
- **Kéo thả dùng chung `DropAction` của `shared/field-dnd`.** Reducer áp nó bằng `applyDrop`:
  - Field kéo từ cây vào lấy function mặc định của zone đích.
  - Item chuyển sang zone khác giữ nguyên function, nhận id mới và sorting của zone đích (Ascending trong Sorting,
    Unsorted ở zone khác), và `display_as_column` bị tắt (v1 `FunctionNodeBuilder`).
- **Id mới bằng id lớn nhất đang dùng + 1**, áp riêng cho item, condition và group. v1 lấy số ngẫu nhiên (0–5000 với
  item) nên có thể trùng, mà v1 lại tìm item theo id. Cách mới cũng giữ reducer thuần.
- **Đổi loại chart**, theo v1 `changeConfig`:
  - Quay lại type của lần sửa zone gần nhất thì lấy lại đúng zone và options lúc đó.
  - Sang type khác thì gợi ý zone từ lần sửa đó (`suggestConfigs`) và lấy default options, chỉ giữ title cũ.
  - Chưa sửa zone lần nào thì bắt đầu với zone trống.
  - Filter luôn được giữ nguyên.
- **Setting đang lưu** được giữ cho tới khi người dùng sửa zone, filter hoặc đổi type (quyết định D2). Sửa options ở
  tab Settings thì vẫn dùng setting đó, chỉ thay phần options.
- **Function convertor của Table**: một cột đổi giữa nhóm (group by, date histogram, aggregation) và không nhóm (none)
  thì các item còn lại đổi theo, trừ measure và chart control.
- **Dọn options khi xoá function chưa làm.** v1 chỉ làm việc này cho Collapse Table và Pivot Table, nên nó sẽ đi cùng
  hai type đó ở CB7.
- **Bug v1 không mang sang:**
  - `suggestConfigs` đếm sai `maxItem` khi lấy item từ nhiều zone.
  - Slicer, Date và Input không có zone Sorting và Filters, nhưng v1 vẫn áp sort và filter còn sót lại từ type trước,
    và người dùng không thấy cũng không xoá được. v2 giữ chúng trong state (để quay lại type cũ vẫn còn) nhưng không
    đưa vào setting.
  - Condition mới: v1 đặt `current_option_selected` và `current_input_type` là `in` cho mọi kiểu cột. v2 đặt theo
    condition mặc định (`in` / `equal` / `between`).

## Quyết định ở CB3 (2026-10-27)

- **Cây field** (`features/chart-builder/field-tree`) có hai tab, Database và Chart Control, như v1.
  - Tab Database có dropdown chọn database. Nút search thay dropdown bằng ô search; ô search trống mà mất focus thì
    quay lại dropdown.
  - Chart ad hoc chỉ hiện bảng của nó, có ô search, không có dropdown (v1 `AdhocBuilderConfig`).
  - Mỗi dòng là một `FieldDraggable` với payload `FieldTreePayload` (`column` hoặc `control`), dùng cho CB4.
- **Field kéo vào giữ đúng JSON của v1:**
  - Cột thường là `table_field`. Cột của bảng ad hoc là `view_field` (theo `view_name`, không có `db_name`, giống
    relationship).
  - Measure là `expression_field`, calculated column là `calculated_field`, cả hai kèm `expression`.
  - Cột trong cột nested có `field_name` là `` `nested.inner` `` và `isNested`.
  - `tableName` / `columnName` là display name, như v1.
- **Database và bảng mở sẵn:**
  - Sửa chart: mở database được chart dùng nhiều nhất, cùng các bảng của nó.
  - Thêm chart: mở database dashboard dùng nhiều nhất, cùng các bảng của nó.
  - Không tìm được thì lấy database đầu tiên và mở bảng đầu tiên.
  - Người dùng tự đổi database thì mở bảng đầu tiên.
  - Trạng thái mở/đóng được nhớ riêng cho từng database.
- **Search** tìm theo tên bảng (giữ cả bảng) hoặc tên cột (chỉ giữ cột khớp), tối đa 20 bảng, và mở hết các bảng
  tìm được.
- **Chart control:**
  - Danh sách gồm main date filter và mọi chart khác của dashboard, trừ chart đang sửa, sắp theo tên (v1).
  - Title lấy từ viz options, nếu trống thì lấy tên widget (v1 để trống).
  - Tab filter có nhiều cột là function controller: `table_columns` / `default_table_columns` mang
    `dynamic_function_id`, mặc định là các cột được chọn sẵn, nếu không có thì là cột đầu tiên.
- **Dùng chung với dashboard:**
  - `ColumnTypeIcon` và `columnKind` chuyển sang `shared/schema`.
  - Query key của schema chuyển sang `shared/schema/schemaQueries`. Drill trong dashboard cũng dùng nó.
- **`SchemaService` mở rộng:**
  - Thêm `listDatabases` (`GET databases`, sắp theo display name).
  - Đọc thêm display name, `table_type`, `query`, measure, calculated column và cột nested. Key nào server để trống
    thì bỏ qua.
- **Icon chart của v1** được copy sang `public/chart-builder/charts`, gồm cả type chưa build được, vì control và
  picker (CB5) cần dùng.
- **Chưa làm ở bước này:** action trên bảng và cột (CB8). Cây field chưa được gắn vào builder; việc này làm ở CB4 và
  CB5.

## Quyết định ở CB4 (2026-10-27)

- **Context của builder** (`state/BuilderContext.tsx`): `BuilderProvider` giữ state, setting và `dispatch`, cùng chart
  control của dashboard, `sqlQueryOf` và `dashboardId`. Các panel đọc nó qua `useBuilder`.
- **Kéo thả** (`features/chart-builder/dnd`): `BuilderDndProvider` bọc cây field và config panel trong một
  `FieldDndProvider`.
  - Zone id là key đã lưu (`x_axis`, `sorting`, ...). Zone Filters có id `filters`, thả vào đó thì tạo nhóm OR mới.
    Mỗi nhóm AND là một zone `filters:<groupId>` nằm trong zone Filters, và được ưu tiên vì là zone trong cùng.
  - Zone config nhận cột, item và condition. Trong các chart control, nó chỉ nhận function controller (v1
    `disabledDropConfig`).
  - Zone Filters nhận cột, item và condition, nhưng không nhận measure và chart control.
  - Item chuyển giữa hai zone config thì move. Kéo vào / ra Sorting, và giữa zone config với Filters thì copy.
    Condition kéo sang nhóm khác thì move, giữ id; nhóm bị rỗng thì xoá.
  - `builderActionOf` đổi `DropAction` thành action của reducer: condition kéo vào zone config thành item mới, item
    kéo vào Filters thành condition mới.
- **Reducer bổ sung:**
  - Thả lên item của zone một item đã đầy thì thay item đó: giữ id, và giữ function nếu cột cùng loại (v1
    `mergeConfig` + `isDiffFieldType`). Measure và chart control luôn lấy function mặc định.
  - Function controller thả vào zone thành item `Dynamic`: field là `chart_control_field` như v1, `dynamic_function`
    là data của control.
  - `addCondition` nhận vị trí trong nhóm. Thêm `moveCondition`.
- **Item của zone** (v1 `DraggableItem`): function family, type và sorting (chỉ ở zone Sorting) là các link mở menu.
  Family lấy theo kiểu cột (`core/chart-builder/functionOptions`), không theo zone, như v1. Measure và chart control
  không có menu family. Menu "..." gồm Config và Remove.
- **Dialog Config** (v1 `ConfigModal`) gồm display name, function, sorting và top N. Sorting chỉ có ở zone Sorting
  hoặc với aggregation; top N chỉ có khi đã sort. Validate bằng zod như v1: display name bắt buộc, top N là số nguyên
  dương khi đang bật. Khác v1:
  - Đổi family trong dialog thì lấy type đầu tiên theo kiểu cột, giống menu nhanh. Dialog v1 luôn lấy Count all cho
    aggregation, kể cả cột số.
  - Top N lưu dạng số; v1 lưu chuỗi đã gõ. v1 đọc được cả hai.
  - Display as column: v1 không có UI cho nó, nên làm cùng Pivot Table ở CB7.
- **Trình sửa condition** (v1 `InternalFilterPopover`):
  - Một danh sách condition chung, thay cho hai chế độ Range / Selection của v1. Khi lưu `in` / `not in` trên cột số
    hoặc ngày, `filter_mode_selected` là `selection` để v1 mở lại đúng.
  - Manual Input: condition dạng danh sách lấy giá trị cột từ server như v1 `SelectionFilter` (`select_distinct`, sort
    ASC, 80 dòng mỗi trang, nút Load more). Giá trị rỗng và null không hiện, vì condition danh sách bỏ qua chúng.
    Condition khác dùng `FilterValueInput`, chuyển từ header filter sang `shared/filter-input`.
  - Chart Control: chọn control, rồi chọn giá trị của control cho condition: `selected_value`, hoặc start / end với
    date select, slicer và main date filter. Number và table không làm control được (v1 `isEnableControl`).
  - Đổi chế độ hoặc đổi control thì xoá giá trị đã chọn. v1 nhớ lại giá trị của chế độ trước.
  - Condition không nhận giá trị (`is null`, ...) không có chế độ Chart Control.
- **Không mang sang:** thả chart control vào zone Filters. v1 tạo condition chưa có field rồi hỏi field; v2 làm việc
  này bằng chế độ Chart Control của trình sửa.
- **Chưa làm ở bước này:**
  - Chọn field bằng menu bảng / cột (v1 `SelectFieldContext`): link "click here" của zone và click tên item hoặc
    condition để đổi field. Chuyển sang CB5.
  - Edit Measure trong menu của item: CB8.

## Các bước

| Bước | Phạm vi | Trạng thái |
|---|---|---|
| CB0 | **Payload thật.** Dashboard "v2 Builder" (id 3) tạo bằng builder v1 trên backend local (điều khiển bằng Playwright), lưu thành `core/chart-builder/builder.fixture.json`. Gồm: column (Average, đổi display name, sort Descending với top 10, filter `in`, inner filter), line (date histogram, Count distinct, legend), area, bar, pie, donut, number, flatten table, 8 filter widget và một column có filter gắn chart control | Xong |
| CB1 | **`core/chart-builder`.** Entity `FunctionData`, `ConditionData`, `extra_data`. Danh mục chart (v1 `DataBuilderConstantsV35`: zone, số item tối đa, function mặc định theo kiểu field). Builder cho function (function, table column, order by, top N, dynamic function), condition và query setting. Viz options mặc định và cách merge khi đổi loại chart. Test bằng CB0: từ `extra_data` của 19 widget, dựng lại `setting` và default options phải khớp hoàn toàn (`toStrictEqual`) với body mà v1 đã gửi | Xong |
| CB2 | **Reducer của builder** (`features/chart-builder`). Khởi tạo từ widget hoặc rỗng. Đổi loại chart (`latestState` và chuyển config như v1). Thêm / sửa / xoá / đổi thứ tự config. Filter theo nhóm. Function convertor (table; scatter và bubble đi cùng type của chúng ở CB7). Setting dẫn xuất từ state. Dọn options khi xoá function để lại CB7 | Xong |
| CB3 | **Cây field** (chỉ đọc). Chọn database (`GET databases`), bảng và cột có search và icon theo kiểu, mở sẵn các bảng đang dùng, cột kéo được, các chart control của dashboard | Xong |
| CB4 | **Config panel.** Zone theo loại chart (luật của `shared/field-dnd`). Menu của item (function family và type, sorting, display name, top N, display as column). Zone Sorting. Zone Filter có nhóm AND/OR và trình sửa condition (giá trị cột lấy từ server, chế độ Manual Input hoặc Chart Control). Display as column để lại CB7 | Xong |
| CB5 | **Ghép lại.** `ChartBuilderModal` (Cancel / Add / Update, tab Builder và Settings), picker loại chart, preview (`ChartRenderer` / `FilterRenderer`). Lưu: tạo mới đặt ở -1/-1 như M6, cập nhật, cache qua `useDashboardEditor`. Hỏi xác nhận khi rời. Truyền `ChartBuilderBridge` cho route dashboard. Inner filter thêm / sửa / xoá trong menu của chart. Chọn field bằng menu bảng / cột ("click here", click tên để đổi field). So với v1 bằng screenshot Playwright | Chưa làm |
| CB6 | **Tab Settings**, ghi vào `setting.options` qua `vizOptions`. (a) Các tab chung (Title, Background, Tooltip, Visual header, Color) và series (General, Display, Legend, trục X / Y, dual axis, Data label). (b) Pie, number, table. (c) Filter widget và giá trị mặc định của chúng | Chưa làm |
| CB7 | **Các loại chart khác.** Mỗi loại gồm renderer, builder handler và settings, làm cùng các loại chart của Phase 3 | Chưa làm |
| CB8 | **Action trên cây field.** Calculated field và measure (Monaco formula editor, gợi ý hàm theo connector), Update Table By Query, Delete table | Chưa làm |

## Ghi chú về field drag and drop

Code ở `shared/field-dnd`, story trong `Shared/FieldDnd`.

- **Cách dùng:**
  - Bọc cây field và các zone trong `FieldDndProvider`.
  - Đặt `FieldDraggable` trên các lá của cây, mỗi zone config dùng một `FieldDropZone`.
  - Truyền cho provider một luật cho mỗi zone (`size`, `maxItems`, `disabled`, `accepts`).
  - Trong `onDrop`, áp `DropAction` nhận được bằng `applyDrop` hoặc tự xử lý. v1 dựng lại function node cho zone đích
    và merge config khi replace, nên phần này làm trong factory.
- **Luật theo v1:**
  - Thêm vào cuối zone, hoặc chèn vào một khe.
  - Thay item của zone chỉ nhận một item khi zone đã đầy; chỉ áp dụng khi kéo từ cây.
  - Đổi thứ tự trong zone.
  - Chuyển hoặc copy giữa các zone (`transferModeOf`): v1 copy khi kéo vào / ra khỏi zone sorting và khi kéo ra khỏi
    zone filter.
  - Nhóm OR/AND của zone filter có thể là mỗi nhóm AND một zone; zone trong cùng được ưu tiên.
- **Không có animation sắp xếp lại khi kéo**, đây là chủ ý:
  - Vạch ở khe cho thấy field sẽ rơi vào đâu, nhờ vậy vùng nhận vẫn nằm đúng chỗ đang vẽ.
  - Kéo chỉ bắt đầu sau 4px, nên click vào menu của item vẫn hoạt động.
  - Ô nhập text và phần tử có `FIELD_NO_DRAG_CLASS` không bao giờ bắt đầu kéo.
