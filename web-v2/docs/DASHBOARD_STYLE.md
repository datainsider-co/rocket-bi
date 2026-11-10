# Style trang Dashboard và Chart Builder cho khớp v1

Plan style lại trang `/dashboard/:name` của v2 (dashboard, chart builder và các dialog mở từ trang này) cho khớp v1.
Lập ngày 2026-11-10.

## Cách lập và độ tin cậy

- **Đọc code hai bên**: so SCSS / Vue của v1 với CSS / Tailwind / antd của v2, theo bốn mảng: khung trang, widget,
  chart builder, component nền và dialog.
- **Chụp ảnh hai bên** bằng Playwright ở 1440×900 trên docker local (v1 `localhost:5050`, v2 `pnpm dev`), dashboard
  "v2 Sample", "v2 Filters", "v2 Builder", "test". Đã xem 9 cặp: view mode của Sample và Filters, menu Adding, menu
  widget, picker, builder rỗng, builder có data, tab Settings.
- **Chưa kiểm**: theme tối, các dialog của dashboard, mobile (375px), trạng thái hover / drag, các loại chart ngoài
  column, line, area, pie, donut, KPI, table.
- Mỗi mục ghi một trong ba nhãn:
  - **[ảnh]**: thấy trên ảnh chụp.
  - **[code]**: đã đọc code cả hai bên, chưa thấy trên ảnh.
  - **[nghi]**: một bên chưa rõ (giá trị mặc định của antd lấy theo trí nhớ, hoặc chưa đọc hết phía v1). Phải kiểm
    trên app đang chạy trước khi sửa.
- Giá trị "mặc định antd" trong tài liệu này không đọc từ package đã cài.

Viết tắt đường dẫn:

| Viết tắt | Đường dẫn |
|---|---|
| `v1:` | `web/src/` |
| `v1dash:` | `web/src/screens/dashboard-detail/components/` |
| `v1cb:` | `web/src/screens/chart-builder/` |
| `v1sh:` | `web/src/shared/` |
| `v2:` | `web-v2/src/` |
| `dash:` | `web-v2/src/features/dashboard/` |
| `cb:` | `web-v2/src/features/chart-builder/` |

Token sáng của v1 (`v1:themes/app-theme.scss:13-88`), dùng trong cả tài liệu:

| Biến | Giá trị |
|---|---|
| `--primary` | `#f2f2f7` |
| `--secondary` | `#fff` |
| `--secondary-2` | `#fafafb` |
| `--hover-color` | `#f9faff` |
| `--active-color` | `#597fff0d` |
| `--text-color` | `#4f4f4f` |
| `--secondary-text-color` | `#5f6368` |
| `--accent` | `#597fff` |
| `--accent-hover-color` | `#3463ff` (sáng), `#4b6ee1` (tối) |
| `--danger` | `#ea6b6b` |
| `--menu-shadow` | `0 4px 4px #00000014` |
| `--scrollbar-background` | `#d6d6d6` |

## Việc phải quyết định trước

1. **Chỗ v2 cố ý khác v1.** Plan này coi là sửa về v1; muốn giữ thì bỏ mục tương ứng:
   - Nút "⋮" hiện khi hover ở view mode (W10). v1 dùng hai nút 40px zoom và drilldown.
   - Nền tooltip chart theo theme (W16). v1 để trắng mặc định của Highcharts.
   - Add Text một cột, HTML là Switch (D2).
   - Sort tab bằng nút lên / xuống (D5).
   - Picker hiện cả loại chart chưa hỗ trợ ở dạng disable (B7). v1 chỉ liệt kê loại dùng được.
   - Filter mode nằm trong danh sách condition (B23).
   - Background dashboard chỉ nhận URL (server không có endpoint upload).
2. **Màu dialog trong theme tối.** [nghi]
   - `dash:edit/settings/settings.css:1-5` ghi rằng dialog v1 đổi theo theme.
   - Đọc code v1 thì ngược lại: biến theme chỉ áp cho `body[dashboard-theme=…] #app` và `div[widget-preview-area]`
     (`v1:themes/dashboard-theme.scss:57-58`); `DiCustomModal` là `BModal` của bootstrap-vue, có vẻ render vào
     `<body>`, ngoài `#app`; dialog kiểu `EtlModal` mang `builder-default-style`, cũng về giá trị gốc
     (`v1:themes/app-theme.scss:1-3`).
   - Nếu đúng thì dialog v1 luôn sáng với accent `#597fff`, kể cả ở dashboard theme Anzac.
   - Chụp một dashboard theme tối trên v1 trước khi làm bước 4.
3. **Nhãn nút lưu trong builder.** Sửa chart có sẵn: ảnh v1 ghi "Save", v2 ghi "Update". [ảnh]

## Bước 0: Nền tảng

Làm trước, vì các bước sau dùng lại.

**Trạng thái: xong ngày 2026-11-10** (trừ các mục ghi "để lại" bên dưới). Đã kiểm trên app đang chạy ở theme
`light_default`; chưa kiểm theme tối và theme có accent khác.

| Mục | Đã làm | Nằm ở |
|---|---|---|
| F1 | Token cả app; token, `getPopupContainer`, `<App>` riêng cho trang dashboard; CSS cho modal, popover, menu, select, tabs, slider, tooltip | `v2:app/theme/appTheme.ts`, `dash:theme/dashboardAntdTheme.ts`, `dash:theme/DashboardThemeProvider.tsx`, `dash:theme/dashboardAntd.css` |
| F2 | Nút, input, select và popup, modal, popover, tooltip, switch, tabs, slider, divider (qua F1); toast | `v2:shared/toast/useToast.ts` |
| F3 | Popup và dialog của trang render trong `.dashboard-page`; bốn biến `--widget-border-radius-*`; hai scope mặc định; `--dashboard-content-width` mặc định 1024px | `dash:theme/popupContainer.ts`, `dash:widgets/widgetStyle.utils.ts`, `dash:theme/dashboardTheme.css`, `dash:detail/DashboardPage.css` |
| F4 | `Loading`, `ErrorState`, `EmptyData` và story | `v2:shared/status/` |
| F5 | Ẩn scrollbar trong trang, `.dashboard-page__body` theo `.di-scroll-bar` | `dash:detail/DashboardPage.css` |
| F6 | `line-height: 1.4` và font smoothing; Barlow, Montserrat; letter-spacing của title | `v2:app/global.css`, `index.html`, `dash:detail/DashboardPage.css`, `dash:header/DashboardHeader.css` |
| F7 | Chép đủ asset | `public/icons/`, `public/chart-builder/hint/{light,dark}/` |

Để lại:

- **F2**: search input dùng chung, nút icon tròn dùng chung, icon SVG của checkbox / radio, input nền xám
  (`variant="filled"` theo từng dialog), color picker. Làm khi tới dialog hoặc widget dùng chúng (bước 2 đến 4).
- **F2 toast**: `dash:mode/useDashboardMode.ts` và `dash:widgets/chart/useChartExport.ts` vẫn dùng `message` (một cái
  gọi ngoài React, một cái là `message.loading`).
- **F3 theme không nhận ra**: giữ `light_default`. `DashboardSetting.themeName` đã mặc định `light_default` khi server
  không gửi, nên fallback chỉ chạy lúc đang tải (tên rỗng); đổi sang `dark_default` sẽ làm trang nháy tối.
- **F4**: mới viết component; chỗ dùng là S6, W1 đến W4, B27. `EmptyData` nhận câu chữ từ chỗ gọi (chưa đọc
  `emptyMessage` của v1).
- CSS của F1 nằm trong `@layer components`: thắng antd, thua CSS riêng của từng feature và Tailwind. Các override cũ
  (`settings.css:182-191` và tương tự) chưa gỡ; gỡ ở D10, D11.
- Builder nằm trong trang nên nhận accent của theme dashboard; v1 dùng `--accent--root` (`[builder-default-style]`).
  Bọc builder bằng `DashboardThemeProvider` riêng ở B1.
- `modal.confirm` chỉ có padding và title 16px/500; layout v1 là D12.

### F1. Accent và token antd

- **[ảnh] Sai accent.** v2 đặt `colorPrimary: '#0066ff'` (`v2:app/theme/ThemeContext.tsx:15-18`), là `--accent-2` của
  v1. Control trên dashboard v1 dùng `--accent`: `#597fff` mặc định, theo theme là `#e3a845` / `#a51adf` / `#1a86df` /
  `#222e38` (`v1:themes/dashboard-theme.scss:63-165`). v1 chỉ dùng `#0066ff` cho `DiButton[primary-2]`
  (`v1sh:components/common/DiButton.vue:112-120`) và tab của Add Text.
- **Cách làm:** bọc `.dashboard-page` bằng `ConfigProvider` lồng và antd `<App>` lồng, token lấy theo tên theme trong
  `dash:theme/dashboardThemes.ts`. `colorPrimary` là seed nên phải là hex, không dùng được `var(--accent)`.

Token áp cho cả app (`ThemeContext.tsx`), vì v1 dùng ở mọi trang:

| Token | Giá trị |
|---|---|
| `token.borderRadius` / `borderRadiusLG` / `borderRadiusSM` | 4 / 4 / 2 |
| `token.colorBorder` | `#d6d6d6` |
| `token.colorSplit`, `colorBorderSecondary` | `#f0f0f0` |
| `token.colorText` / `colorTextSecondary` (chỉ light) | `#4f4f4f` / `#5f6368` |
| `token.colorBgMask` | `rgba(19,19,23,0.7)` |
| `token.boxShadow` | `0 2px 8px 0 rgba(0,0,0,0.08)` |
| `token.boxShadowSecondary` | `0 4px 4px 0 rgba(0,0,0,0.08)` |
| `Button.fontWeight` | 500 |
| `Button.primaryShadow` / `defaultShadow` / `dangerShadow` | `none` |
| `Input.activeShadow` | `none` |
| `Select.activeOutlineColor` | `transparent` |
| `Select.optionSelectedFontWeight` | 400 |
| `Modal.titleFontSize` / `titleLineHeight` | 24 / 1.4 |
| `Tooltip.colorBgSpotlight` / `colorTextLightSolid` | `#fff` / `#4f4f4f` |

Token chỉ cho trang dashboard:

| Token | Giá trị |
|---|---|
| `token.colorPrimary` | hex accent của theme (`#597fff` mặc định) |
| `Button.colorPrimaryHover` / `colorPrimaryActive` | `--accent-hover-color` / `--accent-active-color` của theme |
| `Button.defaultBg` | `transparent` |
| `Button.defaultColor` | `var(--secondary-text-color)` |
| `Button.defaultHoverBg` / `textHoverBg` | `var(--hover-color)` |
| `Button.defaultHoverColor` | `var(--text-color)` |
| `Button.defaultHoverBorderColor` | `#d6d6d6` |
| `token.controlHeightLG` | 40 (dùng `size="large"` cho field và nút trong dialog) |
| `token.colorBgElevated` | `var(--menu-background-color)` |
| `token.controlItemBgHover` | `var(--hover-color)` |
| `Select.optionSelectedBg` / `optionActiveBg` | `var(--active-color)` |
| `Select.optionPadding` | `8px` |
| `Dropdown.paddingBlock` | 12 |
| `token.controlPaddingHorizontal` | 16 |
| `Tabs.titleFontSize` / `horizontalItemGutter` | 16 / 32 |
| `Slider.railSize` / `handleSize` / `handleLineWidth` / `railBg` | 6 / 14 / 2 / `#d8d8d8` |
| `Switch.handleSizeSM` | 10 |
| `token.colorTextQuaternary` | `#ccc` |

