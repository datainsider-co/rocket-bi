# Organization Settings và DataSource Config

Tài liệu sống của việc migrate Organization Settings (Phase 6 trong [`MIGRATION.md`](MIGRATION.md)), gồm cả trang
DataSource Config. Cập nhật cột **Trạng thái** khi một bước xong.

## v1 hoạt động thế nào

- **Quy mô**: `screens/organization-settings` (khoảng 60 file), `screens/user-management` (18 file), cộng
  `di-core/admin`, `di-core/organization`, `di-core/connector-config`, `di-core/billing` (khoảng 3.3k dòng). Tổng khoảng
  13.7k dòng UI. Nặng nhất: `ContactDetailsForm.vue` (581), `APIKeyManagement.vue` (542), `PlanAndBilling.vue` (454),
  `ConnectorConfig.vue` (413).
- **Route**: `/settings/organization` có sidebar, redirect về `overview`. Con: `overview`, `user-management`,
  `user-management/:username`, `token-management`, `user-activity` (không có trong sidebar), `sso`,
  `system-monitor/{query-usage,user-usage}`, `clickhouse-config`, `plan-and-billing`, `plan-and-billing/detail`.
- **Sidebar**: Overview, User Managements, SSO Config, System Monitor (ẩn khi `VUE_APP_IS_DISABLE_USER_ACTIVITIES`),
  DataSource Config (ẩn khi thiếu `organization:manage:connection`), Plan Detail & Billing, API Key Management. Ngoài
  hai mục đó, client không chặn gì theo quyền; chỉ server chặn. `removeRouters` trong `Router.ts` không có tác dụng
  (lọc ra mảng mới rồi bỏ), nên route vẫn mở được bằng URL.
- **Client HTTP**: User, quyền, API key, SSO, organization đi qua CaasClient; activity, `/user-data`, `/license`,
  `/contact_us` là route của BI server. Local docker dùng chung một host nên v2 không cần tách client (đã vậy từ
  trước).

### Từng trang

