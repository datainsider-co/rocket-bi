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
    condition để đổi field. Đã làm ở CB5.
  - Edit Measure trong menu của item: CB8.

## Quyết định ở CB5 (2026-10-27)

- **Gắn vào dashboard qua một host component:**
  - Route `/dashboard/:name` dùng `DashboardBuilderPage` (`features/chart-builder`). Trang này truyền
    `ChartBuilderHost` cho `DashboardPage`, và host là một lazy chunk riêng. Dashboard không import ChartBuilder;
    route embedded vẫn dùng `DashboardPage` không có builder.
  - Trang dashboard giữ request đang mở (`ChartBuilderRequest`: `addChart`, `configChart`, `addInnerFilter`,
    `configInnerFilter`). `ChartBuilderBridge` chỉ còn `open(request)`.
  - Host được render bên trong `DashboardControlsProvider`, nên preview áp các control hiện tại của dashboard và các
    header filter (nếu chart bị ảnh hưởng bởi filter), giống v1.
- **Luồng:**
  - Add chart: picker trước (lưới 39 chart + 9 filter như v1). Loại chưa build được thì disabled.
  - Config chart: mở thẳng builder trên chart.
  - Add chart filter: bắt đầu bằng Dropdown, loại inner filter đầu tiên của v1.
  - Builder có ô chọn loại chart để đổi type, gồm các loại cùng nhóm (chart + filter, hoặc inner filter). v1 dùng hàng
    icon kèm "View all".
- **Lưu** (`host/builderSession.utils.ts`, JSON trong `core/chart-builder/chartWidget.ts`):
  - JSON widget giống v1 `getFinalChartInfo`: name là title, description là subtitle, `background_color` /
    `text_color` lấy từ options (key snake_case đã lưu), nếu thiếu thì dùng `#0000001A` / `#fff`. Kiểm bằng
    `builderRequests.fixture.json`: dựng lại đúng 19 body mà v1 gửi.
  - Chart sửa giữ các key của nó, kể cả `chart_filter`. `extra_data` của builder được ghi đè lên `extra_data` đã lưu.
  - Chart mới được tạo ở -1/-1 với kích thước v1 `getDefaultSize` theo setting (`chartSizeOf`). Grid sẽ tìm chỗ
    trống, như M6.
  - Inner filter được lưu bằng cách sửa chart cha, với `chart_filter.id = -(id + 10)`. "Delete chart filter" bỏ
    `chart_filter` mà không mở builder.
  - Lưu qua `useDashboardEditor` (cập nhật cả cache). Lỗi thì báo bằng message của server và giữ builder mở.
- **Nút Add / Update** bị disabled khi zone chưa dựng được setting hoặc preview lỗi (v1 `isDisableAddOrUpdate`).
- **Rời builder:** chỉ hỏi xác nhận khi đã sửa gì đó. `dirty` nghĩa là state khác state lúc mở, vì reducer trả lại đúng
  state cũ với action không đổi gì.
- **Control trong builder:** mọi chart khác của dashboard cùng main date filter. Inner filter không có control nào,
  như v1.
- **Chart ad hoc** (setting có `sql_views`): cây field chỉ hiện bảng của view, đọc bằng `databases/adhoc/tables` với
  câu SQL đã thay tham số. Không có tab Chart Control. Nếu đọc lỗi thì mở builder trên database như v1.
  - **Khác v1:** tham số lấy theo giá trị đã lưu của chart. v1 lấy giá trị hiện tại của các input.
- **Preview** dùng `ChartRenderer` / `FilterRenderer` và `useWidgetData` (thêm cờ `enabled`) của dashboard:
  - Id là id của widget đang sửa (chart mới là -1), để inner filter và selection của chính nó vẫn có tác dụng.
  - Filter widget giữ selection riêng của preview.
  - Không query dưới quyền View As (host bọc `ViewAsProvider` không có user).
  - Sort của table trong preview chưa làm.