- **Đã kiểm:** chuỗi `var(--…)` dùng được cho các token trong bảng (antd 6 xuất token thành biến CSS, popup nằm trong
  trang nên biến theme có giá trị). Chỉ `colorPrimary` phải là hex, lấy từ `accent` trong `dashboardThemes.ts`.
- **Vẫn phải viết CSS** (token không tới): padding modal (header `16px 16px 0`), title weight 500, nút footer
  (Cancel tối thiểu 83×40, OK 122×40, cách 16px), popover padding 16 không mũi tên, popup dropdown padding 0, tab
  đang chọn weight 700.

### F2. Component nền: v1 và cách khớp

| Component | v1 | v2 hiện tại | Nhãn |
|---|---|---|---|
| Nút primary | bo 4, không viền, không shadow, 14px/500, letter-spacing .18px; nền `--accent`, hover `--accent-hover-color`, disabled `#bebebe` chữ trắng (`v1:themes/scss/_button.scss:3-28`); padding 8px, cao khoảng 36px (`DiButton.vue:79-82`); 40 / 42px ở footer dialog (`v1sh:components/DiCustomModal.vue:237-254`) | cao 32, bo 6, weight 400, `#0066ff`, có shadow màu; chỉ `.setting-dialog` / `.theme-dialog` được override, hover là `opacity:.85` (`dash:edit/settings/settings.css:182-191`) | [code] |
| Nút viền | trong suốt, viền 1px `#d6d6d6`, chữ `--secondary-text-color`; hover nền `--hover-color`, chữ `--text-color` (`_button.scss:30-55`, `DiButton.vue:158-160`) | trắng, `#d9d9d9`, hover đổi viền và chữ sang xanh | [code] |
| Nút text / icon-text | không viền, bo 4, hover `--hover-color` (`_button.scss:87-111,161-185`); icon-text cao 28, padding 6, 14px, .2px (`v1sh:components/common/DiIconTextButton.vue:42-66`) | cao 32, hover `rgba(0,0,0,.04)` | [code] |
| Nút icon tròn | 24×24, hover nền `#d6d6d6` icon trắng (`_button.scss:113-159`) | chưa có class chung | [code] |
| Input | nền `#f2f2f7`, không viền, cao 42, bo 4, padding 0 12, 14px, placeholder `#677883`; biến thể `[border]`: cao 40, viền 1px `#d6d6d6`, hover / focus viền `--accent` không glow, disabled nền `#f4f6f8` chữ `#919eab` (`v1sh:components/DiInputComponent.vue:135-230`); label 14/18 cách 8px; placeholder toàn cục 12px (`v1:themes/scss/_input_placeholder.scss:1-9`) | cao 32, bo 6, focus viền xanh và glow 2px; `.setting-input` chỉ đặt cao 40 / bo 4 (`settings.css:279-285`) | [code] |
| Search input | cao 34, trắng, bo 4, viền 1px `rgba(231,235,238)`, 14/18 (`v1sh:components/DiSearchInput.vue:100-141`) | chỉ filter widget có bản port | [code] |
| Select | trigger cao 40, bo 4, nền `--input-background-color`, padding 0 8; `[border]`: trắng viền `#d6d6d6` (`v1sh:components/common/di-dropdown/DiDropdown.scss:17-106`) | cao 32, bo 6 | [code] |
| Popup của select | nền `--menu-background-color`, outline 1px `#d6d6d6`, bo 4, shadow `0 4px 8px rgba(0,0,0,.1)`, padding 8px 0; item 14px/400, padding 8, opacity .8; hover và đang chọn nền `--active-color`, chữ `--text-color` (`DiDropdown.scss:126-213`) | bo 8, item đang chọn nền xanh nhạt, weight 600; không CSS nào của dashboard override | [code] |
| Modal | bo 4, shadow `0 2px 8px rgba(0,0,0,.08)`, header padding `16px 16px 0` không đường kẻ, backdrop `#131317` 0.7 (`v1:themes/scss/custom-boostrap-class.scss:14-41`); title 24px/500/.2px, X tròn 24px (`DiCustomModal.vue:166-177`); rộng 500 (md) / 800 (lg) / 300 (sm) / 350 (`:198-211`); dạng "full": hai nút flex 42px (`:181-186`) | rộng 520, bo 8, padding 20/24, title 16px/600, mask `rgba(0,0,0,.45)`, nút cao 32 cách 8px | [code] |
| Popover | padding 16, bo 4, `--menu-shadow`, không mũi tên, rộng 256 (`v1:themes/scss/custom-popover.scss:6-23`) | bo 8, padding 12, có mũi tên | [code] |
| Tooltip | nền `--menu-background-color`, chữ `--text-color`, bo 4: tooltip sáng (`v1:themes/scss/custom-variables.scss:33-35`) | gần đen, chữ trắng, bo 6 | [code] |
| Context menu | bo 4, padding 0, min-width 160, `--menu-shadow` (`v1:themes/scss/custom-vue-context.scss:8-17`); item padding 12px 16px, 14px, .2px, icon 16px cách 8px, hover `--hover-color--root` (`v1sh:components/ContextMenu.vue:325-399`); dùng màu gốc nên luôn sáng | chỉ menu gear được port (`settings.css:30-76`) | [ảnh] |
| Switch | 27×16, nút 10px, tắt `#ccc`, bật `#597fff`, label 14px (`v1sh:components/common/DiToggle.vue:67-163`) | `size="small"` 28×16, nút 12, bật `#0066ff` | [code] |
| Checkbox / radio | icon SVG riêng, bật `--background-active` (`#57F`), tắt `#9799AC`; dòng cao 32, cách 8px (`v1sh:components/filters/MultiChoiceItem.vue:2-10`, `v1:themes/app.scss:272-281`) | antd, `#0066ff`, viền `#d9d9d9` | [code] |
| Tabs | 16px/24px, padding 12px 0, icon 14px cách 12px; đang chọn và hover `--accent`, đang chọn weight 700 (`v1sh:components/DiTab.vue:54-97`) | 14px, weight 400; chỉ port dưới `.setting-dialog__tabs` (`settings.css:117-152`) | [code] |
| Slider | rail 6px bo 3 `#d8d8d8`, track `--accent`, nút 14px accent viền trắng 2px (`v1sh:components/common/di-slider/DiSlider.vue:57-96`) | port dưới `.setting-slider` (`settings.css:247-270`), nhưng nút có vòng accent thay vì viền trắng | [code] |
| Color picker | sketch của vue-color, 280px, nền `--primary`, bo 4, ẩn preset (`v1sh:components/ColorPickerV2.vue:213-264`) | antd ColorPicker (chưa mở `ColorInput.tsx`) | [nghi] |
| Toast | card trắng, bo 8, tối đa 410px, shadow `0 2px 8px rgba(0,0,0,.2)`, header đậm 16px (success `#07bc40`), body 16px opacity .5 (`v1:themes/scss/_toast.scss:6-75`) | `message.error/success` dạng pill giữa màn (`dash:edit/useWidgetEditActions.ts:41,90`). Đổi sang `notification` có title và description | [code] |
| Divider | `#f0f0f0` / `#d6d6d6` (`app-theme.scss:122-123`) | `rgba(5,5,5,.06)` | [code] |

### F3. Biến theme cho popup

- **[code]** Giá trị biến đã khớp hết: `dash:theme/dashboardTheme.css` chép đủ `app-theme.scss` và 10 block của
  `dashboard-theme.scss`.
- **[code]** Phạm vi khác: v1 đặt trên `body[dashboard-theme]` nên mọi portal có theme; v2 đặt trên `.dashboard-theme`
  nên thứ gì render vào `document.body` thì không có biến. Chỉ ba dialog settings truyền
  `getContainer={dashboardPageContainer}`.
- **Cách làm:** mọi Modal / Popover / Dropdown / Select của trang dashboard truyền `getPopupContainer` (hoặc
  `getContainer`) về container của trang và mang class `dashboard-popover`. Làm một lần qua `ConfigProvider
  getPopupContainer` ở F1.
- **[code]** Biến v2 chưa định nghĩa: `--widget-border-radius-top-left / -top-right / -bottom-left / -bottom-right`
  (`v1dash:widget-container/WidgetContainer.vue:40-43`, `NumberRenderer.scss` dùng); hai scope
  `.filter-popover-area-default-style` và `[builder-default-style]` (`dashboard-theme.scss:311-335`).
- **[code]** Theme không nhận ra: v1 về `dark_default` (`v1:store/modules/ThemeStore.ts:55`), v2 về `light_default`
  (`dash:theme/dashboardThemes.ts:42-44`).
- **[code]** `--dashboard-content-width` mặc định: 1024px ở v1 (`v1:screens/dashboard-detail/views/DashboardDetail.scss:6`),
  100% ở v2 (`dash:detail/DashboardPage.css:48`). Chỉ có tác dụng khi setting thiếu.

### F4. Component trạng thái dùng chung

Viết ba component, dùng cho trang, widget và preview của builder:

| Component | v1 | v2 hiện tại |
|---|---|---|
| Loading | `assets/icon/loading.svg`, vòng gradient 24px (`#55BCFF` → `#57F`), quay 2s linear, giữa khung (`v1sh:components/DiLoading.vue:8,31-35`) | antd `Spin` (8 chỗ import trong dashboard) |
| Lỗi | `di-icon-warning` 58px màu `--secondary-text-color`, cách dưới 17px; thông báo `h6` 14px, cắt 4 dòng; nút primary "Try Again" 14px, padding 2px 17px, cách trên 24px; padding khung 15px (`v1sh:components/ErrorWidget.vue:2-12,43-73`) | trang: `Result status="warning"` + "Retry" (`dash:detail/DashboardPageBody.tsx:13-26`); widget: title, chữ `text-xs` cắt 3 dòng, nút nhỏ "Retry" (`dash:widgets/chart/ChartWidgetView.tsx:22-33`) |
| Dữ liệu rỗng | `EmptyDataIcon` SVG 90×90 (`var(--icon-color)`, opacity .6), chữ 16px (`v1dash:widget-container/charts/ChartHolder.vue:21-25`, `error-display/EmptyWidget.vue:1-12,41-43`) | không có; v2 vẽ chart hoặc table rỗng |

- **Đã kiểm:** loader lưới 3×3 (`v1:themes/scss/di-loading.scss:11-79`) chỉ có ở data ingestion và
  `CalculatedFieldModal`; dashboard chỉ dùng `DiLoading`.