| Trang | v1 làm gì | API (tên field phía server) |
|---|---|---|
| Overview | Logo, tên công ty, version build, dòng "Delete Organization" bị disable vĩnh viễn. Đổi tên (rename modal: bắt buộc, ≤ 250 ký tự, không có `/ \ " ? * > < : \|`), đổi logo (một ô URL, có preview, không upload) | `GET /organizations/my-domain`; `PUT /organizations` `{name, thumbnail_url}` (cần `organization:edit:*`) |
| DataSource Config | Bảng một dòng: cột theo loại connection (ClickHouse: Host, Username, HTTP Port, TCP Port; BigQuery: Project ID, Location; JDBC: Host, Port, Username, ...), Updated Time, Status của lần refresh schema, nút Change / Edit. Header: icon loại, tên, Update Schema, Refresh. Rỗng: "No DataSource yet, Click here". Mở trang khi setup chưa xong thì tự bật modal tương ứng | `connection/*` (đã port trong `core/connection`) |
| User Managements | Bảng phân trang 20: #, Owner (avatar + tên), First Name, Last Name, Email, Status (Active / Suspended). Search debounce 300 ms, Refresh, "New User", "Login Method". Click dòng → trang chi tiết | `POST /admin/users/search/v2?from&size&keyword` (body rỗng; server mặc định `user_type=user`, nên ẩn user của API key) |
| New User | Email, First Name, Last Name, Role (Editor / Viewer, mặc định Viewer), Password (≥ 6), Confirm. `email_existed` báo lỗi tại chỗ. Tạo xong gán quyền ban đầu rồi mở trang chi tiết | `POST /admin/users/create` `{email, password, full_name, first_name, last_name, user_group}`, rồi `PUT /admin/permissions/{u}/change` |
| User detail | Header: avatar, tên, `user_group`, Active / Suspended, email, ngày tạo; Reset Password, Delete User, Suspend / Unsuspend, View Profile. Profile sửa từng field, lưu ngay: full name, first, last, mobile, avatar (URL), role, gender, ngày sinh; Attributes (thêm / sửa / xoá property). Bên phải: Privileges hoặc Delete | `GET /admin/users/{u}`; `PUT /admin/users/{u}` (một field mỗi lần); `PUT /admin/users/{u}/property` `{properties, deleted_property_keys}`; `POST /admin/permissions/{u}/group` `{user_group}`; `POST /admin/users/{u}/activate` / `deactivate`; `PUT /admin/users/{u}/reset_password` |
| Privileges | Nhóm quyền cứng ở client (Organization, User Management, Billing, Ingestion DataSource, Ingestion Job, Data Warehouse, Insights, DataCook, API Key), mỗi nhóm có ô "All" khi có quyền sudo. Save gửi toàn bộ trạng thái | `POST /admin/permissions/{u}/is_permitted` `{permissions}` → map `{perm: bool}` (key là data); `PUT /admin/permissions/{u}/change` `{include_permissions, exclude_permissions}` |
| Delete user | Radio: chuyển dữ liệu cho user khác (gợi ý email) hoặc không chuyển. Xong thì `router.back()` | `DELETE /user-data/{u}` `{username, transfer_to_email?}` (BI: chuyển hoặc xoá dashboard / thư mục rồi mới xoá user). `DELETE /admin/users/{u}/delete` chỉ xoá user caas, không đụng dữ liệu BI |
| SSO Config | Bảng login method (chỉ tạo được Google): Name, Type, Active, toggle Active / Inactive, xoá. Form Google: Name, Client Id, whitelist domain (chip, lowercase, không trùng). Search phía client | `GET /user/auth/login_methods` → `{gg: {name, oauth_type, client_ids, whitelist_email, is_active, organization_id, valid}}`; `PUT /admin/setting/login_methods` `{gg: {...}}`; `DELETE /admin/setting/login_methods/{type}` (cần `login_method:manage`) |
| Login Method (User Managements) | Modal thứ hai sửa đúng config Google đó: toggle, Client Id, whitelist | Như SSO |
| API Key Management | Bảng: Name, API key (copy), Expired Date, sửa, xoá. Search, phân trang 20. Modal: tên, ngày hết hạn, Privileges (cùng editor với user, bỏ nhóm API Key). `expired_time_ms` = startOfDay(ngày chọn) − startOfDay(`created_at`), mặc định 365 ngày | `POST apikey/list` `{keyword, from, size}`; `POST apikey` `{display_name, expired_time_ms, permissions}`; `GET apikey/{key}` (permissions có tiền tố `<orgId>:`); `PUT apikey/{key}` `{api_key, display_name, expired_time_ms, include_permissions, exclude_permissions}`; `DELETE apikey/{key}` |
| User Activity | Chỉ mở bằng URL. Lịch theo khoảng ngày (mặc định 7 ngày), lọc user, loại hành động, loại tài nguyên. Nhóm theo ngày, mở dòng ra xem path, request / response dạng cây JSON | `POST /query/activities` `{usernames, action_types, resource_types, from, size, start_time, end_time}` (cần `user_activity:view:*`) |
| System Monitor | Query Usage: **mock**, `MockQueryUsageRepository` trả 10 dòng cứng, không gọi API nào. User Usage: bảng User / Action / Execute at, cũng gọi `/query/activities` | — |
| Plan & Billing | Trial countdown, thẻ plan, mua qua PayPal, redeem code, cancel, Contact Us. `plan-and-billing/detail` là UI giả hoàn toàn | `/billing/*` trên license server ngoài (`license.rocket.bi`); server open source không có route `/billing/*`, chỉ có `GET /license`, `POST /contact_us` |

### Anti-pattern và bug của v1 (không mang sang)

- Convert snake / camel toàn cục làm hỏng key attribute của user ("My Field" thành `my_field`; xoá thì gửi
  `snakeCase(camelKey)`), và có thể làm hỏng key của map `is_permitted` nếu không có `parsePureJson`.
- Danh mục quyền viết cứng ở client với format lẫn lộn (`login_method:manage` chỉ hai phần, nhóm "DataCook " có dấu
  cách thừa); Save gửi toàn bộ include / exclude nên ghi đè quyền đổi ở nơi khác.
- Tạo Viewer: quyền ban đầu (`insight:*:view`, `query_analysis:*:view`) không nằm trong nhóm nào nên bị lọc mất, Viewer
  được lưu với include rỗng và exclude mọi thứ. Gán quyền lỗi sau khi user đã tạo thì báo "Create new user failed!".
