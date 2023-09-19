# CHANGELOG

### v23.09.18 2023-09-18

#### New Features

- [DataCook] Support send excel file to email
- [Ingestion] Support ingest data from google search console

### Bug Fixes

- [Query Editor] Execute query error limit 1000 when query has limit
- [Query Editor] Cannot suggest table name, column name in create measure field & calculate field
- [Query Editor] Cannot visualize when switch to another chart type
- [Query Editor] Insert query params error
- [Query Editor] Suggest syntax mysql incorrect
- [Query Editor] Suggest syntax postgres incorrect
- [Input Filter] Duplicate event emit value in input filter
- [Dashboard] Area config in correct when change chart type

### v23.09.11 2023-09-11

#### New Features

- [Dashboard] Support setting border, background, width, height for dashboard
- [Widget] Support setting text style of primary text, secondary text, border, padding and background
- [Ingestion] Support ingest data from google search console
- [Payment] Support redeem code

#### Enhancements

- [KPI] Support theme for KPI
- [Heatmap] Update new style for heatmap
- [Chart Builder] Move setting chart to right side
- [Chart Builder] Render default size of chart/filters in builder
- [Chart Builder] Update chart icon

### v23.08 2023-08-11

#### Breaking Changes

- Add ingestion features
- Add data cook features
- Remove implicit apply filter & implicit main date filter

#### New Features

- [Connection] Support MySql Connection
- [Connection] Support Postgres Connection
- [Connection] Support Redshift Connection
- [Connection] Support Vertica Connection
- [Connection] Support BigQuery Connection
- [Connection] Support Connection to database using SSH Tunnel
- [Chart] Support Donut Chart
- [Chart] Support Variable Pie Chart
- [Widget] New design for text widget
- [Filter] Support drag & drop filter, chart as chart control

### v3.0.1 2023-10-14

#### Breaking Changes

- Remove ingestion features (job, source, history)
- Remove data cook features

### v3.0.0 2023-07-13

#### Breaking Changes

- Add ingestion features (job, source, history)
- Add data cook features
- New UI Login, Register, Forgot Password

#### New Features

- [Ingestion] Support palexy connector
- [Share] Support share dashboard/analysis with download permission

#### Bug Fixes

- [DataCook] Cannot edit manage field in data cook
- [DataCook] Cannot update data type in manage field
- [Ingestion] Google sheet connector

### v2.1.0-rocket-bi-v2 2023-06-02

#### Breaking Changes

- Remove ingestion features (job, source, history)
- Remove data cook features

#### New Features

- [Sass] Support register organization
- Support input clickhouse connection

### v2.0.0-fat-fig-performance 2023-05-15

#### New Features

- [Dashboard] Support network chart
- [Dashboard] Support Tree Filter
- [Dashboard] Support Group Filter
- [Dashboard] Apply format number with setting thousand separator & decimal point for all chart
- [DataCook] Separate SQL & Python into 2 actions in menu

#### Enhancements

- [Backend] Migrate microservices to monolithic
- [Backend] Migrate schema from ssdb to MySQL
- [Dashboard] Update flow load dashboard & query data
- [Schema Management] Update flow load database & table
- [Web] Optimize build web, reduce size bundle & remove unused packages, unused code

#### Bug Fixes

- [Query Editor] Scroll incorrect in param listing
- [Query Editor] Incorrect data type of params when save query analysis
- [Data Cook] Support search in Manage Field.
- [Data Cook] Limit 10k row ETL
- [Data Cook] Support reload schema when schema source update
- [RLS] Table incorrect style
- [RLS] Refresh data after action create/edit/delete
- [RLS] Hide Chart Control when edit rls

### v1.4.19+1 2023-04-03

#### NEW FEATURES

- [Ingestion] Update ga3 job & source
- [Ingestion] Update ga4 job & source
- [Dashboard] Support table chart & collapse table

#### BUG FIXES

- Add id to widget for testing
- [Embedded Dashboard] Share With Password Protection Not Working
- [Dashboard] Fix slicer data return 0 when drag histogram date
- [Dashboard] Fig drag and drop measurement
- [Dashboard] Fix incorrect style date input in dashboard

### V1.4.19 2023-02-28

#### NEW FEATURES