- **Modal render tại chỗ** (`getContainer={false}`), không qua portal, để biến CSS theme của dashboard áp được lên
  preview.
- **Chọn field bằng menu** (v1 `SelectFieldContext`, `config-panel/FieldMenuView`):
  - "click here" của mỗi zone thêm field vào cuối zone; ở zone Filters thì tạo nhóm mới.
  - Click tên item hoặc tên condition để đổi field: cùng loại cột thì giữ function / condition, khác loại thì về mặc
    định (`changeItemField`, `changeConditionField`).
  - Menu của Filters không có measure. Item là chart control thì không đổi field được: v1 mở danh sách control, v2
    chưa làm.
  - Bảng lấy từ `useFieldTree` qua `FieldChoicesContext`.
- **Donut:** renderer của dashboard vẽ `donut_chart_setting` bằng code của pie. v1 `DonutChart` chỉ khác `PieChart`
  ở `innerSize` trong options. Trước bước này Donut đã build được nhưng hiện "not supported".
- **Tab Settings** chưa có nội dung; làm ở CB6.

## Quyết định ở CB6a (2026-10-28)

- **Sửa options như v1** (`core/chart-builder/vizChanges.ts`):
  - Mỗi thay đổi là một lodash path theo camelCase của v1 (`title.style.fontSize`, `yAxis[1].visible`,
    `plotOptions.series.response.<vizKey(name)>.name`), giống `ChartOption.setOption`.
  - `applyVizChanges` đổi options đã lưu sang camelCase, áp các path rồi đổi lại bằng `toStoredKeys`, nên v1 đọc được.
    Giá trị `undefined` thì xoá key (khi gửi đi, `undefined` của v1 cũng mất).
  - Reducer có action `vizChanges` thay cho `options`. Sửa options không đổi `touched`, nên chart chưa có builder data
    vẫn giữ setting đã lưu, chỉ thay phần options (quyết định D2).
  - Query không gửi options, nên sửa setting không query lại; preview vẽ lại ngay.
- **Code** ở `features/chart-builder/settings`:
  - `fields/`: control dùng chung (text và number áp dụng khi Enter hoặc mất focus như v1 `InputSetting`, select,
    color, toggle, align, Revert to default).
  - `tabs/`: mỗi tab một view. Giá trị mặc định và các thay đổi gồm nhiều key nằm trong `commonTabs.utils.ts` và
    `seriesTabs.utils.ts`.
  - `SettingsPanel` chọn bộ tab theo loại chart. Ở bước này chỉ chart series (Column, Bar, Line, Spline, Area và các
    biến thể inverted) có tab; các loại khác vẫn báo chưa có (CB6b, CB6c).
- **Bố cục:** các tab là panel thu gọn được theo thứ tự của v1, mở sẵn Title & Subtitle. Tab Settings chiếm chỗ của
  cây field và config panel, preview giữ nguyên kích thước. Nền của preview lấy theo `background` của options.
- **Màu là biến theme** (`var(--text-color)`, ...): ô màu hiện "Theme" với màu hiện tại; chọn màu thì lưu hex.
- **Display:** chọn từng series theo response của preview (key `vizKey`, sắp theo tên như v1). Chưa có data thì báo
  là series sẽ hiện khi chart có data.
- **Dual Y Axis:** bật thì chuyển series thứ hai sang trục phải, tắt thì đưa mọi series về trục chính và bỏ min /
  max của trục phải, như v1. Series nào dùng trục phải thì chọn ở Display.