- Delete user: radio mặc định "Transfer" mà ô email trống thì xoá sạch dữ liệu không hỏi; email gõ tay không kiểm tra
  có phải user thật; câu chữ của lựa chọn "Don't transfer" sai.
- Đổi role đọc `res.isSuccess` nhưng server trả `success`; ngày sinh gọi API hai lần (`@input` và `@Watch`); sửa
  profile không rollback khi lỗi.
- Reset Password hiện mật khẩu mặc định lấy từ config client (`VUE_APP_DEFAULT_PASSWORD`).
- Modal API key và SSO đóng trước khi request xong, lỗi không hiện; `createToken` không bắt lỗi; ngày hết hạn ở quá khứ
  cho `expired_time_ms` âm vẫn qua; DOM id trùng làm hỏng tooltip copy.
- SSO: tải lỗi thì hiện "You don't have any SSO yet"; hai modal (SSO, Login Method) sửa cùng một config; giao tiếp qua
  EventBus toàn cục.
- Overview: đổi logo lỗi vẫn đóng modal. System Monitor: `v-if` Activity / Resource đảo nhau, kiểm `s` hai lần thay vì
  `e`, filter Resource ghi vào Activity.
- Store Vuex singleton giữ `selectedUsername` giữa các màn; modal API key mượn `UserDetailModule`.

## Kiểm tra backend local (2026-11-04)

- Có route trên server: `admin/users/*`, `admin/permissions/*` (gồm `statistics` → `{num_viewers, num_editors}`, v1 không
  dùng), `admin/setting/login_methods`, `organizations` (`my-domain`, `PUT`), `apikey/*`, `query/activities`,
  `user-data/{u}`, `license`, `contact_us`. Không có `billing/*`.
- `GET /organizations/my-domain` → `{organization_id, owner, name, domain, is_active, report_time_zone_id, created_time,
  updated_time, updated_by, licence_key}` (`thumbnail_url` vắng khi chưa đặt). Khớp `core/user/Organization`.
- `POST /admin/users/search/v2` → `{total, data: [{user: {username, roles, is_active, created_time, permissions}, profile:
  {username, full_name, first_name, last_name, email, mobile_phone, gender, avatar, already_confirmed, properties,
  updated_time, created_time}}]}`. Username không phải email (`root` / `hello@gmail.com`); route chi tiết dùng username.
- `GET /admin/users/root` trả `user.permissions` có tiền tố org (`0:directory:view:14`, `0:*:*:*`).
- `POST /admin/permissions/root/is_permitted` → `{"organization:manage:connection": true, ...}`, key giữ nguyên chuỗi
  quyền.
- `GET /admin/permissions/{u}/group` → `{user_group: "None"}` cho root.
- `GET /user/auth/login_methods` → `{gg: {..., valid: true}}`, có sẵn một Google client id, `is_active: false`.
- `POST /query/activities` có 856 dòng; mỗi dòng có `event_id, timestamp, username, action_name, action_type,
  resource_type, message, method, path, param, status_code, request_content, response_content, ...`.
- `POST /apikey/list` → `{data: [], total: 0}`.
- Server có 6 loại connection: `clickhouse_connection`, `mysql_connection`, `bigquery_connection`
  (`project_id, credentials, location?`), `postgresql_connection` (`host, port, username, password, database,
  properties`), `redshift_connection`, `vertica_connection` (có `tunnel_config`, `properties`). v2 mới làm hai loại đầu.

## Phát hiện ở OS0 (2026-11-04)

Chạy trên docker local. Request và response lưu ở `src/core/admin/admin.fixture.json` và
`src/core/connection/connectionTypes.fixture.json` (password thay bằng `<password>`). Dữ liệu để lại cho các bước sau:
user `os0.editor@example.com` (Editor) và `os0.viewer@example.com` (Viewer), password `123456`.

- **Tạo user**: `{user_info, user_profile}`; email trùng là 400 `email_existed`. User mới không có quyền nào trong danh
  mục; `user.permissions` chỉ có quyền license: Editor `0:edit_data`, `0:view_data`, Viewer `0:view_data`.
  `GET /admin/permissions/{u}/group` → `{user_group}`; root là `None` (chủ organization, có `0:*:*:*`).