- Forgot password
- Admin reset password
- Support multi delete source, job
- Show job queues listing in ingestion
- Show line number in query editor
- Show query analysis name in query editor when edit
- Support export csv in query editor
- [Query analysis] Support list in parameter
- [Query Analysis] Support readonly when view mode

#### BUG FIXES

- Cannot comment in query editor
- Cannot create database with vietnamese name
- Cannot share anyone, password production in query editor

### V1.4.18 2023-01-30

#### BUG FIXES

- [Bug] Unable to find dashboard to drill through
- [Bug] Cannot Save User Management Privileges
- [Bug] Slicer invalid date value
- [Bug] Dashboard cannot copy/duplicate with editor permission
- [Bug] Schema show duplicate dataset
- [Bug] Recent dashboard do not updated
- [Bug] User Create Organization does not have admin permission

#### NEW FEATURES

- Support Delete user & Transfer resource
- Support Copy Widget
- Support Copy Dashboard

### V1.4.17 2023-01-12

#### NEW FEATURES

- Duplicate a dashboard

### v1.4.16 2022-12-05

#### BUG FIXES

- Cannot rename Gauge Chart
- Cannot update inner chart filter

#### NEW FEATURES

- Required password to access to shared dashboard

### V1.4.15 2022-11-23

#### NEW FEATURES

- Add trigger with/without Others in Top N elements
- Support changing logo and company name of the organization

#### BUG FIXES

- Day of month and Day of week in Change date function show the wrong date
- Dark theme for filter is not correct
- Cannot remove chart from tab widget
- Changing the font size of the Data Label can be saved, but when refreshing the page, it won't update

### V1.4 2021-11-22

#### FEATURES

- Dashboard:
  - Widget:
    - Range Filter
    - Date Filter Data Ingestion:
- Support Google Sheet
- Support Google Analytics

#### UPDATE

- Enhance login with GG
- Cập nhật lại schedule time lúc tạo job
- Load filter khi vào filter

#### BUG FIXES

Dashboard

- Bị mất text Your dashboard is empty Click here to add your first chart khi đóng popup tạo chart
- [Table chart] Textbox bị ẩn nhưng vẫn nhập được text
- [Paliarment] Báo lỗi Cannot read property 'call' of undefined khi change display unit
- [Tất cả chart - Settings] Nút "Revert to default" sai UI
- [Table chart] Click revert to default tại setting Style -> bị revert lại hết toàn bộ setting
- Title chart hiển thị sai khi rename
- Bị chuyển về dark theme khi click "Revert to default" trong dashboard setting
- Chưa hiển thị popup confirm khi remove một dashboard
- Chưa hiển thị thông tin Last modified ở menu Trash
- [Paliarment] Chưa có setting quantity point
- Mở setting khi chưa có config bị lỗi
- Calendar thay đổi màu chữ khi chọn MyData
- Breadcrumb không hiển thị đúng tên thư mục
- Những folder/dashboard đã đánh sao không hiển thị đúng
- Giao diện tạo mới/rename popup sai font chữ
- Action popup "New folder/dashboard" hiển thị không đúng vị trí
- Popup action có khoảng hở Data Schema
- Thay đổi màu chữ "nullable'
- Thêm text hiển thị khi Table không có dữ liệu
- Không tìm thấy table mới tạo trong DB cũ khi bấm View Data từ Upload data popup
- Không tạo mới được 1 table khác trùng tên với table đã xóa Database
- Không chọn action cho database; thêm hint cho action
- Show schema khi chọn 1 database
- Popup tạo database không fill hết nội dung Query Editor
- Chỉnh sửa lại font chữ, màu sắc suggestion
- Không sort được theo header column trong bảng Result
- Hiển thị column thay vì no data
- Khi có nhiều table trùng tên, ds column khi gọi ra từ parent bị sai
- Column trong where không tự gợi ý các column trong bảng đã định sẵn User Management
- [Change Password] chỉnh sửa khoảng cách trong popup
- Change password text bị mờ
- Vẫn add được new user sau khi đã xoá email
- Hiện Label cho input trong mục Login Method Data Ingestion
- [Upload file CSV] Create database, table bị lỗi
- [Data Ingestion] Chỉnh lại button Add Data

### V1.3 - 2021-10-23

