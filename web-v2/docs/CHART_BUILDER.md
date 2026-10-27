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

## Các bước

| Bước | Phạm vi | Trạng thái |
|---|---|---|
| CB0 | **Payload thật.** Dashboard "v2 Builder" (id 3) tạo bằng builder v1 trên backend local (điều khiển bằng Playwright), lưu thành `core/chart-builder/builder.fixture.json`. Gồm: column (Average, đổi display name, sort Descending với top 10, filter `in`, inner filter), line (date histogram, Count distinct, legend), area, bar, pie, donut, number, flatten table, 8 filter widget và một column có filter gắn chart control | Xong |
| CB1 | **`core/chart-builder`.** Entity `FunctionData`, `ConditionData`, `extra_data`. Danh mục chart (v1 `DataBuilderConstantsV35`: zone, số item tối đa, function mặc định theo kiểu field). Builder cho function (function, table column, order by, top N, dynamic function), condition và query setting. Viz options mặc định và cách merge khi đổi loại chart. Test bằng CB0: dựng lại từ `extra_data` phải ra đúng `setting` mà v1 đã lưu | Chưa làm |
| CB2 | **Reducer của builder** (`features/chart-builder`). Khởi tạo từ widget hoặc rỗng. Đổi loại chart (`latestState` và chuyển config như v1). Thêm / sửa / xoá / đổi thứ tự config. Filter theo nhóm. Function convertor (table, scatter, bubble). Dọn options khi xoá function. Setting dẫn xuất từ state | Chưa làm |
| CB3 | **Cây field** (chỉ đọc). Chọn database (`GET databases`), bảng và cột có search và icon theo kiểu, mở sẵn các bảng đang dùng, cột kéo được, các chart control của dashboard | Chưa làm |
| CB4 | **Config panel.** Zone theo loại chart (luật của `shared/field-dnd`). Menu của item (function family và type, sorting, display name, top N, display as column). Zone Sorting. Zone Filter có nhóm AND/OR và trình sửa condition (giá trị cột lấy từ server, chế độ Manual Input hoặc Chart Control) | Chưa làm |
| CB5 | **Ghép lại.** `ChartBuilderModal` (Cancel / Add / Update, tab Builder và Settings), picker loại chart, preview (`ChartRenderer` / `FilterRenderer`). Lưu: tạo mới đặt ở -1/-1 như M6, cập nhật, cache qua `useDashboardEditor`. Hỏi xác nhận khi rời. Truyền `ChartBuilderBridge` cho route dashboard. Inner filter thêm / sửa / xoá trong menu của chart. So với v1 bằng screenshot Playwright | Chưa làm |
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