- **Quyền**:
  - `is_permitted` trả quyền **hiệu lực**: có `user:*:*` thì `user:view:*` cũng true.
  - Exclude một quyền con khi đang có sudo không có tác dụng (con vẫn true qua wildcard). Bỏ một con trong nhóm đang
    "All" phải exclude sudo và include các con còn lại.
  - Quyền **lưu thật** nằm ở `GET /admin/users/{u}` → `user.permissions`, có tiền tố org (`0:user:view:*`), lẫn quyền
    license và quyền theo tài nguyên (`0:directory:view:14`). Save tính phần thay đổi so với tập này, chỉ trong danh mục.
  - `PUT .../change` trả `true`. Viewer nhận quyền không có `:view:` → 400 "Target user is not an editor, can not be
    assigned edit permissions." cho cả request. Gửi `view_data` / `edit_data` → 400.
  - Đổi group (`POST .../group` → `{success: true}`) Editor → Viewer chỉ bỏ `edit_data`; quyền edit đã gán vẫn còn
    (`database:*:*` vẫn true).
  - Server chỉ kiểm `query_analysis:download:*` trong các quyền v1 gán lúc tạo; `insight:*` không được kiểm ở đâu (cả
    client).
- **Profile**: `PUT /admin/users/{u}` lấy username từ path, nhận nhiều field một lần, chỉ field gửi lên bị đổi; `avatar:
  ""` xoá avatar; `gender` là số (-1 chưa đặt), `dob` epoch ms. Trả về profile đầy đủ.
- **Properties**: key giữ nguyên văn (`My Field`, `ssl.mode`). `properties` gửi lên được **gộp** vào cái đang có,
  `deleted_property_keys` xoá; không cần gửi lại cả map như v1.
- **Search**: `search/v2` bỏ qua `is_active`; `user_type=api_key` lọc được user của API key. `user/profile/suggest` →
  `{total, data: [profile]}`.
- **Suspend**: `deactivate` / `activate` trả `true`; list thấy `is_active: false`.
- **Reset password**: `{is_success: true}`; đăng nhập được bằng `di@123456` (default của server).
- **Xoá user** (`DELETE /user-data/{u}` → `{success: true}`): có `transfer_to_email` thì thư mục của user còn (chuyển
  sang người nhận), không có thì thư mục bị xoá (404). Email không tồn tại → 404 "User with email … is not found", không
  thay đổi gì, user vẫn còn. `owner` của `GET /directories/{id}` luôn là `root` nên không dùng để kiểm tra.
- **Login methods**: `PUT` trả cả map; `valid` là field server tự tính, không gửi lên.
- **Connection**: test lỗi là 500 kèm message của driver. Image server **thiếu driver Redshift** ("Failed to load driver
  class com.amazon.redshift.jdbc42.Driver"), nên Redshift không test / lưu được trên stack này; vẫn port form (ghi nợ
  backend). BigQuery: `credentials` là JSON service account, thiếu `type` thì lỗi. Stack local không có PostgreSQL,
  Vertica, BigQuery nên chỉ kiểm được shape request và lỗi. `GET /connection` trả password plaintext.

## Quyết định (2026-11-04)

- **Phạm vi: chỉ DataSource Config và User Managements** (danh sách, New User, chi tiết, privileges, xoá user, modal
  Login Method). Overview, SSO Config, System Monitor, User Activity, API Key Management, Plan & Billing và Contact Us
  **không làm** đợt này. Sidebar chỉ có hai mục; các path v1 còn lại rơi vào Not found.
- Các mục dưới đây là đề xuất mặc định cho phần trong phạm vi; đổi được khi bắt đầu từng bước.
- **Chặn theo quyền ở client**: sidebar và route kiểm bằng `is_permitted` (đã có `core/permission/PermissionService`).
  Users: `user:view:*`; DataSource: `organization:manage:connection`. Nút trong trang ẩn / disable theo quyền tương ứng
  (`user:create:*`, `user:edit:*`, `user:suspend:*`, `user:reset_password:*`, `user:delete:*`, `permission:assign:*`,
  `login_method:manage`). `/settings/organization` redirect về mục đầu tiên user được xem.
- **Login Method**: giữ modal của User Managements (form Google: bật / tắt, Client Id, whitelist domain), vì trang SSO
  không làm. Đóng modal chỉ khi lưu xong; lỗi hiện trong modal.