#### 👍 NEW FEATURES

- Filter Slicer
- Data Ingestion support Google sheet
- Data Ingestion support Google Analytics

#### 🍵 ENHANCEMENT

- [Enhance login with GG](https://trello.com/c/co6G1fmM/70-enhance-login-with-google)
- [Cập nhật lại schedule time lúc tạo job](https://trello.com/c/vnToby80/69-scheduler-service)
- [Load filter khi vào filter](https://trello.com/c/CQyhgg4U/73-load-filter-khi-v%C3%A0o-dashboard)

#### BUG FIXES

- [[Query Editor] Không sort được theo header column trong bảng Result](https://trello.com/c/OKZ4qDuM/250-query-editor-kh%C3%B4ng-sort-%C4%91%C6%B0%E1%BB%A3c-theo-header-column-trong-b%E1%BA%A3ng-result)
- Bị mất text Your dashboard is empty Click here to add your first chart khi đóng popup tạo chart
- [Data Schema] Không tìm thấy table mới tạo trong DB cũ khi bấm View Data từ Upload data pop up
- [Table chart] Textbox bị ẩn nhưng vẫn nhập được text
- [Paliarment] Báo lỗi Cannot read property 'call' of undefined khi change display unit
- [Data Schema] Không tạo mới được 1 table khác trùng tên với table đã xóa
- [Tất cả chart - Settings] Thẻ <p> Revert to default quá dài
- [Table chart] Click revert to default tại setting Style -> bị revert lại hết toàn bộ setting
- Vẫn add được new user sau khi đã xoá email
- Hiện Label cho input trong mục Login Method
- [Upload file CSV] Create database, table bị lỗi
- [Database Listing] Show schema khi chọn 1 database
- Title chart hiển thị sai khi rename
- [Query editor] hiển thị column thay vì no data
- [Query Editor] Khi có nhiều table trùng tên, ds column khi gọi ra từ parent bị sai
- [Query Editor] Column trong where không tự gợi ý các column trong bảng đã định sẵn
- Bị chuyển về dark theme khi click "Revert to default" trong dashboard setting
- Change password text bị mờ
- Chưa hiển thị popup confirm khi remove một dashboard
- Chưa hiển thị thông tin Last modified ở menu Trash
- [Paliarment] Chưa có setting quantity point
- Mở setting khi chưa có config bị lỗi
- [Data Ingestion] Chỉnh lại button Add Data

### V1.2 - 2021-09-10

#### 👍 NEW FEATURES

- Support Light Mode
- Support Dashboard Light theme
- Support Sankey Chart
- Display chart builder as popup
- Support drilldown path in header chart
- Support scroll bar

#### 🍵 ENHANCEMENT

##### Number chart:

- Support Display Trend Line
- Support Date Range & Comparison

##### Directory & Dashboard

- Update UI MyData & Shared with me
- Starred Listing
- Support Trash Listing
- Support Recent Listing

##### Data Management

- Support Share Database
- Support Delete Database

##### Organization Setting

- New UI Overview
- New UI Plan detail & billing
- Move user management to organization setting
- New UI for user management

#### 💥 BREAKING CHANGE

- Hidden Dark Mode
- Hidden Dashboard Dark Theme
- Các directory/dashboard được shared ở version < v1.2 sẽ mất hết.

#### BUG FIXES

##### Filter

- [[Filter] Chưa view được ngày tháng mình đã chọn](https://trello.com/c/Hp0LWusb/23-filter-ch%C6%B0a-view-%C4%91%C6%B0%E1%BB%A3c-ng%C3%A0y-th%C3%A1ng-m%C3%ACnh-%C4%91%C3%A3-ch%E1%BB%8Dn)
- [[Filter] Chưa highlight ngày hiện tại](https://trello.com/c/mmWEmlmi/17-filter-ch%C6%B0a-highlight-ng%C3%A0y-hi%E1%BB%87n-t%E1%BA%A1i)
- [[Filter] Chưa Clear data filter](https://trello.com/c/b5WqeEEa/15-filter-ch%C6%B0a-clear-data-filter)
- [[Filter] Box time present chưa có thanh scroll](https://trello.com/c/GMRrcChR/21-filter-box-time-present-ch%C6%B0a-c%C3%B3-thanh-scroll)
- [[Filter] Lỗi layout calendar](https://trello.com/c/6UfXPYy7/33-filter-l%E1%BB%97i-layout-calendar)
- [[Filter] Chưa thu nhỏ lại calendar để chọn năm](https://trello.com/c/dGqcZ2J2/177-filter-ch%C6%B0a-thu-nh%E1%BB%8F-l%E1%BA%A1i-calendar-%C4%91%E1%BB%83-ch%E1%BB%8Dn-n%C4%83m)
- [[Filter] Màu của date tương lại bị trùng với màu nền light theme](https://trello.com/c/wpBW9kOg/235-filter-m%C3%A0u-c%E1%BB%A7a-date-t%C6%B0%C6%A1ng-l%E1%BA%A1i-b%E1%BB%8B-tr%C3%B9ng-v%E1%BB%9Bi-m%C3%A0u-n%E1%BB%81n-light-theme)

##### All Chart

- [[Tất cả chart] Bỏ các type không cần thiết của một column](https://trello.com/c/tzZSfRck/45-t%E1%BA%A5t-c%E1%BA%A3-chart-b%E1%BB%8F-c%C3%A1c-type-kh%C3%B4ng-c%E1%BA%A7n-thi%E1%BA%BFt-c%E1%BB%A7a-m%E1%BB%99t-column)
- [[Tất cả chart] Data label hiện đè trên tooltips](https://trello.com/c/NauS7Nzu/58-t%E1%BA%A5t-c%E1%BA%A3-chart-data-label-hi%E1%BB%87n-%C4%91%C3%A8-tr%C3%AAn-tooltips)
- [[Tất cả chart] Chưa hiển thị color 10](https://trello.com/c/rHqfHVUX/94-t%E1%BA%A5t-c%E1%BA%A3-chart-ch%C6%B0a-hi%E1%BB%83n-th%E1%BB%8B-color-10)
- [[Tất cả Chart] Chưa sort đúng theo config](https://trello.com/c/fDmhTCWK/40-t%E1%BA%A5t-c%E1%BA%A3-chart-ch%C6%B0a-sort-%C4%91%C3%BAng-theo-config)
- [[Tất cả chart] Revert to default của Tooltip không reset lại giá trị](https://trello.com/c/x5pKvhaW/107-t%E1%BA%A5t-c%E1%BA%A3-chart-revert-to-default-c%E1%BB%A7a-tooltip-kh%C3%B4ng-reset-l%E1%BA%A1i-gi%C3%A1-tr%E1%BB%8B)
- [[Tất cả chart] Settings - Không chỉnh màu chữ tooltip được](https://trello.com/c/2k70TvrJ/46-t%E1%BA%A5t-c%E1%BA%A3-chart-settings-kh%C3%B4ng-ch%E1%BB%89nh-m%C3%A0u-ch%E1%BB%AF-tooltip-%C4%91%C6%B0%E1%BB%A3c)
- [[Tất cả chart] Filters có thể được add nhiều fields nhưng description chỉ để số ít](https://trello.com/c/TfMOvgDz/60-t%E1%BA%A5t-c%E1%BA%A3-chart-filters-c%C3%B3-th%E1%BB%83-%C4%91%C6%B0%E1%BB%A3c-add-nhi%E1%BB%81u-fields-nh%C6%B0ng-description-ch%E1%BB%89-%C4%91%E1%BB%83-s%E1%BB%91-%C3%ADt)
- [[Tất cả chart] Filter Like/Not like case Insensitive bị lỗi](https://trello.com/c/xNP3bM5g/68-t%E1%BA%A5t-c%E1%BA%A3-chart-filter-like-not-like-case-insensitive-b%E1%BB%8B-l%E1%BB%97i)
- [[All chart] Lỗi hiển thị color = var(--table-grid-line-color)](https://trello.com/c/KeK8BhTq/222-all-chart-l%E1%BB%97i-hi%E1%BB%83n-th%E1%BB%8B-color-var-table-grid-line-color)
- [[All chart] Font Family default = Barlow](https://trello.com/c/RGLlmuIq/234-all-chart-font-family-default-barlow)

##### Table

- [[Table chart + Pivot chart] Khi scroll icon đè lên menu](https://trello.com/c/77G9ZE01/171-table-chart-pivot-chart-khi-scroll-icon-%C4%91%C3%A8-l%C3%AAn-menu)
- [[Table chat] không cho nhập min, max = nhau ở data bar](https://trello.com/c/yqEU7Vik/191-table-chat-kh%C3%B4ng-cho-nh%E1%BA%ADp-min-max-nhau-%E1%BB%9F-data-bar)
- [[Table chart] Hiển thị dấu , giữa các số khi nhập min max](https://trello.com/c/aDd9mLTq/190-table-chart-hi%E1%BB%83n-th%E1%BB%8B-d%E1%BA%A5u-gi%E1%BB%AFa-c%C3%A1c-s%E1%BB%91-khi-nh%E1%BA%ADp-min-max)
- [[Table chart] Chặn không cho nhập ký tự đặc biệt/ text ở data bar setting](https://trello.com/c/TRwfnu3q/186-table-chart-ch%E1%BA%B7n-kh%C3%B4ng-cho-nh%E1%BA%ADp-k%C3%BD-t%E1%BB%B1-%C4%91%E1%BA%B7c-bi%E1%BB%87t-text-%E1%BB%9F-data-bar-setting)
- [[Table chart] Phải click 2 lần mới hiện danh sách font family](https://trello.com/c/cJYwzyPK/50-table-chart-ph%E1%BA%A3i-click-2-l%E1%BA%A7n-m%E1%BB%9Bi-hi%E1%BB%87n-danh-s%C3%A1ch-font-family)
- [[Table + Pivot chart] Setting Data bar hiển thị 2 field minimum](https://trello.com/c/boaMhCGM/174-table-pivot-chart-setting-data-bar-hi%E1%BB%83n-th%E1%BB%8B-2-field-minimum)
- [[Table Chart] Dòng text "Show 100 entries" bị crop mất số 0](https://trello.com/c/1dq44rBR/22-table-chart-d%C3%B2ng-text-show-100-entries-b%E1%BB%8B-crop-m%E1%BA%A5t-s%E1%BB%91-0)
- [Chọn style = default nhưng background color không phải màu default](https://trello.com/c/VAu9d7f8/183-ch%E1%BB%8Dn-style-default-nh%C6%B0ng-background-color-kh%C3%B4ng-ph%E1%BA%A3i-m%C3%A0u-default)
- [[Table chart] Click revert to default tại setting Style -> bị revert lại hết toàn bộ setting](https://trello.com/c/O7qdiweT/219-table-chart-click-revert-to-default-t%E1%BA%A1i-setting-style-b%E1%BB%8B-revert-l%E1%BA%A1i-h%E1%BA%BFt-to%C3%A0n-b%E1%BB%99-setting)
- [[Light theme] Width bị expand sau khi ON icons](https://trello.com/c/pDSLXgs6/223-light-theme-width-b%E1%BB%8B-expand-sau-khi-on-icons)

##### Pivot

- [[Pivot chart] Hiển thị sai columns khi chuyển trang](https://trello.com/c/RgUyVz5r/70-pivot-chart-hi%E1%BB%83n-th%E1%BB%8B-sai-columns-khi-chuy%E1%BB%83n-trang)
- [[Pivot chart] Bấm qua trang thứ 2 bị lỗi](https://trello.com/c/DFzl2yM7/66-pivot-chart-b%E1%BA%A5m-qua-trang-th%E1%BB%A9-2-b%E1%BB%8B-l%E1%BB%97i)
- [[Table chart + Pivot chart] Khi scroll icon đè lên menu](https://trello.com/c/77G9ZE01/171-table-chart-pivot-chart-khi-scroll-icon-%C4%91%C3%A8-l%C3%AAn-menu)

##### Pyramid

- [[Light theme] Tittle hiển thị đè lên chart funnel](https://trello.com/c/x7BeqHj4/227-light-theme-tittle-hi%E1%BB%83n-th%E1%BB%8B-%C4%91%C3%A8-l%C3%AAn-chart-funnel)

##### Funnel

- [[Funnel + Pyramid] Data hiển thị bị crop](https://trello.com/c/0uKTH1j1/228-funnel-pyramid-data-hi%E1%BB%83n-th%E1%BB%8B-b%E1%BB%8B-crop)

##### Gauge

- [[Light theme] Màu text default của gauges chart chưa nổi bật](https://trello.com/c/wHl1KdIP/232-light-theme-m%C3%A0u-text-default-c%E1%BB%A7a-gauges-chart-ch%C6%B0a-n%E1%BB%95i-b%E1%BA%ADt)

### V1.1 - 2021-07-30

#### NEW FEATURES

- Table:
  - Support conditional formatting
    - DataBar
    - Icon
  - Support change password
  - Support contextmenu when right click chart
  - Support view schema
  - Support create relationship

#### BUG FIXES

- Settings - Không chỉnh màu chữ tooltip được

#### Gauges chart

- Target line color hiển thị chưa đúng màu default
- Chưa thay đổi được data unit
- Dòng text "Show 100 entries" bị crop mất số 0

#### Bell curve

- Có nhiều màu trong Data color, trong khi Bell chart chỉ cần 1

#### Dashboard

- Lỗi layout khi xóa một folder
- Chưa rút gọn hiển thị tên của dashboard/ folder khi nhập name = maxlength

#### Table chart

- Sort danh sách font family theo thứ tự

### V1.0.5 - 2021-07-13

#### NEW FEATURES

- Table:
  - Support field formatting
  - Support conditional formatting
  - Support change color of expanded/collapsed icon

#### Enhancement

- Show background theme in data builder
- Update setting charts:

  - Number:

    - Setting title & subtitle
    - Setting data label
    - Setting tooltips
    - Setting background

  - Line, Area, Column, Bar:

    - Setting title & subtitle
    - Setting legend
    - Setting X Axis
    - Setting Y Axis
    - Setting data color
    - Setting data label
    - Setting shape
    - Setting background
    - Setting tooltip

  - Parliament:

    - Setting title & subtitle
    - Setting legend
    - Setting data color
    - Setting data label
    - Setting background
    - Setting tooltip

  - Pie:

    - Setting title & subtitle
    - Setting legend
    - Setting data color
    - Setting data label
    - Setting background
    - Setting tooltip

  - Scatter:

    - Setting title & subtitle
    - Setting general
    - Setting legend
    - Setting X Axis
    - Setting Y Axis
    - Setting data color
    - Setting background
    - Setting tooltip

  - Bubble:

    - Setting title & subtitle
    - Setting general
    - Setting legend
    - Setting X Axis
    - Setting Y Axis
    - Setting data color
    - Setting background
    - Setting tooltip

  - Funnel:

    - Setting title & subtitle
    - Setting data label
    - Setting data color
    - Setting background
    - Setting tooltip

  - Pyramid:

    - Setting title & subtitle
    - Setting data label
    - Setting data color
    - Setting background
    - Setting tooltip

  - Pareto:

    - Setting title & subtitle
    - Setting legend
    - Setting X Axis
    - Setting Y Axis
    - Setting data color
    - Setting background
    - Setting tooltip
    - Setting shape

  - Bell Curve:

    - Setting title & subtitle
    - Setting legend
    - Setting X Axis
    - Setting Y Axis
    - Setting data label
    - Setting shape
    - Setting data color
    - Setting background
    - Setting tooltip

  - Gauges:

    - Setting title & subtitle
    - Setting Gauge Axis
    - Setting data color
    - Setting data label
    - Setting shape
    - Setting background
    - Setting tooltip

  - Heatmap:

    - Setting title & subtitle
    - Setting X Axis
    - Setting Y Axis
    - Setting data color
    - Setting data label
    - Setting background
    - Setting tooltip

  - Wordcloud:

    - Setting title & subtitle
    - Setting data color
    - Setting background
    - Setting tooltip

  - Treemap:

    - Setting title & subtitle
    - Setting data label
    - Setting data color
    - Setting background
    - Setting tooltip

  - Stacked column:

    - Setting title & subtitle
    - Setting legend
    - Setting stack
    - Setting X Axis
    - Setting Y Axis
    - Setting data label
    - Setting data color
    - Setting background
    - Setting tooltip

  - Stacked bar:

    - Setting title & subtitle
    - Setting legend
    - Setting stack
    - Setting X Axis
    - Setting Y Axis
    - Setting data label
    - Setting data color
    - Setting background
    - Setting tooltip

  - Histogram:

    - Setting title & subtitle
    - Setting general
    - Setting legend
    - Setting X Axis
    - Setting Y Axis
    - Setting data label
    - Setting data color
    - Setting background
    - Setting tooltip

  - Map:

    - Setting title & subtitle
    - Setting map controls
    - Setting data label
    - Setting background
    - Setting tooltip

  - Spider web:

    - Setting title & subtitle
    - Setting legend
    - Setting data color
    - Setting data label
    - Setting background
    - Setting tooltip

  - Tab filter:
    - Setting title & subtitle
    - Setting tab controls
    - Setting background

#### BREAKING CHANGE

- Remove main date filter

### V1.0.4 - 30/06/2021

#### NEW FEATURES

- Data ingestion:
  - Support BigQuery & Redshift
  - Support Postgres
  - Support Upload csv
  - Suggest database name and table
- Support dashboard theme

#### ENHANCEMENT

- Pivot table setting

  - Style setting
  - Grid setting
  - Header setting
  - Value setting
  - Total setting
  - Field formatting
  - Title & description
  - Visual header
  - Tooltip setting
  - Collapse/ Expand icon setting
  - Background

- Table setting

  - Style setting
  - Grid setting
  - Header setting
  - Value setting
  - Title & description
  - Visual header
  - Tooltip setting
  - Background

- Reset alpha when select other colo in color picker

#### FIX BUGS

- Drag and drop
- Bug disable effect by filter not working

### V1.0.3 - 2021-06-04

#### NEW FEATURES

- Chart:
  - Parliament
  - Spiderweb
- Data Ingestion
  - DataSource: Listing, create, update, delete datasource.
  - Job: Listing, delete, create sync data.
  - JobHistory: Listing job synced.
- Table heat color
- Overlap Widget

#### ENHANCEMENT

- Draw Map Việt Nam (thêm 2 đảo)
- Dropdown support search
- Popup confirmation khi back trong builder
- Thông báo lỗi theo design mới
- Hỗ trợ drag các function qua lại giữa các các section.

#### FIX BUGS

- [Setting change text color](https://trello.com/c/RxNGKFyg/92-staging-setting-change-text-color-%E1%BA%A3nh-h%C6%B0%E1%BB%9Fng-%C4%91%E1%BA%BFn-m%C3%A0u-text-c%E1%BB%A7a-c%E1%BA%A3-tooltips-d%E1%BA%ABn-%C4%91%E1%BA%BFn-kh%C3%B4ng-%C4%91%E1%BB%8Dc-%C4%91%C6%B0%E1%BB%A3c-n%E1%BB%99i-dung-tooltips)
- [Map chart: giá trị của value không phải là number](https://trello.com/c/XTFYnQED/61-map-chart-gi%C3%A1-tr%E1%BB%8B-c%E1%BB%A7a-value-kh%C3%B4ng-ph%E1%BA%A3i-l%C3%A0-number-nh%C6%B0ng-map-v%E1%BA%ABn-hi%E1%BB%83n-th%E1%BB%8B-v%C3%A0-th%C3%B4ng-tin-hi%E1%BB%83n-th%E1%BB%8B-tr%C3%AAn-map-c%C5%A9ng-kh%C3%B4ng-%C4%91%C3%BAng-v%E1%BB%9Bi-d%E1%BB%AF-li)
- [Dropdown component hiển thị thiếu margin](https://trello.com/c/CcjBRTue/89-dropdown-component-hi%E1%BB%83n-th%E1%BB%8B-thi%E1%BA%BFu-margin)
- [Khi refresh dashboard thì stacked column hiển thị sai giao diện](https://trello.com/c/EHWX4NGd/95-staging-khi-refresh-dashboard-th%C3%AC-stacked-column-hi%E1%BB%83n-th%E1%BB%8B-sai-giao-di%E1%BB%87n)
- [Giao diện của tab filter bị lỗi khi chọn vào value](https://trello.com/c/QFfy57on/42-giao-di%E1%BB%87n-c%E1%BB%A7a-tab-filter-b%E1%BB%8B-l%E1%BB%97i-khi-ch%E1%BB%8Dn-v%C3%A0o-value)