- **Khác v1:**
  - Tooltip: v1 lưu font vào `tooltip.fontFamily`, nhưng cả tab lẫn chart đều không đọc key này. v2 lưu vào
    `tooltip.style.fontFamily`. Revert về màu của theme, không về tooltip tối `#333645`.
  - Background: v1 luôn hiện trắng (truyền nhầm prop); v2 hiện màu của chart.
  - Gridlines: v1 coi `'0'` (đã tắt) là vẫn bật; v2 đọc theo số.
  - Display: bỏ hai ô Type và Line width vì v1 luôn disable chúng. Revert bỏ `type` riêng của series thay vì ghi chart
    type, vì `line_inverted` không phải type của Highcharts. Marker và dash theo type Highcharts của series, nên Spline
    cũng có dash.
  - Data label condition: bật Min / Max thì lưu luôn giá trị đang hiện. v1 ghi `condition.min = 0` (số, không phải
    object), và khi bật Max lại ghi nhầm vào Min.
  - Display unit của Donut lưu dưới `plot_options.pie`, nơi renderer đọc. v1 ghi vào `series`.
  - Không ghi default lúc mở tab. Các tab trục của v1 tự revert khi trục chưa có setting (`created`).
- **Lưu nhưng v2 chưa dùng:** `is_enable_drilldown` (menu của v2 chưa đọc cờ này) và `legend.max_height`. Các key này
  vẫn được lưu để v1 dùng.
- **Data label của pie** (label format, distance) và các tab của pie, number, table: CB6b.

## Quyết định ở CB6b (2026-10-28)

- **Pie, Semi pie, Donut** (v1 `PieSetting` / `DonutSetting`): Legend, Title & Subtitle, Data Color, Data Label,
  Background, Tooltip, Other, theo thứ tự của v1 (Legend đứng đầu). Data Label có thêm Label style
  (`name_and_value`, `name_and_percent`, `name`) và Label position (`distance`, -100 đến 60, slider áp dụng khi thả
  tay), lưu dưới `plot_options.pie.data_labels`.
- **Number** (v1 `NumberSetting`): Title & Subtitle, Theme, Icon, Data Label, Tooltip, Background, Other.
  - Theme: 6 theme v1 cho chọn (`style_1` đến `style_5`, `style_area_1`), ảnh ở `public/chart-builder/kpi-themes`,
    preset ở `settings/number/kpiThemes.json`. Chọn theme thì thay nguyên từng key của theme, giữ text của title,
    subtitle, prefix, postfix, icon đang chọn và lựa chọn trend line (v1 `ThemeTab`).
  - Icon: lưới icon `setting-icon-*` của v1 theo nhóm (`kpiIcons.json`), lọc theo tên, cùng màu icon, màu nền và
    hình dạng (bo góc). v1 có nhóm Recent lưu trong local storage; v2 chưa làm.
  - **Khác v1:** chart chưa có icon mà tắt Show icon thì v1 lại bật icon của theme; v2 giữ đúng lựa chọn. Revert của
    Data Label không ghi `displayUnit` ở gốc options (key mà không ai đọc).
  - **Chưa làm:** tab Comparison, vì renderer KPI của v2 chưa vẽ phần so sánh và trend line. Tab Tooltip giữ như v1
    nhưng KPI không có tooltip để áp.
- **Table** (theo lựa chọn 2026-10-28): chỉ các tab mà renderer table của v2 đọc: Title & Subtitle (có toggle bật /
  tắt như v1), Background và Other (display unit mặc định None, precision, dấu thập phân, dấu phân cách hàng nghìn).
  Style, Grid, Header, Values, Field formatting, Conditional formatting và Tooltip của v1 làm cùng renderer table vẽ
  được các style đó (CB7). Font, màu và căn lề của title trong table hiện chưa được renderer áp.

## Quyết định ở CB6c (2026-10-28)

- **Tab của filter** (v1 `TabFilterSetting`, `SlicerFilterSetting`, `DateFilterSetting`, `InputFilterSetting`,
  `TreeFilterSetting`): Title (chỉ title, không subtitle và căn lề, như v1 `FilterTitleTab`), tab control theo loại
  filter, Background, Other. Inner filter (Dropdown, Tab của chart) không có Title và Background.
  - Tab, Single / Multi choice, Dropdown: Position (row / column), màu active / inactive, search box và placeholder.
    Dropdown không có các mục này; inner filter không có Position. Choice dùng `choice_active_color` /
    `choice_de_active_color` như v1. Ô màu hiện màu mà renderer đang vẽ (`tabFilterColors`).
  - Slicer: Step (trừ slicer theo ngày), giá trị mặc định, so sánh From / To (`from.equal`, `to.equal`).
  - Date select, Input: chỉ giá trị mặc định.
  - Tree: màu active / inactive, giá trị mặc định.