- Trang v1 vẽ loading và lỗi **bên trong** card `.dashboard--content`
  (`v1:screens/dashboard-detail/views/DashboardDetail.vue:17-22`); v2 vẽ ngoài card.

### F5. Scrollbar

- **[code]** v1 ẩn mọi scrollbar (`v1:themes/scss/scrollbar.scss:5-28`). `.di-scroll-bar` (`:29-55`): 16px, thumb
  `var(--scrollbar-background)` viền trong suốt 5px, bo 8, hover `--scrollbar-hover`, Firefox `thin`.
- v2 không có CSS scrollbar nào; biến đã định nghĩa (`dashboardTheme.css:104-105`) nhưng không dùng.
- **Cách làm:** thêm rule cho `.dashboard-page__body`, ẩn các scrollbar khác trong trang. Table dùng bản 5px (W28).

### F6. Typography và font

- **[code]** v1: body `line-height: 1.4`, `-webkit-font-smoothing: antialiased` (`v1:themes/app.scss:67-89`). v2
  `app/global.css:19-29` không đặt cả hai và không đặt `font-family` cho body; chữ lấy theo `App` của antd (có lẽ
  line-height khoảng 1.57). Đã đặt 1.4 cho `body` và `.dashboard-page`; component antd vẫn tự đặt 1.57
  cho chữ bên trong nó.
- **[code]** v1 nạp Barlow, Roboto, Montserrat (`v1:themes/fonts.scss:5-7`). v2 `index.html` chỉ nạp Roboto, nên
  widget chọn Barlow hoặc Montserrat bị rơi về font khác.
- **[code]** Heading v1 có `letter-spacing: .2px` (`app.scss:102-117`); title dashboard của v2 không có
  (`dash:header/DashboardHeader.css:23-32`).

### F7. Asset còn thiếu

Chép từ `web/src/assets` sang `web-v2/public` (v2 chưa có file nào trùng tên):

- `icon/charts/hint/light/` (28 file) và `hint/dark/`: hình hướng dẫn trong preview của builder.
- `ic-drag.svg`, `move.svg`, `ic_search.svg`, `idea.svg`, `ic_help.svg`.
- `ic-16-arrow-down.svg`, `ic-16-arrow-up.svg`, `ic-16-arrow-right.svg`.
- `directory-empty.svg`, `ic_empty_dashboard.svg`, `ic-inner-filter.svg`, `loading.svg`.

Đã có ở v2: 50 icon loại chart (`public/chart-builder/charts/`), 6 ảnh KPI theme, ba bộ icon font.

## Bước 1: Khung trang dashboard

Ảnh view mode của "v2 Sample" và "v2 Filters" gần trùng v1; phần lệch nằm ở các mục dưới.

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| S1 | Shadow và outline của card | `.grid-stack-item-content { overflow: visible !important }` (`v1:themes/scss/gridstack.scss:231-235`), nên `box-shadow: 0 2px 4px #0000001a` và outline của card hiện ra (`WidgetContainer.vue:101-102`) | `.dashboard-grid__item { overflow: hidden }` (`dash:grid/DashboardGrid.css:3-6`) cắt mất cả hai | Bỏ `overflow: hidden` ở grid item; thân card đã tự cắt (`dash:widgets/WidgetContainer.css:29`) | [ảnh] |
| S2 | App header theo theme | Nền `--header-bar-background-color` (accent của theme; `rgba(0,0,0,.3)` trên gradient ở theme tối), dùng `--header-active-background-color` / `--header-icon-active-color` (`DashboardDetail.scss:40-42`) | Cố định `bg-header` `#597fff`, nằm ngoài `.dashboard-theme` (`v2:app/layout/header/HeaderBarView.tsx:27`, `AppLayout.tsx:24`) | Đưa biến theme lên trên trang ở route dashboard | [code] |
| S3 | Menu Adding | Context menu của app, min-width 200px, mỗi dòng có icon 16px, dòng cao khoảng 44px, "Paste chart" mờ khi không dùng được (`DashboardDetail.vue:33`) | antd Dropdown không icon, dòng 32px, không class theme (`dash:header/HeaderActionsView.tsx:32`) | Thêm icon, kích thước dòng, class theme như menu gear (`settings.css:31-39`) | [ảnh] |
| S4 | Thanh header filter | Nằm trong `.dashboard-header` (padding ngang 28 / 47px), dòng min 60px / max 120px; nhãn "Filters (n)" weight 400 opacity .8; item cách trái 12px, dọc 6px; chip panel padding 12px 16px, bo 4, 14px, .2px; condition opacity .5; "Click to filter" màu accent; chip giá trị nền `--accent`, chữ `--accent-text-color` 12px, bo 4, padding 0 8px; mắt `di-icon-eye` / `di-icon-eye-close` 16px opacity .4; tắt = chỉ giảm alpha nền (.4 sáng / .1 tối) (`v1sh:components/FilterBar.vue`, `filters/dynamic-filter-panel/InternalFilterPanel.scss:9-47`, `ChipButton.vue`, `InternalFilterPanel.ts:106-112`) | padding 8px 15px 0, gap 8px, nhãn `font-medium`, `rounded-md py-1 pr-1 pl-2`, chip là antd `Tag` xám, icon mắt antd, cả chip opacity .5; popover sửa là antd mặc định, không `getPopupContainer` (`dash:controls/header-filters/HeaderFilterBar.css:3-15`, `HeaderFilterBarView.tsx:18-19`, `HeaderFilterItemView.tsx:43-74`) | Style lại theo v1, đổi icon, popover có theme | [code] |
| S5 | Dashboard rỗng | `ic_empty_dashboard.svg` 40px (cách dưới 15px), chữ 16px / .27px / line-height 1.5, link đậm gạch chân màu accent "Click here to add your first chart" (`v1dash:EmptyDashboard.vue:2-9,51-65`) | antd `Empty`, 14px, câu chữ khác, không link (`dash:detail/DashboardCanvas.tsx:37`) | Viết lại theo v1 | [code] |
| S6 | Loading / lỗi của trang | Xem F4 | Xem F4 | Dùng component F4, vẽ trong card nội dung | [code] |
| S7 | Password gate | Modal bo 4, backdrop `#131317` .7, hai nút full-width 42px (Cancel viền / Access accent), lỗi 14px `--danger`, title `h5`, input nền xám (`v1dash:PasswordModal.vue:2-28`) | antd Modal mặc định, nút nhỏ căn phải, `Input.Password` có viền, render vào body (`dash:access/PasswordGateView.tsx:18-32`) | Style lại, mount trong trang | [code] |
| S8 | Shadow header khi cuộn | `box-shadow: 0 4px 8px rgba(0,0,0,.1)` khi cuộn quá 1% (`DashboardDetail.scss:244-248`, `DashboardDetail.ts:591-597`) | Không có | Thêm | [code] |
| S9 | Full screen / TV | Thân trang padding 4px trên / trái / phải, `overflow: hidden` ở cả hai mode; nút back và cụm phải `display: none`, hiện khi hover header (`DashboardDetail.scss:206-241`) | Thân giữ 13px 15px 15px, chỉ TV ẩn overflow (`dash:detail/DashboardPage.css:14-19,39-41`); cụm phải mờ bằng opacity 150ms (`DashboardHeader.css:177-187`); back không hiện ngoài view mode (`dash:detail/DashboardPageView.tsx:75`) | Sửa theo v1 | [code] |
| S10 | Chiều cao header | Ô ngày cao 37px (`v1dash:widget-container/filters/main-date-filter-v2/DiCalendar.vue`, `.input-calendar`) | Trigger 39px (`dash:controls/main-date/MainDate.css:6`), `min-height: 39px` (`DashboardHeader.css:12`) | Giảm 2px | [code] |
| S11 | Hover nút tròn (back, rename, thoát full screen) | Icon trắng trên nền `#d6d6d6` (`_button.scss:145-150`) | Chỉ đổi nền (`DashboardHeader.css:51-54`) | Thêm `color: #fff` | [code] |
| S12 | Nhãn nút header | Title chỉ có line-height 1.4 và padding-left 8px; disabled opacity .5 (`DiButton.vue:87-100`) | letter-spacing .2px, disabled .6 (`DashboardHeader.css:86,99`) | Kiểm rồi sửa | [nghi] |
| S13 | Thanh View As | `DiButton` viền 1px `#d6d6d6`, cao 28px, `di-icon-view-as`, tên weight 500; thoát là nút ghost `di-icon-exit-view-as` (`v1dash:dashboard-control-bar/DashboardControlBar.vue:80-96`, `.scss:47-49`) | antd Button 32px trắng, `EyeOutlined` / `LogoutOutlined` (`dash:view-as/ViewAsBarView.tsx:15-22`) | Style lại, đổi icon | [code] |
| S14 | Icon Relationship trong Options | SVG inline `DashboardRelationshipIcon` opacity .8 | Glyph font `di-icon-relationship` (`dash:header/headerOptions.utils.ts:36`) | So ảnh rồi quyết | [nghi] |
| S15 | Chuyển view / edit | `<transition name="fade" mode="out-in">` (`DashboardControlBar.vue:35`) | Không có | Thêm fade | [code] |
| S16 | Lịch main date | `v-calendar` (`isDark`, `color="blue"`) trong popover z-index 2000, lệch trên 5px | `MainDate.css:130-197`: thứ 15.7px, ngày 14.5px, vòng 28px | Chưa đọc được số đo trong thư viện của v1; so ảnh | [nghi] |
| S17 | Footer lịch | Nút 128×26px, margin 16px; Cancel là nút secondary có theme; Remove / Edit Main Date đặt tuyệt đối dưới 13px trái 10px (`v1:themes/scss/calendar/new-di-calender.scss`, `.calendar-button`) | Cùng kích thước, nhưng Cancel là antd Button mặc định, trắng ở theme tối (`MainDate.css:199-236`) | Cho Cancel theo theme | [code] |
| S18 | Placeholder khi kéo | `1px dashed lightgray`, không nền (`gridstack.scss:25-32`) | Nền `#0066ff` .15, bo 4 (`DashboardGrid.css:18-23`) | Đổi | [code] |
| S19 | Widget đang kéo / resize | Nội dung opacity .8 (`gridstack.scss:66-73`) | Không có | Thêm | [code] |
| S20 | Tay nắm resize | Glyph se / sw opacity 0, chỉ còn con trỏ (`gridstack.scss:96-99`) | Hiện glyph góc của react-grid-layout khi hover (`DashboardGrid.css:27-30`); ảnh edit mode thấy glyph ở góc dưới trái card | Ẩn glyph | [ảnh] |
| S21 | Animation khi dời | .3s trên left / top / width / height (`gridstack.scss:212-219`) | Mặc định của thư viện | Kiểm rồi đặt .3s | [nghi] |
| S22 | Breakpoint | Padding nội dung đổi ở `max-width: 768px` (`DashboardDetail.scss:250`) | 767px (`DashboardPage.css:127`) | Đổi thành 768 | [code] |
| S23 | Nav app header | Nút "Dashboards" bắt đầu ở x=836 | x=832 | Lệch 4px, tìm nguyên nhân (khoảng cách item hoặc cỡ chữ) | [ảnh] |