- **Privileges editor** (`features/organization/users/privileges`): danh mục nhóm quyền là data thuần trong
  `core/admin/permissionGroups.ts` (sửa tên "DataCook"), logic "All" là hàm thuần có test. Ô tick hiện quyền hiệu lực
  (`is_permitted`). Save dựng tập quyền đích (nhóm tick đủ thì chỉ sudo, không thì từng con) và chỉ gửi phần **thay
  đổi** so với quyền lưu thật trong danh mục (include = mới thêm, exclude = bị bỏ), không ghi đè quyền khác. Chuyển lên
  `shared/` khi API Key được làm.
- **Tạo user**: server không tự gán quyền nào trong danh mục theo `user_group` (OS0). v2 gửi quyền ban đầu như v1 làm
  được thật: Editor `insight:*:*`, `query_analysis:*:*` (thứ duy nhất có tác dụng là download kết quả query); Viewer
  không có gì (quyền Viewer của v1 không có `:view:` ở giữa nên server từ chối). Lỗi sau khi user đã tạo vẫn mở trang chi
  tiết và báo phần lỗi.
- **Viewer chỉ nhận quyền có `:view:`** (server trả 400 cho cả request nếu có quyền khác). Editor quyền disable các quyền
  còn lại khi user là Viewer, kèm tooltip. Hạ Editor xuống Viewer: server giữ nguyên quyền edit, nên v2 hỏi xác nhận rồi
  exclude luôn các quyền không có `:view:` mà user đang giữ.
- **Delete user**: giữ `DELETE /user-data/{u}` (chuyển dữ liệu). Chọn "Transfer" thì bắt buộc chọn user từ gợi ý (không
  phải chuỗi gõ tay); "Don't transfer" phải xác nhận rõ là xoá dữ liệu. Xong thì về danh sách.
- **Reset Password**: server đặt về `default_password` trong config của server (mặc định `di@123456`), response không
  trả giá trị này. v2 báo "đã đặt về mật khẩu mặc định của server" và chỉ in giá trị khi có `VITE_DEFAULT_PASSWORD`
  (v1 luôn in giá trị từ config client, có thể lệch với server).
- **Attributes**: `properties` là data, giữ key nguyên văn. Sửa luôn bug `Deneric.Map(String)` của `UserProfile.properties`
  (key có dấu chấm thành object lồng) đã ghi trong memory.
- **Sửa profile**: một form react-hook-form + zod với Save / Cancel thay vì lưu từng field; một request `PUT
  /admin/users/{u}` gửi các field đổi; role vẫn là request riêng. Avatar vẫn là URL (server không có upload).
- **DataSource Config**: một card mô tả connection (loại, các field theo loại, Updated Time, trạng thái refresh) thay
  bảng một dòng. Change / Edit / Update Schema / Refresh dùng lại modal của `features/data-source/setup` (chuyển phần
  dùng chung lên `features/data-source/` nếu cần). Loại v2 chưa hỗ trợ: hiện read-only kèm Change.
- **Thêm 4 loại connection** PostgreSQL, Redshift, Vertica, BigQuery vào `core/connection` và registry fields
  (`ConnectionFieldsFactoryBuilder`); BigQuery có danh sách location (port `locations.json`) và credentials JSON.
- **Vị trí code**:

  ```
  src/core/admin/             UserAdminService, PermissionAdminService, permissionGroups, LoginMethodService, AdminModule
  src/core/connection/        + PostgreSql, Redshift, Vertica, BigQuery
  src/features/organization/  layout/, users/ (list, new-user, login-method, detail, privileges, delete)
  src/features/data-source/   setup/ (đã có), config/ (trang DataSource Config)
  ```

## Quyết định khi làm (2026-11-04)

- **Route**: `/settings/organization` mở mục đầu tiên user được xem (v1 về Overview, chưa migrate); không được xem mục
  nào thì báo không có quyền. Mỗi trang tự kiểm quyền (`PermissionGate`); quyền của user đang đăng nhập hỏi một lần
  (`useOrganizationPermissions`), lưu cache đến khi Privileges được lưu.
- **Danh sách user**: dùng `useListingState` chung (sort giả, không gửi: server không sort user). "Users not found" cho
  trang rỗng, có search hay không, như v1.