- **Giá trị mặc định** (`settings/filter/filterDefault.utils.ts`, v1 `DefaultValueSetting`):
  - Nút "Use the preview's selection" lưu selection hiện tại của filter trong preview vào `default.setting`; Reset ghi
    `null` như v1. Tab hiện giá trị đang lưu, và nút chỉ bật khi selection khác giá trị đó.
  - Preview của filter bắt đầu từ giá trị mặc định đang lưu (`defaultControlValues`), như trên dashboard.
  - `value` có dạng mà dashboard đọc lại: danh sách giá trị (tab, dropdown, key cột với function control), cặp
    `[from, to]` (slicer), `{ mode, dates }` (date select), `{ selected_keys, expanded_keys }` (tree, giữ
    `expanded_keys` đã lưu), chuỗi (input). Test khứ hồi: giá trị ghi ra được `defaultControlValues` đọc lại đúng
    selection.
  - Filter theo giá trị (tab, dropdown) lưu thêm `conditions` là condition `in` của v1, vì dashboard v1 dùng nó để áp
    giá trị mặc định cho inner filter. Các loại khác v1 không đọc `conditions` (`isEnableFilter` luôn false), nên v2
    không ghi.
  - Chọn All (không chọn gì) thì không có giá trị mặc định (`null`).
- **Khác v1:**
  - v1 lưu màu inactive vào `de_active_color` nhưng đọc `deactivate_color`; v2 đọc và ghi `de_active_color`, key mà
    renderer đọc.
  - Revert của Tab controls giữ giá trị mặc định; v1 xoá luôn nó. Giá trị mặc định có nút Reset riêng.
  - Ô placeholder bị disable khi tắt search box (v1 viết sai tên prop nên ô này không bao giờ bị disable).
  - Slicer lưu giá trị mặc định là cặp `[from, to]`. Slicer thường của v1 lưu object range, trong khi chính dashboard
    v1 lại đọc theo cặp.
- **Chưa làm:** setting của slicer không có cột (v1 `DynamicSettingTab`: min / max, dùng với ngày), vì builder v2 chưa
  tạo được slicer không cột.

## Quyết định ở CB7a (2026-10-28)

Number: date range, comparison và trend line (v1 `ComparisonUtils`, `NumberWidget`, tab Comparison). Spec lấy từ v1 và
kiểm bằng backend local.

- **Lõi thuần** `core/query/comparison.ts`, đọc `data_range`, `comparison`, `trend_line` trong options đã lưu:
  - Điều kiện theo mode: `this_*` → `current_*`, `last_day/week/month/quarter/year` → `last_n_*` = 1,
    `last_7_days` / `last_30_days` → `last_n_day` 7 / 30, `custom` → `between_and_including` theo range đã lưu,
    `all_time` → không có điều kiện.
  - Comparison bật: gửi `compare_request` ở gốc body (`mode: "RawValues"`, server chỉ nhận PascalCase). Kỳ so sánh của
    mode tương đối là cùng điều kiện kèm `interval_function` (`past_n_*`); của range custom là range tính sẵn (kỳ
    trước có cùng số ngày, hoặc lùi 1 tháng / quý / năm); comparison custom dùng range riêng của nó. All time so với
    không gì cả, nên giá trị so sánh là tổng.
  - Chỉ bật date range: thêm một filter request trên cột ngày.
  - `buildChartQuery` gắn cả hai, nên dashboard, preview và export đều dùng. Response đọc
    `compare_responses.RawValues` thành `compareValue`.