Đã khớp, không cần làm: gradient nền trang; padding thân 13px 15px 15px; padding nội dung 25px 30px (mobile 22px
20px); padding header 13px 47px 0 28px; title 20px / 500 / 23.44px; nút back / rename 24px; nút header (padding 8px,
bo 4, icon 16px, hover); thứ tự nút theo mode; menu Options (min-width 150px, item 16px, 12px chữ); nút gear 26px;
trigger main date (180px, 14px); popover 646px; grid 48 cột, ô 32px, margin 10px; mặc định của card (`#fff`, bo 20px,
padding 15px, viền 1px `#e5e5e5`); app header 68px.

## Bước 2: Widget

### Trạng thái của widget

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W1 | Loading | Xem F4 | antd `Spin` (`dash:widgets/chart/ChartWidgetView.tsx:21`) | Dùng F4 | [code] |
| W2 | Đang cập nhật | Chart vẫn hiện dưới lớp phủ `background: var(--hover-color); filter: opacity(.6)` kèm spinner (`v1sh:components/StatusWidget.vue:9-14,82-90`) | Chỉ table có `loading` của antd; chart khác không hiện gì (`ChartWidgetView.tsx:21`, `useChartWidget.ts:115`) | Thêm lớp phủ khi `isFetching && data` | [code] |
| W3 | Lỗi | Xem F4 | Xem F4 | Dùng F4 | [code] |
| W4 | Dữ liệu rỗng | Xem F4 | Không có nhánh `hasData` | Thêm nhánh, dùng F4 | [code] |
| W5 | Chart chưa hỗ trợ | Chữ thường "Chart unsupported" ở góc trên trái (`v1dash:widget-container/charts/chartwidget/ChartComponent.vue:40-42`) | Title giữa và "… is not supported yet" (`dash:charts/ChartRenderer.tsx:78-87,153`) | Nhỏ; sửa nếu muốn khớp chữ | [code] |

### Thanh action ở góc trên phải của card

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W6 | Icon filter đang áp | Glyph `di-icon-filter-small` / `di-icon-disable-filter` trong nút 40px, màu `--text-color`, hover `--hover-color`; chấm 8px `--accent` opacity .8 ở `top:20%; right:8px` (`v1dash:widget-container/charts/action-widget/ActionWidgetFilter.vue:4-11,98-120`) | antd `Button type="text" size="small"` 24px, `FilterOutlined`, `Badge dot`, `opacity-50` khi tắt (`dash:widgets/chart/AppliedFiltersView.tsx:39-43`) | Đổi icon, kích thước, chấm | [code] |
| W7 | Popover filter đang áp | 256px, padding 16px, bo 4, biến `--menu-*`, không mũi tên; title semi-bold 14px; đường kẻ 1px `rgba(255,255,255,.1)` margin 16px; dòng 14px, .6px, margin `0 12px 16px`, tên viết hoa chữ đầu, giá trị opacity .5 (`ActionWidgetFilter.vue:13-21,122-150`, `FilterItem.vue:59-67`) | antd Popover có mũi tên, `w-64`, `Divider` / `Typography` / `Switch` nhỏ, không mount trong trang (`AppliedFiltersView.tsx:20-39`) | Class `dashboard-popover`, `getPopupContainer`, `arrow={false}`, khoảng cách v1 | [code] |
| W8 | Inner filter | Chọn dạng theo bề rộng widget: dưới 550px là nút 40×40 với `ic-inner-filter.svg` 14px; tab (`NormalTabItem`, cách 8px, tối đa 210px, margin-top 6px); hoặc dropdown cao 28px, tối đa 140px, nền `--tab-filter-dropdown-background` (`v1dash:widget-container/charts/chartfilter/ChartFilter.vue:2-49,283-325`). Popover 90–210px, padding 8px, dòng 16px 8px, dấu check 16px `#597FFF` ở dòng đang chọn, cao tối đa 250px (`ChartFilterPopover.vue:112-150`) | Luôn là antd `Select size="small"` 24px `w-36` (`dash:widgets/chart/InnerFilterView.tsx:22-32`); trên ảnh nó đè lên title chart | Làm ba dạng như v1 | [ảnh] |
| W9 | Panel menu "more" | padding 0, rộng 210px (`ActionWidgetMore.vue:373-393`) | padding 4px, `margin-top: 4px` (`dash:widgets/menu/WidgetMenu.css:41-49`), dòng còn 202px; trên ảnh menu lệch phải 14px so với v1 | Bỏ padding và margin | [ảnh] |
| W10 | Nút mở menu ở view mode | Hai nút 40px `di-icon-zoom` và `di-icon-drilldown` (`ActionWidgetMore.vue:29-47`) | "⋮" khi hover (`dash:widgets/menu/WidgetMenuView.tsx:45`) | Quyết định ở mục 1 đầu tài liệu | [code] |
| W11 | Mục trong menu widget (edit mode) | Mọi dòng có icon; nhãn "Duplicate chart" | "Update chart filter" và "Delete chart filter" không icon; nhãn "Duplicate" | Thêm icon (`di-icon-filter` kiểu thanh trượt, thùng rác), sửa nhãn | [ảnh] |

### Menu

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W12 | Menu điểm chart / chuột phải | `vue-context`: min-width 160px, padding 4px 0, bo 4, biến menu (`custom-vue-context.scss:8-16`, `v1dash:WidgetContextMenu.vue:413-415`); dòng padding 6px 12px, 14px/400, `--secondary-text-color`, hover `--text-color` trên `--hover-color` (`action-widget/DataListing.vue:51-62`, `v1:themes/scss/mixin.scss:93-103`); xếp dòng theo alphabet (`DataListing.vue:34`), không có câu `Use "X" as a filter` | antd Dropdown trần, không class, không `getPopupContainer` (`dash:widgets/chart/PointMenuView.tsx:16-23`) | Class theme, kích thước dòng; quyết định giữ hay bỏ câu chữ mới | [code] |
| W13 | Submenu Change date function | Context menu riêng, min-width 160px, cao tối đa 350px có cuộn, dòng `DiButton` padding 8px cách 4px, 14px (`action-widget/zoom/ZoomSettingContextMenu.vue:51-57`, `zoom/ZoomSetting.vue:49-63`) | Submenu antd; popup không nằm trong `.widget-menu` nên `WidgetMenu.css` không tới (`dash:widgets/chart/chartMenus.utils.ts:104-116`) | Cho submenu `popupClassName`, lặp lại rule | [code] |
| W14 | Chọn drill down | Panel 300×450px, padding 16px: breadcrumb (icon nhà, semi-bold 14px, tối đa 270px), đường kẻ, title 14px, danh sách field có search và nhóm, mũi tên 37px ở field ngày mở popover function (min-width 200px), danh sách giá trị tối đa 300px (`action-widget/drilldown/DrilldownSetting.vue:3-60,427-527`, `DrilldownSettingContextMenu.vue:74-93`) | Submenu antd lồng nhau (`chartMenus.utils.ts:58-74`) | Dựng panel như v1 | [code] |

### Chart

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W15 | Drill path | Vẽ trong subtitle của Highcharts, giữa, dưới chữ subtitle; 12px `--text-color`; `di-icon-drilldown` 16px `mr-2`; giá trị bấm được; ngăn bằng `ic-16-arrow-right.svg` 12×12 padding `0 2px`; cấp hiện tại opacity .6 (`v1sh:components/charts/BaseChart.ts:141-150,273-292`, `BaseChart.scss:1-23`) | antd `Breadcrumb` phía trên chart, căn trái, nút màu link, ngăn bằng "/", chiếm một dòng riêng (`dash:widgets/chart/DrillPathView.tsx:15-27`) | Chuyển vào subtitle | [code] |
| W16 | Nền tooltip | `ChartOption.CONFIG` không đặt, nên trắng mặc định (`web/di-core/common/domain/model/chart-option/ChartOption.ts:76-170`) | `var(--tooltip-background-color)` (`#f2f2f7` ở theme sáng) (`dash:charts/highchartsBase.ts:45`) | Quyết định ở mục 1 | [code] |
| W17 | Bước trục Y | "v2 Builder" column: 0 / 2.5M / 5M / 7.5M; line: 0 / 5 / 10 / 15 / 20; area: bước 100k; "v2 Sample": bước 20M | Column: 0 / 5M / 10M; line: 0 / 10 / 20; area: bước 250k; Sample: bước 25M | v1 dùng Highcharts `^11.1.0`, v2 `^13.1.1`; option đã port một-một nên phần lệch do thư viện. Ghim `tickAmount` / `tickInterval` / `tickPixelInterval`, so ảnh từng loại | [ảnh] |
| W18 | Nhãn trục X | Khoảng 11px, nhãn dài bị cắt ("Australia and Oce…") | To hơn (khoảng 13px), không cắt | Đặt lại `xAxis.labels.style.fontSize` và ellipsis | [ảnh] |
| W19 | Legend | Một dòng, cắt "…" ("Central America and the Caribb…") | Xuống dòng | Đặt `itemStyle.textOverflow: 'ellipsis'` và `itemWidth` | [ảnh] |
| W20 | Ký hiệu legend của area | Hình tròn | Chữ nhật | Đặt `legendSymbol` / `symbolRadius` | [ảnh] |
| W21 | Nhãn pie | Hai nhãn, không chồng | Nhiều nhãn chồng nhau, chữ to hơn | So `dataLabels` (`dash:charts/pie/pieChartOptions.ts`) với v1; Highcharts 13 đổi cách lọc nhãn chồng | [ảnh] |