- **Không tự thao tác lên chính mình**: trang của chính mình không có Suspend, Delete và đổi role (v1 có). Chủ
  organization (group `None`) không đổi role được.
- **Role**: chọn trong phần Profile, hỏi xác nhận; hạ xuống Viewer thì liệt kê và exclude các quyền không có `:view:`.
- **Privileges**: ô của Viewer với quyền không có `:view:` bị disable kèm tooltip, trừ khi đang được tick (để bỏ được
  quyền còn sót từ lúc là Editor). Có thêm nút Reset bỏ các thay đổi chưa lưu. Lưu xong thì hỏi lại mọi quyền
  (`['permission']`), vì admin có thể vừa sửa quyền của chính mình.
- **Profile**: một modal Edit Profile (Name, First / Last Name, Mobile Phone, Gender, Date of Birth, Avatar URL), gửi
  một request với các field đã đổi. Date of Birth lưu đầu ngày theo giờ trình duyệt.
- **Attributes**: thêm và sửa trong một modal (đổi tên = thêm tên mới, xoá tên cũ trong cùng request), xoá có xác nhận;
  tên trùng báo lỗi tại chỗ (v1 ghi đè).
- **Xoá user**: ô chọn người nhận tìm qua `user/profile/suggest` (`shared/user/useUserSearch`, chuyển từ Share lên),
  bỏ chính user bị xoá; xoá xong về danh sách.
- **Reset Password**: `VITE_DEFAULT_PASSWORD` có trong `.env.development` (`di@123456`, default của server local).
- **DataSource Config**: trang không tự mở modal (first-run setup trong `AppLayout` đã lo); Edit có nút "Cancel" thay
  "Back"; modal chọn loại có "Cancel" thay "Skip"; trạng thái refresh poll 2 s khi đang chạy, có hiện message lỗi (v1
  không hiện). `connectionQueryOptions` lưu `null` cho loại không đọc được (trước đây query lỗi làm first-run setup bị
  ẩn).

## Các bước

| Bước | Phạm vi | Trạng thái |
|---|---|---|
| OS0 | **Payload thật.** Trên docker local: tạo user Editor và Viewer rồi đọc `is_permitted` (server có tự gán quyền theo group?), reset password (mật khẩu mới là gì), suspend, sửa profile và property có key chứa dấu chấm / dấu cách, `user-data` delete có và không transfer, `login_methods` put. Lưu request / response của 4 loại connection mới. Lưu fixture | Xong |
| OS1 | **Core.** `core/admin` (UserAdminService, PermissionAdminService, LoginMethodService, DiModule); `permissionGroups` và logic "All" thuần có test; sửa `UserProfile.properties`; test round-trip với fixture OS0 | Xong |
| OS2 | **Khung.** Routes ở path của v1 (`/settings/organization/user-management[/:username]`, `/settings/organization/clickhouse-config`), `OrganizationSettingsLayout` + sidebar hai mục theo quyền (theo pattern `IngestionSidebar`), redirect `/settings/organization` | Xong |
| OS3 | **Trang DataSource Config.** Card connection, trạng thái refresh, Update Schema, Refresh, Change / Edit qua modal setup, trạng thái rỗng, mở đúng modal khi setup dở như v1 | Xong |
| OS4 | **Thêm loại connection.** PostgreSQL, Redshift, Vertica, BigQuery: model, fields, test connection; bật trong modal chọn loại | Xong |
| OS5a | **Danh sách user.** Bảng phân trang, search, refresh, New User (zod, `email_existed` tại chỗ), modal Login Method | Xong |
| OS5b | **Chi tiết user.** Header, suspend / unsuspend, reset password, form profile, role, attributes | Xong |
| OS5c | **Privileges.** Editor nhóm quyền, save theo phần thay đổi | Xong |
| OS5d | **Xoá user.** Transfer chọn từ gợi ý hoặc xoá dữ liệu có xác nhận | Xong |

Thứ tự: OS0 → OS1 → OS2, rồi hai nhánh song song (thư mục riêng): OS3 → OS4 và OS5a → OS5b → OS5c → OS5d.

Không làm đợt này: Overview, SSO Config, System Monitor, User Activity, API Key Management, Plan & Billing (xem bảng
"Từng trang" ở trên nếu cần làm sau).