- **Trend line:** một query series thứ hai (`useKpiTrend`), giá trị theo thời gian (`Trend by` → `to_*_num`), sắp
  tăng dần, trong range. Vẽ bằng spline / areaspline trơn: không trục, legend, tooltip.
  - Server OR các phần tử của `filters` (mỗi nhóm của zone Filters là một `and`; đã thử trên backend local). Vì vậy
    điều kiện range được `and` vào từng nhóm, không thêm thành phần tử riêng. Bản đầu của CB7a thêm riêng, nên chart có
    filter thì trend line bỏ qua range.
- **Cột ngày trong cột nested** (`` `nested.inner` ``, hoặc bảng tên có dấu chấm như v1 `SchemaUtils.isNested`):
  - Mọi điều kiện trên cột ngày có `scalar_function: get_array_element` (index 1): range, hai kỳ của
    `compare_request`, filter request, filter của trend line.
  - Trục và sort của trend line có `get_array_element` làm `inner_fn` của `to_*_num`, như v1 làm với item của zone
    (`DiFunctionResolver`).
  - Tab Date Range liệt kê cả cột ngày trong cột nested, nhãn `bảng.nested.cột`.
  - Backend local: server nhận shape này (scalar lạ thì lỗi 400 khi parse), nhưng MySQL không có `get_array_element`
    (500 `an implementation is missing`). Cột nested chỉ có trên ClickHouse, nên chưa chạy được trên stack local.
- **Dropdown range cho người xem** (v1 `DateRangeDropdown`): trên layout không theme, khi bật date range, nằm giữa
  header và giá trị.
  - Nhãn là range dạng `MMM D, YYYY - MMM D, YYYY` (mode tương đối tính theo hôm nay), `All Time` khi không có range.
  - Mở đúng popover của main date (`MainDateCalendarView`): 14 mode của v1 kể cả Custom và All Time, hai lịch,
    Cancel / Apply.
  - Lựa chọn chỉ nằm trong view của chart (`ChartView.dateRange`, cùng chỗ với drill / zoom / sort), không lưu, mất khi
    reload, như v1. `viewedSetting` ghi `data_range.mode` / `date_range` lên setting đang xem (`withDateRange`), nên
    giá trị, comparison, trend line và export đều đi qua `buildChartQuery` như cũ.
  - Preview của builder chỉ hiện nhãn, không mở popover: range sửa ở tab Date Range.
  - Đã kiểm trên dashboard: chọn Last Month thì `compare_request` và filter của trend line đổi sang `last_n_month`.
- **Layout của KPI** theo v1:
  - Không theme: PercentageBar dưới giá trị (icon lên / xuống, % không dấu, giá trị so sánh; xanh `#4dcf36` / đỏ
    `#ea6b6b`), trend line xanh / đỏ phía dưới.
  - `style_area_1`: icon lớn bên trái, giá trị và % trên một hàng, trend line dọc đáy card cao 126px.
  - Theme khác có trend line: trend line bên phải (70%, tối đa 296px), mờ dần sang trái.
  - Theme khác không có trend line: % dạng pill ở góc trên phải.
  - Màu của %: màu của giá trị (`color_by_inherit`), hoặc màu tăng / giảm. Màu trend line: màu riêng, hoặc màu của
    % (`color_by_percentage`).
- **Tab Date Range** (v1 Comparison tab): bật date range, cột ngày (mọi cột ngày của các bảng trong builder, như
  v1), mode, ngày custom, Compare with với kỳ so sánh, Trend line (Display as, màu, Trend by), Revert tắt cả ba. Chỉ
  hiện khi có cột ngày. Đổi mode thì lưu luôn range như v1, và range của comparison preset đi theo.