### KPI

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W22 | Glyph icon (có theme) | 32px trong ô 48px (`v1sh:components/charts/number-render/layout-implement/normal-layout/NormalLayout.scss:186-198`); 59px trong ô 89px của layout area, cách phải 28px (`number-render/NumberRenderer.scss:158-166`) | `text-2xl` (24px) và `text-5xl` (48px), `gap-4` (`dash:charts/kpi/KpiIcon.tsx`, `KpiView.tsx:62-63`) | Đổi cỡ | [code] |
| W23 | Khoảng cách (có theme) | 28px dưới icon và dưới khối title, subtitle cách trên 8px (`NumberRenderer.scss:30-45`) | `gap: 16px` đều (`dash:charts/kpi/Kpi.css:10-13`); trên ảnh title v2 cao hơn v1 12px, giá trị cao hơn 24px | Đặt khoảng cách theo v1 | [ảnh] |
| W24 | Postfix | "$" cỡ lớn, màu xám, cùng font | "$" nhỏ, đậm màu, trông như font khác | So style prefix / postfix (`KpiValue.tsx`) với v1 | [ảnh] |
| W25 | Pill phần trăm | padding 3px 19px, bo 30px, `top: calc(28px + var(--widget-padding))`, `right: calc(11px + var(--widget-padding))` (`NumberRenderer.scss:74-78,260-266`) | padding 2px 8px, bo 12px, `top: 45.5px; right: 24px`, weight 500 (`Kpi.css:111-125`) | Đổi | [code] |
| W26 | Layout trend (có theme) | Giá trị và icon cùng hàng `space-between` (icon bên phải), cách dưới 11px; padding 15px 9px; phần trăm cách trên 44px (`NumberRenderer.scss:82-113`, `trend-line-layout/TrendLineLayout.tsx`) | Icon rồi giá trị từ trái, `gap-4`, phần trăm `mt-6`, padding 18px 11px (`KpiView.tsx:45-55`) | Đổi | [code] |
| W27 | KPI không theme có trend line | Header (flex 2, margin 0 16px): title và giá trị căn trái, ẩn subtitle, so sánh ở góc trên phải; trend chart bên dưới (flex 1) (`number-render/KPIRenderer.scss:6-61`, `normal-layout/NoneThemeLayout.tsx:47-73`) | Một cột căn giữa: header, date range, giá trị, bar, trend (`KpiView.tsx:25-42`) | Dựng lại layout | [code] |
| W28 | Thanh so sánh (không theme) | Icon 24px cách phải 8px, chữ 14px/500, .23px, `--text-color`; chỉ phần trăm nhận màu lên / xuống (`#4dcf36` / `#ea6b6b`); bốn biến thể `displayAs` (`number-render/PercentageBar.vue:2-25,80-125`, `number-widget/NumberWidget.tsx:43-44`) | Một biến thể, tô màu cả thanh, gap 4px, icon bằng cỡ chữ (`Kpi.css:99-105`, `kpi/kpiComparison.utils.ts:70-72`) | Làm đủ bốn biến thể | [code] |
| W29 | KPI và padding card | `.number-widget-container` là `position:absolute; inset:0` (`number-widget/NumberWidget.scss:8-16`), có thể bỏ qua padding của widget; tuỳ rule nào thắng giữa `.chart-holder-component--status { position: unset }` và `.di-status-widget { position: relative }` | `.kpi` luôn nằm trong padding (`Kpi.css:10-19`) | Kiểm bằng devtools trên v1 | [nghi] |
| W30 | Tooltip số | `.number-tooltip`: padding 4px 8px, không mũi tên | antd Tooltip | Style lại | [code] |

### Table

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W31 | Icon sort | Một `fa-caret-down` / `fa-caret-up` với `ml-2`, chỉ ở cột đang sort (`v1sh:components/charts/custom-table/header/TableHeaderRenderEngine.ts:111-121`) | Sorter hai mũi tên của antd ở mọi cột sort được, có nền hover (`dash:charts/table/table.utils.ts:83-96`) | Thay bằng icon v1 | [ảnh] |
| W32 | Bề rộng cột | Ba cột thấy được trong card (region, country, total_revenue) | Bốn cột, header bị cắt ("total_rev…") | So cách tính bề rộng cột tối thiểu của v1 | [ảnh] |
| W33 | Pagination | Pill bootstrap `sm`; `page-link` nền `--row-even-background-color`, màu `--table-header-color`, không viền, bo 7px; trang hiện tại nền `--header-background-color`, màu `--table-page-active-color`; disabled opacity .5; đủ first / prev / next / last; footer cao 25px, cách trên 10px (`v1sh:components/charts/table/Pagination.vue:17-40,122-140`, `table/TableStyle.scss:28-41`) | Pagination nhỏ của antd, chỉ wrapper có style, `margin-top: 8px` (`dash:charts/table/FlattenTable.css:180-192`, `FlattenTableView.tsx:65-74`) | Style lại | [code] |
| W34 | Chọn số dòng | "Showing [n] entries", 12px, .2px, cách phải 15px (`Pagination.vue:6-16`, `TableStyle.scss:43-57`); tổng là "{n} {totalRowTitle}" | `showSizeChanger: false`; tổng ghi cứng "rows" 14px | Thêm select và câu chữ | [code] |
| W35 | Hover dòng | Không có rule (`custom-table/Table.scss`) | `tr:hover > td { background: var(--hover-color) }` (`FlattenTable.css:176-178`) | Bỏ | [code] |
| W36 | Scrollbar | 5px, thumb `--scrollbar-background`, bo 4, hover `--scrollbar-hover`, track trong suốt (`Table.scss:340-373`) | Không có CSS scrollbar | Thêm | [code] |
| W37 | Nút expand | Cách phải 5px, glyph từ path SVG có sẵn (`Table.scss:85-95`, `custom-table/body/TableBodyRenderEngine.ts:50-76`) | 8px, hai rect 8×1.2 tự vẽ (`FlattenTable.css:224-235`, `table/CollapseToggle.tsx`) | Dùng path của v1 | [code] |
| W38 | Tooltip ô | padding 6px 16px, bo 1px, 14px, tối đa 30vw, cắt 15 dòng (`Table.scss:484-500`) | Chưa đọc `table/TooltipCell.tsx` | Đọc rồi so | [nghi] |

### Filter widget

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W39 | Icon help của subtitle | `ic_help.svg` `ml-2` sau title, subtitle là tooltip (`v1sh:components/charts/widget-renderer/DefaultTabFilter.tsx:70-76`, `DefaultTreeFilter.tsx:65`) | `dash:charts/filter/` không nhắc subtitle | Thêm | [code] |
| W40 | Chữ của tab item | `--tab-filter-de-active` (= `--text-color`), `line-height: 1` (`v1sh:components/filters/NormalTabItem.vue:46-48`) | `--secondary-text-color` (`dash:charts/filter/FilterWidget.css:115`). Viền `#d6d6d6` đã khớp | Đổi màu | [code] |
| W41 | Popup dropdown (tab filter dạng dropdown, dropdown filter) | Xem "Popup của select" ở F2; cao tối đa 250px, item cách 4px | Popup antd Select chưa style (`dash:charts/filter/TabFilterOptionsView.tsx:20-27`) | Dùng token F1 và CSS | [code] |
| W42 | Slicer | Cách dưới input 16px; ô ngày là `DiButton` nền `--tab-filter-dropdown-background` (`v1sh:components/charts/slicer-filter/NumberSlicer.vue:3,291-298`) | antd `DatePicker` trong suốt viền `#d6d6d6` (`dash:charts/filter/SlicerFilterView.tsx:48-52`, `FilterWidget.css:161-169`); trên ảnh nút kéo của v2 to hơn (khoảng 16px so với 12px) | Đổi nền, cỡ nút kéo | [ảnh] |
| W43 | Date select | Chỉ có chữ khoảng ngày và `ic-16-arrow-down.svg` bên phải, xoay 180° khi mở (`v1sh:components/charts/date-filter/DateSelectFilter2.vue:17-25,121-145`) | Thêm `di-icon-calendar` 16px bên trái, `DownOutlined` 12px không xoay (`dash:charts/filter/DateSelectFilterView.tsx:35-39`) | Trên ảnh v1 vẫn có icon lịch bên trái ở dashboard "v2 Filters"; kiểm lại biến thể nào đang dùng, rồi đổi mũi tên | [nghi] |
| W44 | Input filter | `padding: 0 4px` (`v1sh:components/charts/input-filter/input-filter.scss:26-32`); placeholder 12px | `0 8px` (`FilterWidget.css:172-174`); placeholder 14px | Đổi padding và cỡ placeholder | [ảnh] |
| W45 | Tree filter | Trên ảnh: không có checkbox, dòng cách nhau 32px, chữ thụt xa mũi tên | Có checkbox ở mọi dòng | Kiểm trên v1 (có thể là chế độ chọn một, hoặc icon checkbox không tải được) trước khi sửa | [nghi] |

### Tab widget, filter panel, ảnh, text

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| W46 | Mũi tên chọn tab | `di-icon-arrow-down` ở cuối thanh tab khi có từ 3 tab, cả ở view mode (`v1dash:widget-container/other/TabViewer.vue:55-66`) | Không có (`dash:widgets/tab/TabNavView.tsx:23-39`) | Thêm | [code] |
| W47 | Tab rỗng / panel rỗng | Chữ 16px và dòng thứ hai "**Click here** to add" (đậm, accent, gạch chân) (`TabViewer.vue:23-28,459-473`, `other/FilterPanelViewer.vue:30-35`) | Tab: chỉ chữ (`dash:widgets/tab/TabWidgetView.tsx:36-39`). Panel: antd `Empty` (`dash:widgets/filter-panel/FilterPanelView.tsx:37`) | Viết lại | [code] |
| W48 | Header dọc của filter panel | Đọc `header.position === 'vertical'` (`FilterPanelViewer.vue:357-367`) | `filterPanelLook` không đọc `position` (`dash:widgets/filter-panel/filterPanel.utils.ts:21-38`) | Làm layout dọc | [code] |
| W49 | Gear của filter panel | Tuyệt đối bên phải, padding 9px, icon 14px (`FilterPanelViewer.vue:536-548`) | Nút 40px kéo vào bằng margin −8px (`dash:widgets/filter-panel/FilterPanel.css:34-37`) | Đổi | [code] |
| W50 | Hover "⋮" của tab | Có nền `--hover-color` (`TabViewer.vue:593-597`) | Chỉ đổi màu (`WidgetMenu.css:37-39`) | Thêm nền | [code] |
| W51 | Ảnh phủ kín card | `.image-viewer { position:absolute; top:0; left:0; width:100%; height:100% }`, phủ cả padding (`v1dash:widget-container/other/ImageViewer.vue:47-52`); có trạng thái loading, lỗi, rỗng | `size-full` trong thân có padding, thụt vào 15px (`dash:widgets/image/ImageWidgetView.tsx`); không có trạng thái nào | Đổi vị trí, thêm ba trạng thái | [code] |
| W52 | Text widget thường | Textarea bootstrap read-only (`form-control`, có padding và viền nếu không bị reset) (`v1dash:widget-container/other/TextViewer.vue:13-22,133-137`) | Div trần (`dash:widgets/text/TextWidgetView.tsx`) | So ảnh | [nghi] |
| W53 | Thanh zoom | `ZoomControlBar`: icon zoom in / out (`v1dash:widget-container/charts/zoom-control-bar/ZoomControlBar.vue`) | Không có | Thêm nếu giữ zoom | [code] |

Đã khớp: card (nền, bo 20px, padding 15px); `ChartOption.CONFIG` → `BASE_CONFIG`; `SeriesChartOption.DEFAULT_SETTING`
→ `SERIES_DEFAULTS`; `PieChartOption.DEFAULT_SETTING` → `PIE_DEFAULTS`; table (dòng 48px, padding ô 12px, header 12px
đậm, zebra, đường kẻ, total sticky, thụt 12px mỗi cấp); menu "more" (210px, dòng 8px, cách 4px, 14px, icon 16px, gear
40px); tab widget (padding tab 6px 12px, gap 1px, title tối đa 200px); filter panel (padding header, thân, footer,
nút Apply); search box của filter (34px, viền `#e7ebee`); khoảng cách lựa chọn 12px; ô input và ngày 32px; KPI không
theme (padding 16px, giá trị weight 500).