- **Khác v1:**
  - Chỉ bật date range: v1 lọc theo range đã lưu, nên "last 30 days" đứng yên ở ngày lưu chart. v2 để server tính mode
    tương đối, như v1 vẫn làm với comparison.
  - Previous period của last 7 / 30 days: v1 chỉ lùi 1 ngày; v2 lùi đúng 7 / 30 ngày.
  - Trend line giữ filter của chart và filter của dashboard; v1 bỏ hết.
  - Layout có theme: v1 hiện giá trị so sánh chưa định dạng khi `display` là value; v2 định dạng như giá trị.
  - Bật trend line không reset màu, và không ghi `comparison.trend_by` thừa.
  - Default của tab không được ghi khi mở tab (v1 merge vào props mà không emit).
  - Dropdown của người xem: v1 sửa thẳng object setting của chart (`NumberQuerySetting.setDateRange`), nên lựa chọn
    có thể lọt vào lần lưu sau và vào builder. v2 giữ nó riêng trong view.
  - Dropdown luôn nằm trên giá trị. v1 đặt nó ở góc phải, dưới PercentageBar, khi có trend line.
  - Cột nested: v1 chỉ thêm `get_array_element` cho điều kiện của range (`buildDateFilterCondition`), không cho range
    custom của comparison, filter request và trend line; tab của v1 cũng không liệt kê được cột ngày trong cột nested.
    v1 nhận ra cột nested theo tên bảng có dấu chấm, nên cột chọn từ cây field hiện tại không bao giờ được thêm.
- **Backend local:** MySQL lỗi 500 (`No database selected`) với `between_and_including` trên cột datetime
  (`MySqlParser` sinh `toDateTime(...)` của ClickHouse). Range custom và comparison custom vì vậy chưa chạy được trên
  stack local; các mode tương đối chạy được.

## Quyết định ở CB7b1 (2026-10-28)

CB7b chia thành: **CB7b1** style của table (Style, Grid, Header, Values, Tooltip) cùng renderer; **CB7b2** Field
formatting và Conditional formatting; **CB7b3** Collapse Table; **CB7b4** Pivot Table.

- **Renderer** (`features/dashboard/charts/table/tableStyle.utils.ts`, v1 `TableStyleUtils.getTableSettingStyle`):
  options thành biến CSS trên table. Màu đã lưu thường chính là biến của theme (`var(--header-background-color)`), nên
  v2 đặt tên biến riêng (`--ft-*`) thay vì đổi sang hex như v1 (`parseColor`). Đọc: font, màu, cỡ, căn lề, nền và text
  wrap của header; màu và nền của dòng chẵn / lẻ, font, cỡ, text wrap của dòng; đường grid dọc (header, body), ngang
  (body), row padding; nền card; title và subtitle (font, màu, cỡ, căn lề, trước đây chưa áp).
  - Header căn lề theo option như v1, không theo kiểu cột; ô số trong body vẫn căn phải.
  - Header dính có màu trong suốt thì vẽ đè lên nền card, để dòng cuộn bên dưới không lộ ra. v1 trộn màu
    (`combineColor`).
  - Phân trang lấy màu chữ của header như v1.
- **Tooltip của ô** (v1 `TableTooltipUtils`): mọi ô header và body có chữ hiện toàn bộ nội dung sau 1 giây, màu và
  font theo `tooltip.*`. Tooltip mở trong `.dashboard-theme`, nên màu là biến theme vẫn có tác dụng.
- **Tab Settings** theo thứ tự v1: Title, Style, Grid, Column headers, Values, Background, Tooltip, Other.
  - Style: 6 theme của v1 (bản light, `settings/table/tableThemes.json`). Chọn theme ghi tên theme và mọi setting của
    nó; Revert về Default.
  - Grid: màu, độ dày, bật ở Header / Body cho đường dọc, Body cho đường ngang.
- **Khác v1:**
  - Bỏ các toggle Total và Header của đường ngang: table phẳng không có dòng total và chỉ có một dòng header, nên
    trong v1 chúng không có tác dụng.
  - Theme không ghi các key mà không ai đọc (`total.*`, `value.is_word_wrap`, `value.style.align`,
    `value.style.color`); font `Arial` ghi thành `Arial, sans-serif` cho khớp lựa chọn.
  - Revert của Values ghi đúng biến theme. v1 ghi `var(----row-even-background-color)` (dòng thành trắng) và
    `--row-odd-background-color` (dòng trong suốt).
  - Revert của Grid và Tooltip về giá trị của table mới. v1 về grid của theme tối và màu chữ khác.
  - Danh sách theme không phụ thuộc theme sáng / tối của dashboard (v1 lấy theo base theme; với custom thì rỗng). Hai
    bản chỉ khác grid của Default.

## Quyết định ở CB7b2 (2026-10-28)

Field formatting và Conditional formatting của table phẳng.

- **Phát hiện:** trên table phẳng, v1 không bao giờ vẽ Background, Font color và Icon. v1 xin server các cột phụ
  (`formatters`), nhưng `table_chart_setting` bỏ qua chúng (đã thử trên backend local). Chỉ Data bar chạy, vì nó chỉ
  cần min / max của cột (`min_max_values`, theo tên cột, tính trên toàn bộ kết quả). v2 nay đọc `min_max_values`.
- **Lựa chọn (2026-10-28):** v2 tính Background, Font color và Icon ở client, từ giá trị của chính ô và min / max của
  cột, khi formatting bật, trên field của chính cột, theo color scale hoặc rules, và áp cho values. Formatting theo
  field khác hoặc theo Field value vẫn không vẽ được.
- **Renderer** (`charts/table/tableFormatting.utils.ts`, `columnDecorations.tsx`):
  - Formatting tìm theo `vizKey(tên cột)`, đúng key v1 ghi. v1 còn khớp theo tiền tố, nên cột "sales" lấy formatting
    của "salesAmount"; v2 chỉ khớp đúng tên.
  - Field formatting: display unit và precision riêng của cột, đè lên của table; màu, nền, căn lề cho values / header
    khi bật Apply to.
  - Color scale: trộn RGB tuyến tính giữa min, center (nếu bật) và max, với giá trị custom; ô trống theo Default
    formatting. Màu không phải hex (biến theme) thì lấy màu gần hơn.
  - Rules: rule đầu tiên khớp thắng; `>` / `>=` cần thêm `<` / `<=`; `=` so một giá trị; percent so vị trí trong
    min / max; `blank` khớp chữ, còn ô trống tính là 0 như v1.
  - Data bar: thanh âm và dương hai phía trục, theo min / max (hoặc custom), trái sang phải hoặc ngược lại; trục chỉ vẽ
    khi màu không trong suốt. Icon: theo rules, bên trái, phải hoặc chỉ icon, căn trên / giữa / dưới.
- **Tab Settings** (sau Values, như v1):
  - Field formatting: chọn cột, màu chữ, nền, căn lề, Apply to header / values (bật thì lưu luôn màu và căn lề đang
    hiện, như v1), display unit, precision.
  - Conditional formatting: chọn cột số; bật / tắt Background color, Font color, Data bars, Icons; "Advanced controls"
    mở dialog: color scale hoặc rules, data bar, icon (6 style của v1 đặt sẵn rules). Lưu khi các số hợp lệ.
  - Bật một formatting chưa có thì dùng default trên field của chính cột (v1 làm vậy với cột số / aggregate).
- **Khác v1:**
  - Chỉ cột số (số hoặc aggregate) có conditional formatting, vì chỉ chúng có min / max. Bỏ "Format by field value" và
    "Based on field" khác: không vẽ được trên table phẳng.
  - Bỏ Apply to total của Field formatting: table phẳng không có dòng total.
  - Revert của Field formatting xoá display unit và precision của cột để theo table; v1 ghi None và 2.
  - Bật lại Data bar giữ setting cũ; v1 reset về default.
  - Renderer kiểm `enabled`; v1 dựa vào việc formatter tắt không được gửi.
  - Icon là chữ trong React; v1 chèn emoji bằng HTML (có thể bị XSS từ setting).
  - Danh sách icon cho rule gồm icon của 6 style; v1 có khoảng 300 emoji.

## Các bước