Chưa so: option của stacked, funnel / pyramid, parliament, variable pie; header của pivot; popover ngày; tree chọn
một; theme tối.

## Bước 3: Chart builder

v2 không có file CSS nào trong `features/chart-builder`, `shared/database-tree`, `shared/field-dnd`,
`shared/properties`; mọi style là class Tailwind hoặc mặc định antd. Builder của v1 đặt `--data-builder-bg #f2f2f7`
và `--builder-panel-bg #fff` (`v1:themes/dashboard-theme.scss:311-314`).

### Khung

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B1 | Accent | `#597fff` cho tab đang chọn, viền drop, link, toggle, nút primary | `#0066ff` (`v2:app/global.css:13`) | Biến CSS trên wrapper và `ConfigProvider` lồng (F1) | [ảnh] |
| B2 | Khung modal | max-width 1400px, cao `calc(100vh - 100px)` trong khoảng 640–735px, bo 20px, body padding 0, overflow hidden (`v1dash:data-builder-modal/ChartBuilderModal.vue:170-194`); backdrop `#131317` .7 | Cùng rộng và cao, nhưng bo 8px, padding khoảng 20–24px, mask `rgba(0,0,0,.45)` (`cb:modal/ChartBuilderModalView.tsx:49-58`) | Bo 20px, padding 0, min-height 640px, mask tối | [ảnh] |
| B3 | Rail Builder / Settings | Rộng 134px, trắng, cao hết modal; menu bắt đầu ở 60px; item cao 40px, 16px/400, icon 13px cách phải 10px, icon và chữ cùng hàng; item cách nhau 18px; đang chọn / hover nền `#e5f4ff`, chữ accent, thanh accent 6px bên trái (`v1cb:chart-builder2/ChartBuilderController.scss:13-54`) | Rộng 80px, icon trên chữ, chữ 12px, icon 18px, pill bo tròn `bg-brand/10`, viền phải `black/10` (`ChartBuilderModalView.tsx:62-73`) | Dựng lại như v1 | [ảnh] |
| B4 | Vùng làm việc | Nền `#f2f2f7`, padding `18px 13px 20px 11px`, header cách thân 16px (`ChartBuilderController.scss:71-78`); panel là card trắng bo 4px | Trắng toàn bộ, `pl-4`, không card (`ChartBuilderModalView.tsx:77-104`) | Nền xám, panel trắng | [ảnh] |
| B5 | Header | Cao 28px; `h3` 24px, .2px, line-height 1.4, weight thường; Cancel là nút viền (1px `#d6d6d6`, chữ `#5f6368`), Add / Save là primary; cả hai rộng 64px, padding `5px 0`, 14px, cách 16px; primary disabled `#bebebe` (`ChartBuilderController.scss:80-107`, `v1cb:chart-builder2/ChartBuilderHeader.vue:55-63`) | `Typography.Title level={4}` (20px/600), nút antd 32px, gap 8px (`ChartBuilderModalView.tsx:78-88`) | Style lại | [ảnh] |
| B6 | Các cột | Database 238px (bo `4px 0 0 4px`), cách 8px, config 385px (bo `0 4px 4px 0`, padding trong `0 16px`), cách phải 8px; settings 631px padding 16px; preview flex 1 (`ChartBuilderController.scss:136-171`) | 240 / 320 / 576px, gap 16px, không nền (`ChartBuilderModalView.tsx:92-99`) | 238 / 385 / 631, gap 8px, nền trắng | [ảnh] |

### Loại chart

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B7 | Picker | Bootstrap `lg` (800px), không header, không X, body padding 24px; title giữa 24px/500, subtitle 14px `#5f6368`, cách 16px; danh sách cao tối đa 450px, flex-wrap căn giữa. Card 118×126px, margin 12px, padding `24px 12px`, nền `#f2f2f7`, bo 4, viền 1px cùng màu xám, đổi accent khi hover / chọn; icon 48px; title 14px/500 `#5f6368` cách icon 12px (`v1cb:config-builder/chart-selection-panel/VisualizeSelectionModal.vue:72-105`, `VisualizationItem.vue:58-118`). Trên ảnh: 5 cột, 15 loại | antd `Modal` 820px, title căn trái có X; grid `minmax(110px,1fr)` gap 8px (6 cột); card trong suốt viền `black/10`, bo 8, padding 12; icon 40px; title 12px; hiện cả loại disable (`cb:picker/ChartTypePickerModal.tsx:17-29`) | Dùng card và header của v1; danh sách loại theo mục 1 | [ảnh] |
| B8 | Đổi loại trong builder | Nhãn "Type" 14px/500 và nút ghost "View all" có mũi tên; dải cuộn ngang nền `#f2f2f7` padding 12px; ô 60×60px trắng, padding 10px, bo 4, shadow `0 2px 8px rgba(0,0,0,.08)`, cách 16px, viền accent khi chọn, có tooltip. "View all" mở popover 600×450px gồm các card 118×126 (`v1cb:config-builder/chart-selection-panel/VisualizationItemListing.vue:108-224`, `VisualizationItem.vue:89-111`) | antd `Select` với icon 16px (`cb:picker/ChartTypeSelectView.tsx:14-32`) | Dựng dải và popover. Mục lệch lớn nhất của builder | [ảnh] |

### Cây field

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B9 | Tab Database / Chart Control | Thanh full-width cao 40px, sát đỉnh panel, cách dưới 12px; hai ô bằng nhau nền `#fafafb`; ô đang chọn trắng, icon và chữ accent; chữ 12px/500 (`v1cb:config-builder/database-listing/DatabaseListing.scss:11-44`) | antd `Segmented` nhỏ (`cb:field-tree/FieldTreeView.tsx:38-48`) | Thay bằng thanh v1 | [ảnh] |
| B10 | Hàng chọn database | Padding `0 12px 12px`; dropdown cao 32px viền 1px `#d6d6d6`; nút search là `ic_search.svg`; ô search cao 34px, trắng, bo 4, viền `rgba(231,235,238,1)`, 14/18 (`DatabaseListing.scss:51-76`, `DiSearchInput.vue:100-135`). Placeholder của Chart Control: "Search tab controls..." | antd `Select`, `Button` text, `Input`, không padding panel (`FieldTreeView.tsx:50-73`). Placeholder: "Search chart controls..." | Style lại; quyết định câu placeholder | [ảnh] |
| B11 | Dòng của cây | 12px, .2px, `#4f4f4f`; dòng bảng weight 500, padding title `5px 1px 2px 5px`; caret FontAwesome 16px; thụt 20px mỗi cấp; icon kiểu 16px cách phải 10px; hover `#f9faff`; "⋯" của bảng luôn hiện (nút tròn 24px) (`v1sh:components/builder/treemenu/SlVueTreeDark.css:32-122`, `SlVueTreeMinimal.css:173-176`, `DatabaseListing.vue:187-205`). Trên ảnh: dòng cách nhau 36px, dòng đầu có nền hover | 14px, `px-2 py-1.5 gap-2`, caret antd, thụt `pl-4` (16px), hover `black/5`, "⋯" ẩn tới khi hover (`cb:field-tree/TableHeaderView.tsx:15`, `FieldLabelView.tsx:24-28`, `TableTreeView.tsx:21`, `v2:shared/menu/ActionMenuView.tsx:33`). Trên ảnh: dòng cách nhau 34px | 12px, thụt 20px, màu hover v1, "⋯" luôn hiện ở bảng, dòng 36px | [ảnh] |
| B12 | Drag ghost | Rộng 200px, viền 1px `rgba(85,119,255,.6)`, trắng, padding `3px 16px`, gap 4px, tay nắm `move.svg` 18px trước icon, không shadow (`v1:themes/scss/data-builder/custom/_dark-dashboard.scss:748-776`) | `bg-white shadow-md ring-1 ring-black/10 rounded`, không tay nắm (`FieldLabelView.tsx:24`) | Đổi | [code] |
| B13 | Trạng thái rỗng | `directory-empty.svg` và "No found tables & columns", hoặc `EmptyDirectory` "Database empty" / "Chart control empty" (`DatabaseListing.vue:145-158`) | Chữ xám "No fields available" / "No chart controls available" (`TableTreeView.tsx:12`, `ControlListView.tsx:8`) | Viết lại | [code] |
| B14 | Dấu measure / calculated | Chưa đọc `FunctionIcon` của v1, chưa kiểm chữ nghiêng | `FunctionOutlined` màu brand, tên nghiêng (`FieldLabelView.tsx:10,28`) | Đọc v1 rồi so | [nghi] |

### Zone

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B15 | Title của zone | 14px/500, .6px; "(optional)" 14px `#5f6368` cách trái 5px; title cách ô 16px; zone cách nhau 16px (`v1sh:components/DropArea.vue:58-93`, `v1cb:config-builder/ConfigBuilder.vue:78-80`) | "(optional)" `text-xs`; title cách ô `gap-1` (4px) (`cb:config-panel/ZoneTitleView.tsx:4-6`, `ZoneView.tsx:26`) | Đổi | [ảnh] |
| B16 | Ô drop | Bình thường: nền `#f2f2f7`, viền liền 1.5px cùng màu, bo 4. Khi đang kéo: `dashed 1.5px` accent. Không có nền hover (`DropArea.vue:70-90`) | Bình thường: `border-solid border-gray-300`, không nền, `p-2`. Nhận được: nét đứt brand. Hover: `bg-brand/5` (`v2:shared/field-dnd/FieldDropZone.tsx:25-36`) | Nền xám, viền ẩn khi bình thường, padding 0 | [ảnh] |
| B17 | Hint | Ảnh `ic-drag.svg`, chữ 14px `#4f4f4f`, padding 16px, căn giữa, "click here" là link bootstrap màu accent không gạch chân; ghim ở đáy khi zone có item (danh sách thêm padding dưới 49px) (`v1cb:config-builder/config-panel/ConfigDraggable.vue:55-61`, `ConfigDraggable.scss:36-46`, `DropArea.vue:78-84`). Chữ lấy từ `config.placeholder` của zone | `DragOutlined`, `text-black/45`, căn trái, `px-1 py-1.5`, nút gạch chân màu brand (`cb:config-panel/DropHintView.tsx:16-22`); ghi cứng "Drag and drop your fields or" | Đổi icon, màu, căn giữa; lấy chữ theo zone | [ảnh] |
| B18 | Item đã thả | Không nền (chỉ `#f9faff` khi đang được chọn để sort, `#597fff0d` khi `:active`); padding item 8px, margin danh sách 8px, item cách 8px. Link function / kiểu / sort 14px thường, gạch **liền**, padding `0 4px`, `#5f6368`, hover `#4f4f4f`. Tên **đậm**, có tooltip. "Top N value(s)" đậm 14px. "⋯" là `di-icon-three-dot` 14px trong ô 20px, hiện theo hover dòng (`v1cb:config-builder/config-panel/DraggableItem.vue:2-22,99-108`, `ConfigDraggable.scss:9-79`, `v1sh:components/DropItem.vue:180-183`) | Pill `bg-black/[0.03] rounded min-h-8`; link `underline decoration-dotted`; tên `font-medium`; top-N `text-xs text-black/45`; `MoreOutlined` luôn hiện (`cb:config-panel/ZoneItemView.tsx:41,62-83`, `MenuLinkView.tsx:16`) | Đổi | [ảnh] |
| B19 | Vạch chèn | 2px accent bo 4, trong dải `padding: 8px 0; margin: -8px 8px` (`DropItem.vue:148-163`) | `h-0.5`, `-my-1.5 py-1.5` (`v2:shared/field-dnd/FieldDropGap.tsx:17-18`) | Thêm thụt ngang 8px | [code] |
| B20 | Context menu (function, kiểu, sort, chọn field, "⋯") | Panel `vue-context`: trắng, bo 4, shadow `0 4px 4px #00000014`, không viền, min-width 82px, chữ căn giữa trong builder; item padding 8px, 14px, `#5f6368`, hover nền `#597fff0d` chữ `#4f4f4f`; item đang chọn có "✓" accent bên phải; tiêu đề nhóm đậm; menu field tối đa 316×250px, tên bảng đậm (`v1:themes/scss/data-builder/custom/vue-context.scss:6-46`, `_dark-dashboard.scss:98-146`, `ChartBuilderController.scss:66-68`, `ConfigDraggable.scss:82-85`, `v1cb:config-builder/config-panel/SelectFieldContext.vue:6-23`). Remove là dòng thường | antd `Dropdown`, item đang chọn tô nền (`cb:config-panel/FieldMenuView.tsx:19`, `MenuLinkView.tsx:15`). Remove màu đỏ `danger` | Theme lại menu antd, thêm "✓" | [code] |