| Bước | Phạm vi | Trạng thái |
|---|---|---|
| CB0 | **Payload thật.** Dashboard "v2 Builder" (id 3) tạo bằng builder v1 trên backend local (điều khiển bằng Playwright), lưu thành `core/chart-builder/builder.fixture.json`. Gồm: column (Average, đổi display name, sort Descending với top 10, filter `in`, inner filter), line (date histogram, Count distinct, legend), area, bar, pie, donut, number, flatten table, 8 filter widget và một column có filter gắn chart control | Xong |
| CB1 | **`core/chart-builder`.** Entity `FunctionData`, `ConditionData`, `extra_data`. Danh mục chart (v1 `DataBuilderConstantsV35`: zone, số item tối đa, function mặc định theo kiểu field). Builder cho function (function, table column, order by, top N, dynamic function), condition và query setting. Viz options mặc định và cách merge khi đổi loại chart. Test bằng CB0: từ `extra_data` của 19 widget, dựng lại `setting` và default options phải khớp hoàn toàn (`toStrictEqual`) với body mà v1 đã gửi | Xong |
| CB2 | **Reducer của builder** (`features/chart-builder`). Khởi tạo từ widget hoặc rỗng. Đổi loại chart (`latestState` và chuyển config như v1). Thêm / sửa / xoá / đổi thứ tự config. Filter theo nhóm. Function convertor (table; scatter và bubble đi cùng type của chúng ở CB7). Setting dẫn xuất từ state. Dọn options khi xoá function để lại CB7 | Xong |
| CB3 | **Cây field** (chỉ đọc). Chọn database (`GET databases`), bảng và cột có search và icon theo kiểu, mở sẵn các bảng đang dùng, cột kéo được, các chart control của dashboard | Xong |
| CB4 | **Config panel.** Zone theo loại chart (luật của `shared/field-dnd`). Menu của item (function family và type, sorting, display name, top N, display as column). Zone Sorting. Zone Filter có nhóm AND/OR và trình sửa condition (giá trị cột lấy từ server, chế độ Manual Input hoặc Chart Control). Display as column để lại CB7 | Xong |
| CB5 | **Ghép lại.** `ChartBuilderModal` (Cancel / Add / Update, tab Builder và Settings), picker loại chart, preview (`ChartRenderer` / `FilterRenderer`). Lưu: tạo mới đặt ở -1/-1 như M6, cập nhật, cache qua `useDashboardEditor`. Hỏi xác nhận khi rời. Truyền `ChartBuilderBridge` cho route dashboard. Inner filter thêm / sửa / xoá trong menu của chart. Chọn field bằng menu bảng / cột ("click here", click tên để đổi field). So với v1 bằng screenshot Playwright | Xong |
| CB6 | **Tab Settings**, ghi vào `setting.options` qua `vizOptions`. (a) Các tab chung (Title, Background, Tooltip, Visual header, Color) và series (General, Display, Legend, trục X / Y, dual axis, Data label). (b) Pie, number, table. (c) Filter widget và giá trị mặc định của chúng | Xong. Table chỉ có tab chung; các tab style của table và tab Comparison của Number làm ở CB7 |
| CB7 | **Các loại chart khác.** Mỗi loại gồm renderer, builder handler và settings, làm cùng các loại chart của Phase 3. Chia theo thứ tự của `MIGRATION.md` (chọn 2026-10-28): **CB7a** Number: comparison và trend line (tab Comparison), xong. **CB7b** Tab style của table (Style, Grid, Header, Values, Field formatting, Conditional formatting, Tooltip) cùng renderer, Collapse Table, Pivot Table: CB7b1 (style), CB7b2 (field và conditional formatting) xong. **CB7c** Stacked Column / Bar, Circular Bar, Lollipop. **CB7d** Scatter, Bubble, Area Range, Column Range. **CB7e** Funnel, Pyramid, Variable Pie, Parliament, Word Cloud, Tree map, Heat map, Gauges, Bullet. **CB7f** Pareto, Bell curve, Histogram, Spider web, Wind rose, Sankey, Line stock. Map có thiết kế riêng | Chưa làm |
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