### Filters

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B21 | Nhóm | Mỗi nhóm AND là card nền `#f9faff`, bo 4, margin 8px. Khi đang kéo: nhãn "AND" accent ở góc trên phải (padding `6px 8px`, bo `0 4px`) và dải "Add filter". Chữ "Or" 14px `#5f6368` (`v1cb:config-builder/filter-panel/FilterDraggable.vue:108-169`) | Không card; "OR" `text-xs text-black/45`; không nhãn AND (`cb:config-panel/filter/FilterZoneView.tsx:39-40`). Trên ảnh v2 có viền quanh nhóm | Dựng card và nhãn | [code] |
| B22 | Dòng condition | Padding `4px 8px`; tên đậm 14px không gạch chân; kiểu condition opacity .5; chip nền **accent**, chữ trắng 12px, padding `0 8px`, bo 4; "Click to filter" màu accent; "⋯" 20px (`v1cb:config-builder/filter-panel/FilterItem.vue:204-241`, `ChangeFieldButton.vue:79-93`, `v1sh:components/ChipButton.vue:26-49`) | Tên `font-semibold underline`; `Tag` xám của antd; "Click to filter" xám (`cb:config-panel/filter/ConditionItemView.tsx:33-51`) | Đổi | [ảnh] |
| B23 | Popover condition | Rộng 380px, padding `16px 20px 16px 16px`, shadow `0 4px 12px rgba(0,0,0,.16)`, không mũi tên, đặt phía trên; title semi-bold 14px .6px, dropdown mode (cao 26px) bên phải; thân margin trên dưới 24px; footer: nút ghost `di-icon-delete` (hover màu danger), Cancel viền accent, Apply primary (`v1sh:components/filters/dynamic-filter-panel/InternalFilterPopover.scss`, `InternalFilterPopover.vue:14-53`) | antd `Popover` có mũi tên, `placement="right"`, rộng 320px, gap 12px, Cancel mặc định, `DeleteOutlined` (`ConditionItemView.tsx:39`, `ConditionEditorView.tsx:48-72`) | Đổi; dropdown mode theo mục 1 | [code] |

### Preview

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B24 | Panel preview | Card nền `#fafafb`, bo 4, padding 16px, **không viền**; header "Visualization" 14px/500, cao 21px, cách thân 16px (`v1cb:viz-panel/VizPanel.vue:74-120`, `ChartBuilderController.scss:132-136`) | `border-black/10 p-3`, không title, nền lấy theo options của chart (`ChartBuilderModalView.tsx:101`) | Đổi | [ảnh] |
| B25 | Chart trong preview | Vẽ trong một card widget (bo 20px, shadow, khoảng 424×304px) nằm giữa panel | Vẽ kín panel | Bọc chart trong card; đọc `v1cb:viz-panel/PreviewPanel.vue` để lấy kích thước card | [ảnh] |
| B26 | Trạng thái hint | `idea.svg` 16px, "How to create a {chart}?" 14px/500, các dòng hướng dẫn 14px `#5f6368`, hình minh hoạ theo loại chart ở giữa. Dự phòng: icon chart 128px và "Learn to create … here" 16px (`v1cb:viz-panel/HintPanel.vue:3-27,64-132`) | antd `Empty` với một câu chung (`cb:preview/PreviewView.tsx:18`) | Dựng lại; cần asset ở F7 và nội dung hướng dẫn của từng loại | [ảnh] |
| B27 | Loading / lỗi | `DiLoading` và `ErrorWidget` | antd `Spin`; chữ đỏ 12px và nút Retry nhỏ (`PreviewView.tsx:20-28`) | Dùng F4 | [code] |

### Tab Settings

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B28 | Header của panel | Đường kẻ 1px (`#5f6368` opacity .1, ẩn ở panel đầu); padding `12px 0`; `ic-16-arrow-down/up.svg` 16px ở **bên trái**, cách phải 8px; `h6` viết hoa 14px/500 .6px (`v1cb:setting-modal/PanelHeader.vue:3-12,53-67`, `v1cb:chart-builder2/ChartBuilderController.vue:104-110`) | antd `Collapse ghost size="small"`, nhãn `text-xs font-semibold uppercase`, không đường kẻ (`cb:settings/settingItems.tsx:11`, `SeriesSettingsView.tsx:45`) | Nhãn 14px/500, icon v1, đường kẻ | [ảnh] |
| B29 | Label và khoảng cách | Label 14px, line-height 1.4, `#5f6368`, cách dưới 4px; dòng cách nhau 16px (`v1sh:settings/common/setting-style.scss:66-73`, `tabs/TitleTab.vue`) | `text-xs text-black/65`, `gap-3` (12px) (`cb:settings/fields/SettingField.tsx:13`, `tabs/TitleBlock.tsx:29`) | Đổi | [ảnh] |
| B30 | Input và dropdown | Cao 33px, nền `#f2f2f7`, không viền, chữ `#5f6368`; dropdown trong cao 31px; cỡ `small` rộng 64px (`setting-style.scss:15-41,96-98`, `v1sh:settings/common/InputSetting.vue:271-284`) | Control antd 32px trắng có viền; select cỡ chữ `w-20` (80px) (`TitleBlock.tsx:35`) | Đổi | [ảnh] |
| B31 | Ô màu | Input hex, nút swatch nối bên phải (swatch 20px, bo 4, viền 0.5px `#d6d6d6`) trên nền `#f2f2f7`; rộng 115 / 145 / 100%. Popover là Sketch picker 280px có "Reset to default" và Cancel / OK (`v1sh:components/ColorPicker.vue:3-41,365-387`, `setting-style.scss:83-93`) | Nút trắng có viền, swatch 16px bên trái, hex hoặc "Theme", `w-32`; antd `ColorPicker` không có Reset và OK (`cb:settings/fields/ColorSetting.tsx:18-26`) | Đổi. v1 hiện hex (`#4f4f4f`) ở chỗ v2 hiện "Theme": quyết định giữ nhãn "Theme" hay hiện hex | [ảnh] |
| B32 | Toggle | Track 27×16px, tắt `#ccc`, bật `#597fff`, nút 10px, nằm **bên trái** label 14px cách 8px; dòng cao 27px (`DiToggle.vue:71-156`, `setting-style.scss:9-13`) | Label trái, `Switch` nhỏ (28×16) phải, `justify-between` (`cb:settings/fields/ToggleSetting.tsx:13-15`) | Đổi | [code] |
| B33 | Slider | Ô số 42×34px, cách 12px, rồi track 6px (accent / `#d8d8d8`) với nút 14px accent viền trắng 2px (`v1sh:settings/common/SliderSetting.vue:7-20,116-121`, `DiSlider.vue:57-83`) | Chỉ antd `Slider`, không ô số (`cb:settings/fields/SliderSetting.tsx:18`) | Thêm ô số, style track | [code] |
| B34 | Align | Ba icon bootstrap trần, font-size 32px, padding 8px, dòng 34px, icon đang chọn màu accent, không khung (`setting-style.scss:43-63`, `v1sh:settings/common/AlignSetting.vue:7-11`) | antd `Segmented` (`cb:settings/fields/AlignSetting.tsx:21`) | Đổi | [ảnh] |
| B35 | Revert | Thẻ `<p>` 14px .6px, màu accent, căn phải, không padding (`setting-style.scss:169-177`) | antd `Button` link nhỏ (`cb:settings/fields/RevertButton.tsx:7`) | Sửa font và padding | [ảnh] |
| B36 | Dòng nhóm | Flex, cách dưới 16px; cách 12px sau ô màu, 16px sau cỡ chữ (`v1sh:settings/common/TabStyle.scss:3-7`, `TitleTab.vue:35-63`) | `gap-3`, rộng 128 / 80px (`TitleBlock.tsx:33-36`) | Rộng 115 / 64 | [ảnh] |
| B37 | Dòng conditional formatting | Toggle bên trái; `h6` accent "Advanced controls" bên phải, chỉ hiện khi toggle bật (`v1sh:settings/common/ToggleTextButtonSetting.vue:3-5,63-85`) | Link luôn hiện (`cb:settings/table/FormattingRow.tsx:14-18`) | Ẩn khi tắt | [code] |
| B38 | Icon "?" cạnh label | `di-icon-help` | Không có | Thêm ở các setting có hint trong v1 | [code] |

### Dialog của builder

| # | Phần | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| B39 | Config item | `DiCustomModal` cỡ `md`; header "Config **Data**" 16px và dòng xám 12px "Source table.**column**", không X; các `DiDropdown` có label (40px, nền `#f2f2f7`, không viền) xếp dọc; toggle có label bên trái; nút footer 42px chia đôi chiều rộng (`v1cb:config-builder/config-panel/ConfigModal.vue:2-66,178-203`, `DiCustomModal.vue:180-186`) | antd `Modal`, title "Config Data", có X, hai select function nằm cạnh nhau, footer mặc định (`cb:config-panel/ItemConfigModal.tsx:42-56`) | Đổi | [code] |
| B40 | Formula | Rộng 800 / 1000 / 1500px theo breakpoint; title "Create/Edit Calculated Field|Measure"; cột 6/3/3; input tên nền `#f2f2f7` không label; editor 434px (350 / 290 ở breakpoint nhỏ); footer trong cột trái, cách editor 32px, thanh 220px căn phải; danh sách function nền `#f2f2f7` cao 510px; title chi tiết đậm 17px (`v1cb:config-builder/database-listing/CalculatedFieldModal.vue:21-99,462-612`) | 1100px, hai cột với phần tham chiếu hai cột lồng trong, form antd có label, editor 340px, danh sách function `bg-black/[0.03]`, footer antd (`cb:field-actions/FormulaFieldDialogView.tsx:37-78`, `FunctionReferenceView.tsx:10-13`) | Đổi | [code] |
| B41 | Update table by query | Rộng 85% (tối thiểu 900px), cao 88vh; header và thân nền `#f2f2f7`; Cancel / Update trong header, cao 25px; cây database 250px bên trái; card query trắng (`v1cb:config-builder/database-listing/UpdateTableByQueryModal.vue:2-56,222-277`) | antd `Modal` 960px, chỉ có editor, nút ở footer (`cb:field-actions/UpdateTableQueryDialogView.tsx:23-39`) | Đổi; cây database và nút chạy query là chức năng, không chỉ style | [code] |
| B42 | Conditional formatting | `lg` 808px hoặc `sm` 360px; thân cao cố định 475px / 375px padding 24px; title 24px/500; không X; nút footer tối thiểu 64×26px, không viền trên; dòng rule cao 49px, padding `8px 12px`, `cursor: move` (`v1sh:settings/common/ConditionalFormattingModal.vue:81-126`, `conditional-formatting/RuleItem.vue:77-95`) | 720px / 420px, cao tự động, dòng rule có viền và xuống dòng (`cb:settings/table/ConditionalFormattingModal.tsx:29`, `RuleRow.tsx:30`) | Đổi. Chưa đọc `ColorScalePanel`, `RulePanel`, `IconPicker` của v1 | [nghi] |

Có ở v1, v2 chưa có (chức năng, ngoài phạm vi style): ô `AssistantSearch` "Describe your chart..." ở header
(`ChartBuilderHeader.vue:59`); `MatchingLocationButton` / `MatchingLocationModal` của chart bản đồ.

Đã khớp: max width 1400px và chiều cao modal; không X, không footer, backdrop và Esc không đóng; title "Chart
Builder"; chữ "Add"; hai icon rail `di-icon-config` và `di-icon-tool`; icon tab `di-icon-database` và
`di-icon-filter-control`; icon bảng; glyph kiểu cột 16px trên vòng tròn accent (`v2:shared/schema/ColumnTypeIcon.tsx`);
câu chữ của picker; "(optional)"; "click here"; viền nét đứt 1.5px khi nhận drag; vạch chèn 2px; tối đa 3 chip và chip
"+N"; mục menu Edit Measure / Config / Remove; "Revert to default"; title panel viết hoa; thứ tự panel.

Chưa so: `DataListing` và menu "⋯" của bảng / cột; `EmptyDirectory`, `FunctionIcon`; ô nhập giá trị trong popover
condition; theme tối; các tab setting ngoài Title và Legend.

## Bước 4: Dialog của dashboard

Chỉ ba dialog settings mount trong trang; các dialog khác render vào `<body>` với token của app. Sửa cùng F3.

| # | Dialog | v1 | v2 | Việc cần làm | Nhãn |
|---|---|---|---|---|---|
| D1 | Rename | 500px, title 24px/500, không X, input nền `#f2f2f7` cao 42px có label phía trên, báo lỗi tại chỗ (`v1sh:components/DiRenameModal.vue:2-27`) | antd Modal trần (520, title 16px, có X, input viền 32px), không mount trong trang (`dash:edit/RenameModalView.tsx:36-42`) | Style lại | [code] |
| D2 | Add / Edit Text | max-width 1071px; header là icon và "Add Text", padding `20px 35px 0`; hai nửa 50% cao 400px: trái có tab Text / HTML, mô tả xám và textarea 270px; phải là "Review", preview widget trực tiếp; dải config có viền `#f0f0f0` bên dưới: font family 161px, cỡ chữ 100px, B/I/U, align, màu, opacity %, rồi nhóm Background (màu và opacity); footer Cancel 83×40, Save 122×40 (`v1dash:EditTextModal.vue:2-18,101-134`, `PreviewText.vue:4-148`) | 640px một cột, toolbar trên textarea, HTML là Switch (`dash:edit/TextEditorModalView.tsx:39-71`). Thiếu: preview, font family, opacity chữ, màu và opacity nền, mô tả, tab | Dựng lại; nền và font family là chức năng mới | [code] |
| D3 | Tab / Filter Panel setting | Rộng 1200px, thân 600px, modal xám `--primary`, backdrop `rgba(0,0,0,.7)`; trái là preview trực tiếp (`calc(100% - 350px)`); phải là cột setting trắng 350px padding 16; Cancel và Save trong header (`v1:screens/data-cook/components/etl-modal/EtlModal.vue:8-16`, nút cao 24.67px). Field (`v1dash:widget-setting/TabWidgetSetting.vue:3-57`): Position, Font family, dòng màu + cỡ, Background active / inactive, Revert. Panel có thêm Footer title, Align và Revert riêng (`filter-panel-setting/FilterPanelFooterTab.vue:3-49`) (`v1dash:TabSettingModal.vue:2-31,117-152`) | antd Form 520px, label 8 cột, `Segmented` (`dash:edit/TabStyleModalView.tsx:35-78`). Thiếu: preview, font family, align, Revert, nút trong header | Dựng lại | [code] |
| D4 | Thêm / bỏ chart trong tab | 444px, trắng, title 24px thường và subtitle, nút trong header, ô search có viền, danh sách 400px gồm dòng 46px (icon chart 24px, title 14px/500, icon check bên phải, hover `--hover-color`) (`v1dash:AddChartModal.vue:2-48,173-227`) | `Checkbox.Group`, không search, không icon chart, không subtitle, nút ở footer (`dash:edit/PickWidgetsModalView.tsx:27-37`) | Dựng lại | [code] |
| D5 | Sort tab | 444px, "Sort Orders" 24px và "Drag to customize the order", dòng 46px kéo thả có icon kéo, danh sách 400px (`v1dash:SortModal.vue:2-33,81-124`) | Title "Sort tabs", antd List với nút lên / xuống (`dash:edit/SortTabsModalView.tsx:26-48`) | Theo mục 1; kéo thả dùng `@dnd-kit` đã có | [code] |
| D6 | Password | Xem S7 | Xem S7 | Xem S7 | [code] |
| D7 | View As | 560px, label "Select user", input 42px có popover gợi ý, rồi card user đã chọn và chip thuộc tính, OK = "Apply" (`v1dash:dashboard-control-bar/RLSViewAsModal.vue:2-37,149-170`) | 520px, antd Select, OK = "View As", thêm đoạn chú thích, không card user và chip (`dash:view-as/ViewAsModalView.tsx:18-38`) | Dựng lại | [code] |
| D8 | Relationship | 95vw, title 24px, X tròn (`v1dash:RelationshipModal.vue:2,50-66`) | Cùng kích thước, nhưng title antd 16px, X mặc định, bo 8 (`dash:relationship/RelationshipModal.tsx:54-64`) | Token F1 và X tròn | [code] |
| D9 | Share | Đã theo v1: 560px, container trong suốt, hai card bo 4 padding 24px, nút flex 42px (`v1sh:components/…/DiShareModal.vue:2-85,478-481`; `v2:features/share/ShareModal.tsx:21-31`, `ShareCard.tsx:14`, `SectionFooter.tsx:11-18`) | Còn: icon mục và nút primary màu `#0066ff`, nút bo 6 | Hết sau F1 | [code] |
| D10 | Themes | Đã khớp (`v1dash:dashboard-setting-modal/DashboardSettingModal.vue:54-160`, `settings.css:424-540`) | Còn: màu và cỡ Switch, hover của Cancel | Hết sau F1 | [code] |
| D11 | Edit Dashboard / Edit Widgets | Cấu trúc, tab và dòng field đã khớp (`EditDashboardModal.vue:2-33`, `v1dash:widget-setting/WidgetSettingModal.vue:1-43`, `dash:edit/settings/SettingsDialogView.tsx:38-76`) | Còn: thân min-height 469 (v1 480; `settings.css:110`, `EditDashboardModal.vue:149`); hover primary là opacity thay vì `--accent-hover-color`; hover Cancel đổi sang xanh; popup select và glow của input là mặc định antd | Sửa bốn điểm | [code] |
| D12 | Xác nhận xoá widget | 398px, không header, icon 48px giữa, "Please Confirm" 16px/500, thông báo xám 16px, hai nút flex 42px (`v1:screens/confirmation/view/ConfirmationModal.vue:2-22,69-109`) | antd `modal.confirm` (căn trái, Yes / No) (`dash:edit/useWidgetEditActions.ts:98-102`) | Viết component xác nhận riêng | [code] |

Có ở v1, v2 chưa có (chức năng): `PerformanceBoostModal.vue`, `TextAreaModal.vue`, `ActionModal.vue`, các modal
upload / duyệt / sửa ảnh (v2 chỉ có `ImageUrlModalView.tsx`).

Chưa đọc phía v1: bên trong `WidgetTextSetting`, `PaddingAndBorderSetting`, các `FilterPanel*Tab`; canvas của
relationship editor; UI drill through.

## Bước 5: Kiểm tra

- Sau mỗi bước, chụp lại hai bên và so từng cặp. Cách chụp đã dùng:
  - v2: đặt cookie `ssid` lấy từ `POST /user/auth/login` rồi mở `/dashboard/d-<id>`.
  - v1: phải đăng nhập qua form (`#input-email`, `#input-password`); chỉ đặt cookie thì bị đưa về `/login`.
  - Script chụp nằm ở thư mục tạm của phiên làm việc, không có trong repo. Muốn dùng lâu dài thì chép vào repo cùng
    `playwright-core`.
- Bổ sung vào bộ ảnh: một dashboard theme tối, một dashboard theme có accent khác (Anzac), mọi dialog ở bước 4, màn
  375px, hover của card và menu, lúc đang kéo field trong builder, builder của table và KPI.
- Trước khi coi một bước là xong: `pnpm typecheck`, `pnpm lint`, `pnpm test:run`, `pnpm build`.

## Thứ tự và phụ thuộc

1. **Bước 0** trước tất cả. F1 và F3 đổi màu và bo góc của mọi thứ, nên chụp lại toàn bộ sau bước này rồi mới so
   tiếp; một số mục ở bước 1 đến 4 sẽ tự hết (D9, D10, D8 một phần).
2. **Bước 1** và **bước 2** độc lập với **bước 3**; có thể làm song song.
3. Trong bước 3: B1 đến B6 (khung) trước, rồi B28 đến B36 (control của Settings, dùng lại ở mọi tab), rồi phần còn
   lại.
4. **Bước 4** sau khi quyết định xong mục 2 ở đầu tài liệu.
5. Các mục [nghi] phải kiểm trên v1 đang chạy trước khi sửa: S12, S14, S16, S21, W29, W38, W43, W45, W52, B14, B42,
   color picker ở F2.
