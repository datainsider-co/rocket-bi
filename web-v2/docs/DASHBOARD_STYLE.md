# Style trang Dashboard và Chart Builder cho khớp v1

Plan style lại trang `/dashboard/:name` của v2 (dashboard, chart builder và các dialog mở từ trang này) cho khớp v1.
Lập ngày 2026-11-10.

## Phạm vi: chỉ theme sáng

Quyết định ngày 2026-11-10: v2 chỉ hỗ trợ theme sáng (`light_*`). Theme tối (`dark_*`) nằm ngoài phạm vi của plan này:

- Không so ảnh, không sửa lệch và không ghi nợ kỹ thuật cho những gì chỉ xảy ra ở theme tối.
- Các mục bên dưới chỉ liên quan tới theme tối đã được đánh dấu "bỏ"; những chỗ ghi "chưa kiểm theme tối" không còn là
  việc phải làm.
- Code theme tối đã có (biến trong `dash:theme/dashboardTheme.css`, entry trong `dashboardThemes.ts`) để nguyên, không
  bảo trì. Chưa quyết dashboard đang lưu `dark_*` sẽ hiển thị thế nào (hiện vẫn vẽ theo theme tối, có lỗi đã biết ở
  dialog và control antd).

## Cách lập và độ tin cậy

- **Đọc code hai bên**: so SCSS / Vue của v1 với CSS / Tailwind / antd của v2, theo bốn mảng: khung trang, widget,
  chart builder, component nền và dialog.
- **Chụp ảnh hai bên** bằng Playwright ở 1440×900 trên docker local (v1 `localhost:5050`, v2 `pnpm dev`), dashboard
  "v2 Sample", "v2 Filters", "v2 Builder", "test". Đã xem 9 cặp: view mode của Sample và Filters, menu Adding, menu
  widget, picker, builder rỗng, builder có data, tab Settings.
- **Chưa kiểm**: các dialog của dashboard, mobile (375px), trạng thái hover / drag, các loại chart ngoài
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
   - ~~Nút "⋮" hiện khi hover ở view mode (W10).~~ Đã quyết ngày 2026-11-10: làm theo v1, xong ở bước 2.
   - Nền tooltip chart theo theme (W16). v1 để trắng mặc định của Highcharts.
   - ~~Add Text một cột, HTML là Switch (D2).~~ Làm theo v1 ở bước 4.
   - ~~Sort tab bằng nút lên / xuống (D5).~~ Làm theo v1 ở bước 4 (kéo thả; phím mũi tên vẫn dời được dòng đang focus).
   - Picker hiện cả loại chart chưa hỗ trợ ở dạng disable (B7). v1 chỉ liệt kê loại dùng được.
   - Filter mode nằm trong danh sách condition (B23).
   - Background dashboard chỉ nhận URL (server không có endpoint upload).
2. **Màu dialog trong theme tối.** **Bỏ** (ngày 2026-11-10, chỉ hỗ trợ theme sáng). Phần còn lại của câu hỏi là
   accent, **đã kiểm ngày 2026-11-11**: trên v1 ở theme Anzac, mọi dialog (Rename, Add Text, Sort, Add Chart, Config
   Tab, xác nhận xoá) nằm ngoài `#app` và dùng accent `#597fff`. v2 làm theo ở bước 4 (`DialogScope`). Ghi chú cũ:
   - `dash:edit/settings/settings.css:1-5` ghi rằng dialog v1 đổi theo theme.
   - Đọc code v1 thì ngược lại: biến theme chỉ áp cho `body[dashboard-theme=…] #app` và `div[widget-preview-area]`
     (`v1:themes/dashboard-theme.scss:57-58`); `DiCustomModal` là `BModal` của bootstrap-vue, có vẻ render vào
     `<body>`, ngoài `#app`; dialog kiểu `EtlModal` mang `builder-default-style`, cũng về giá trị gốc
     (`v1:themes/app-theme.scss:1-3`).
   - Nếu đúng thì dialog v1 luôn sáng với accent `#597fff`, kể cả ở dashboard theme Anzac.
   - Chụp một dialog trên v1 ở theme Anzac trước khi làm bước 4.
   - Bằng chứng thêm từ bước 1: popover lịch main date của v1 (render ngoài `#app`) luôn sáng với accent `#597fff` ở
     Anzac và hai theme tối. Dialog thì vẫn chưa chụp.
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

**Trạng thái: xong ngày 2026-11-10** (trừ các mục ghi "để lại" bên dưới). Đã đo và chụp hai bên ở 1440×900 trên
"v2 Filters" với theme `light_default`, `light_theme1` (Anzac), `dark_default`, `dark_theme2` (đổi `theme_name` trong
response, không sửa dữ liệu): app header, header dashboard, thanh filter (`?filters=`), menu Options, menu Adding, lịch
main date khớp v1 trong 1px. Chưa chụp được: password gate, View As, full screen của v1 (Chromium headless không vào
được full screen), mobile.

| Mục | Kết quả | Nằm ở |
|---|---|---|
| S1 | Bỏ `overflow: hidden` ở grid item | `dash:grid/DashboardGrid.css` |
| S2 | Theme đặt thêm lên `<body>` khi trang mở; app header đọc `--header-bar-background-color`, `--header-active-background-color`, `--header-text-active-color`; gradient vẽ trên `<body>` để header theme tối nằm trên gradient như v1 | `dash:theme/useBodyDashboardTheme.ts`, `v2:app/global.css` (`@theme inline`), `v2:app/layout/header/`, `dash:detail/DashboardPage.css` |
| S3 | Icon từng dòng, min 200px, dòng 43.6px, màu `--root` (luôn sáng như `ContextMenu` v1), mở lệch dưới 9px, căn trái nút | `dash:header/HeaderActionsView.tsx`, `.dashboard-context-menu` trong `dash:theme/dashboardAntd.css` |
| S4 | Viết lại theo số đo v1, nằm trong `.dashboard-header`; chip accent, mắt `di-icon-eye` / `di-icon-eye-close`; tắt thì chỉ nền mờ và nhóm chữ opacity .3, không bấm được (v1 `.disabled`) | `dash:controls/header-filters/` |
| S5 | `EmptyDashboardView`; link "Click here" chỉ có ở edit mode | `dash:detail/EmptyDashboardView.tsx` |
| S6 | `Loading` / `ErrorState` trong card nội dung, card dùng setting mặc định (rộng 100%). Nút là "Try Again" | `dash:detail/DashboardPageBody.tsx` |
| S7 | Rộng 500, title 20px, input nền `#f2f2f7` cao 42, lỗi `--danger`, hai nút chia đôi footer cao 42 | `dash:access/PasswordGateView.tsx`, `PasswordGate.css` |
| S8 | Shadow khi cuộn quá 1% | `dash:detail/useScrolled.ts`, `isScrolledPast` |
| S9 | Thân padding 4px; cụm phải `display: none`, hiện khi hover header hoặc khi menu của nó đang mở | `dash:detail/DashboardPage.css`, `dash:header/DashboardHeader.css` |
| S10 | **Không sửa.** Đo trên v1: `height: 37px` là content-box, ô ngày cao 39px, bằng v2. Thay vào đó sửa bề rộng trigger (236px như v1, trước là 228px) và khoảng cách 8px tới cụm nút | `dash:controls/main-date/MainDate.css` |
| S11 | Thêm `color: #fff` | `dash:header/DashboardHeader.css` |
| S12 | Đã đo v1: letter-spacing `normal`, disabled .5. Sửa cả hai; nút header giờ trùng v1 từng px | như trên |
| S13 | Nút viền 28px, `di-icon-view-as`, tên weight 500; thoát là `HeaderButton` với `di-icon-exit-view-as` | `dash:view-as/ViewAsBarView.tsx`, `ViewAsBar.css` |
| S14 | Đã so ảnh: glyph font là hình khác. Chép SVG của v1 | `dash:header/RelationshipIcon.tsx` |
| S15 | Cụm nút mỗi mode fade vào 0.25s (v1 `ic-fade.scss`); không fade ra | `dash:header/HeaderActionsView.tsx` |
| S16 | Đã đo `v-calendar`: popover lệch dưới 9px; 5px trên header lịch; thứ cách header 27px; tuần đầu cách thứ 6px; luôn chừa 6 tuần (cao 273px); title letter-spacing .6px | `dash:controls/main-date/` |
| S17 | Lịch v1 **luôn sáng, accent `#597fff`** ở mọi theme (đã chụp Anzac và hai theme tối). Popover lịch mang `filter-popover-area-default-style`. Trước đó ở theme tối chữ của v2 trắng trên nền trắng | `dash:controls/main-date/MainDatePickerView.tsx` |
| S18–S21 | Placeholder nét đứt; nội dung .8 khi kéo / resize; ẩn mọi glyph resize; dời .3s | `dash:grid/DashboardGrid.css` |
| S22 | 768px | `dash:detail/DashboardPage.css` |
| S23 | Nguyên nhân: mũi tên của hai mục có menu cách nhãn 6px, v1 4px (`ml-1`). Bốn mục giờ trùng v1 (836.1 / 971 / 1146.2 / 1297.3) | `v2:app/layout/header/HeaderNavButton.tsx` |

Sửa thêm ngoài bảng: dòng menu Options cao 48.8px như v1 (line-height 1.4, trước là 50px).

Để lại:

- **S5**: v1 có link "Click here" cả ở view mode; v2 chỉ mở được ChartBuilder trong edit mode nên view mode chỉ có dòng
  "Your dashboard is empty".
- **S9**: nút back vẫn ẩn ở full screen / TV (v1 hiện khi hover; v2 có test khẳng định là ẩn). Full screen vẫn cuộn
  được: v1 ẩn overflow vì scale dashboard ở cả hai mode, v2 chỉ scale ở TV.
- **S4**: nội dung popover sửa filter (`FilterEditorView`) chưa style theo `InternalFilterPopover` của v1; mới nhận
  theme từ F1. Ở theme tối, v1 tắt filter thì alpha nền là .4 (đậm hơn lúc bật, do v1 xét dark mode của app chứ
  không phải theme dashboard); v2 để .12.
- **S7, S13**: làm theo code v1, chưa có ảnh v1 để so.
- **S3**: menu gear (`.dashboard-setting-menu`) cùng là `ContextMenu` ở v1 nhưng v2 đang dùng màu theme và số đo hơi
  khác (padding 11px, icon 14px); chưa gộp về `.dashboard-context-menu`.
- **S15**: thay đổi này bọc cụm nút trong `.dashboard-header__actions`.
- `.dashboard-theme` giờ có trên cả `<body>` lẫn `.dashboard-page` (trang embedded và story vẫn cần cái sau).

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

**Trạng thái: xong ngày 2026-11-10; phần để lại làm tiếp ngày 2026-11-11** (còn lại ghi ở "để lại" bên dưới). Đã đo
và chụp hai bên ở 1440 px trên "v2 Sample", "v2 Filters" (có `?filters=`), "v2 Builder", theme `light_default` và
`dark_default` (đổi `theme_name` trong response). Chưa chụp được vì dữ liệu mẫu không có: drill down, collapse và pivot
table, tab widget từ 3 tab, tab / panel rỗng, ảnh lỗi, chart rỗng, inner filter dạng dropdown và dạng icon.

KPI có so sánh / trend line (ngày 2026-11-11): server local trả 500 "No database selected" cho mọi request có
`compare_request` và cho query trend line, ở cả v1 lẫn v2. Đã chụp bằng cách bật `data_range` / `comparison` /
`trend_line` trong response của dashboard và trả response giả cho `chart/query` ở cả hai bên. Các layout này xem được
ở story `Dashboard/Charts/KpiView`.

| Mục | Kết quả | Nằm ở |
|---|---|---|
| W1, W3 | `Loading`, `ErrorState` ("Try Again") | `dash:widgets/chart/ChartWidgetView.tsx` |
| W2 | Lớp phủ `--hover-color` .6 kèm spinner khi `isFetching` mà đã có data, cho mọi chart; table bỏ `loading` riêng của antd (pivot giữ cho lúc tải dòng con) | như trên, `.chart-status` trong `dash:widgets/WidgetContainer.css` |
| W4 | `responseHasData` (port `hasData` của v1); chart query được mà không có data thì vẽ icon rỗng, không chữ (v1 truyền `emptyMessage` rỗng) | `v2:core/query/VisualizationResponse.ts` |
| W5 | "Chart unsupported" ở góc trên trái; lỗi giới hạn parliament dùng `ErrorState` | `dash:charts/ChartRenderer.tsx` |
| W6, W7 | Glyph 40px `di-icon-filter-small` / `di-icon-disable-filter`, chấm accent 8px; popover 256px không mũi tên theo số đo v1. Giữ title "Filters are off for this chart" khi tắt (v1 luôn ghi "All filters are applied") và nhãn công tắc trên một dòng (v1 xuống dòng trong ô 64px) | `dash:widgets/chart/AppliedFiltersView.tsx`, `AppliedFilters.css` |
| W8 | Ba dạng như v1: card dưới 550px là icon mở popover (tab dọc hoặc danh sách có dấu check), còn lại là dải tab 210px cuộn ngang hoặc dropdown 28px theo `displayAs` | `dash:widgets/chart/InnerFilterView.tsx`, `InnerFilter.css`, `useNarrowCard.ts` |
| W9 | **Không sửa padding.** Đo v1: panel 210px có 4px padding bên trong (`.action-more`), bằng v2. Sửa vị trí: v1 lùi 14px so với mép phải nút và cách nút 9px | `dash:widgets/menu/WidgetMenuView.tsx` |
| W10 | Theo v1: bỏ "⋮" ở view mode. Nút zoom (`di-icon-zoom`, khi `enableIconZoom` và chart đổi được date function) và nút drilldown (`di-icon-drilldown`, khi `isEnableDrilldown`) 40px trên thanh action. Các việc còn lại nằm trong một menu chung (`chartMenuItems`), mở khi bấm vào điểm hoặc chuột phải trên card, chỉ liệt kê mục dùng được: Use as a filter, Change date function, Drill down, Drill through, Reset filter, Reset drill down, Download CSV / Excel. Trên card (chuột phải), "Use as a filter" và "Drill through" mở bảng "Select a dimension" gồm các giá trị của chart (v1 `DimensionPicker`) ngay trong menu; drill through chọn giá trị xong thì liệt kê dashboard | `dash:widgets/chart/ChartActionsView.tsx`, `chartMenus.utils.ts` (`dimensionMenuItems`, `staysOpen`), `useChartWidget.ts`, `dash:widgets/WidgetContainer.tsx` |
| W11 | Icon `di-icon-filter-panel` / `di-icon-delete` (theo code v1), nhãn "Duplicate chart" cho chart | `dash:widgets/menu/menuIcons.utils.ts`, `dash:edit/editMenus.utils.ts` |
| W12 | Class `chart-point-menu`: padding 4px 0, dòng 10px 12px, 14px, xám tới khi hover. Giữ thứ tự và câu `Use "X" as a filter` của v2 | `dash:widgets/chart/PointMenuView.tsx`, `dash:widgets/menu/WidgetMenu.css` |
| W13 | Submenu mang class của menu (`popupClassName`), cao tối đa 350px có cuộn | như trên |
| W14 | Panel drill down 300px như `DrilldownSetting`: breadcrumb (nhà = reset, từng giá trị = quay lại), chọn giá trị, rồi chọn field có ô search và nhóm Date / Text; field ngày bấm là drill theo năm, mũi tên mở danh sách date function. Mở từ nút drilldown hoặc từ mục "Drill down" của menu (tại chỗ bấm, có sẵn giá trị nếu bấm vào điểm) | `dash:widgets/chart/DrillPanelView.tsx`, `DrillPanel.tsx`, `DrillButton.tsx`, `drillPanel.utils.ts` |
| W15 | Drill path nằm trong subtitle của Highcharts (HTML, giá trị đã escape; v1 ghi thẳng vào HTML), bấm bằng chuột hoặc Enter | `dash:charts/drillPath.ts`, `drillPath.css` |
| W16 | Bỏ nền tooltip mặc định theo theme. Chart lưu `tooltip.backgroundColor` thì vẫn dùng giá trị đó, như v1 | `dash:charts/highchartsBase.ts` |
| W18 | Nguyên nhân: Highcharts 11 vẽ nhãn HTML ngoài SVG nên `em` tính từ 14px của trang; 13 vẽ trong SVG (16px). Mặc định 11.2px cho nhãn trục X và 9.8px cho data label khi option không đặt cỡ; nhãn category không bị bỏ cách (`step: 1`) | `dash:charts/highchartsBase.ts` (`HTML_LABEL_FONT_SIZE`), `series/seriesChartOptions.ts`, `pie/pieChartOptions.ts` |
| W19, W20 | `legend.itemStyle` một dòng có "…"; `legendSymbol: 'rectangle'` cho area | `dash:charts/highchartsBase.ts` |
| W22, W23, W25, W26 | Icon 32px trong ô 48px (59 / 89px ở layout area); icon, khối title, giá trị cách nhau 28px; pill `3px 19px` bo 30px ở `top: 28px; right: 11px`; layout trend: giá trị và icon một hàng `space-between`, padding 15px 9px, phần trăm cách trên 44px | `dash:charts/kpi/` |
| W27, W28 | Ba layout không theme như `NoneThemeLayout`: thường; có date range (range trên giá trị, thanh so sánh dưới, cách 12 / 8 / 12px); có trend line (title và giá trị bên trái, thanh so sánh và range bên phải, chiếm 2/3 trên; trend line 1/3 dưới, là line thẳng trong một card con nền `--chart-background-color`, như `ChartHolder` lồng của v1). Thanh so sánh đủ bốn `compareStyle`, icon 24px và phần trăm theo `uptrendIcon` / `downtrendIcon` và màu của chúng, chữ còn lại `--text-color`. Cả ba layout phủ kín card, không tính padding (đo v1: `.number-widget-container` tính từ thân card); giá trị `line-height: normal` | `dash:charts/kpi/KpiComparisonBar.tsx`, `KpiPlainHeader.tsx`, `KpiView.tsx`, `kpiComparison.utils.ts`, `Kpi.css` |
| W29 | Đo v1: KPI **có theme** nằm trong padding của card, bằng v2. KPI không theme thì phủ kín card (sửa ở W27) | |
| W30 | Tooltip không mũi tên, padding 4px 8px, màu và font theo `options.tooltip`, đặt theo `align` | `dash:charts/kpi/KpiValue.tsx`, `kpi.utils.ts` |
| W31 | Một caret ở cột đang sort (xuống = tăng dần như v1), bằng CSS trên sorter của antd | `dash:charts/table/FlattenTable.css` |
| W32 | Cột chia đều card nhưng không hẹp hơn 150px, quá thì cuộn ngang (`DEFAULT_COLUMN_WIDTH` của v1) | `dash:charts/table/FlattenTableView.tsx` |
| W33, W34 | Footer 25px cách trên 10px; "N rows", "Showing [n] entries" (10 / 20 / 30 / 50 / 100); card từ 400px trở xuống chỉ còn trang trước, hiện tại, sau. Pill theo **số đo** v1 (12px, cao 20px, trong suốt, trang hiện tại nền header): CSS scoped của `Pagination.vue` không tới được markup của bootstrap. Đủ first / prev / next / last, giữa là cửa sổ ba số trang, không "…" và không trang cuối (`limit` 3, `hide-ellipsis` của v1). Ẩn footer khi bảng hiện đủ từ 20 dòng trở xuống (`enablePagination`) | như trên, `table.utils.ts` (`hasPages`, `isPageListed`, `lastPageStart`), `PageEdgeItem.tsx` |
| W35, W36, W37, W38 | Bỏ hover dòng; scrollbar mảnh màu `--scrollbar-background`; path dấu cộng / trừ của v1, cách phải 5px; tooltip ô `6px 16px`, bo 1px, 15 dòng | `dash:charts/table/` |
| W39 | `ic_help.svg` sau title của tab filter và tree filter, subtitle là `title` | `dash:charts/filter/FilterTitle.tsx` |
| W40 | **Không sửa.** Đo v1: chữ tab là `#5f6368` (`btn-ghost` ép `!important`), bằng v2 | |
| W41 | Danh sách cao tối đa 250px; màu popup đã có từ F1 | `dash:charts/filter/` |
| W42 | Nút kéo: chấm accent trong viền trắng 2px, tổng 16px. Số trong ô slicer (chỉ dạng number, như `useFormat`) và input filter dạng số có dấu phân cách hàng nghìn khi gõ; ô ngày của slicer nền `--tab-filter-dropdown-background`, không viền; chữ trong ô số của slicer cách mép 8px (đo v1) | `dash:charts/filter/FilterWidget.css`, `numberInput.utils.ts` |
| W43 | v1 có icon lịch bên trái (đã thấy trên ảnh). Đổi mũi tên sang `ic-16-arrow-down.svg`, xoay khi mở | `dash:charts/filter/DateSelectFilterView.tsx` |
| W44 | Padding 4px, placeholder 12px | `dash:charts/filter/FilterWidget.css` |
| W45 | **Không sửa.** Checkbox của v1 không có viền khi thiếu `deActiveColor` nên vô hình (bug v1, đã ghi ở `filterStyle.utils.ts`) | |
| W46 | Mũi tên `di-icon-arrow-down` cuối thanh tab khi có từ 3 tab, mở danh sách tab | `dash:widgets/tab/TabNavView.tsx` |
| W47 | "Your tab / panel is empty" và "**Click here** to add"; link chỉ có ở edit mode (như S5) | `dash:widgets/EmptyNestedView.tsx` |
| W48 | **Không sửa.** Đã chụp v1 với `header.position = 'vertical'` trên filter panel: giống hệt header ngang, chỉ thân thấp hơn 4px (CSS của v1 ép `.tabs` thành cột nên `vertical` của bootstrap không có tác dụng) | |
| W49 | Gear 32px (icon 14px, padding 9px) đặt tuyệt đối ở góc trên phải panel | `dash:widgets/filter-panel/FilterPanel.css` |
| W50 | Nền `--hover-color` khi hover | `dash:widgets/menu/WidgetMenu.css` |
| W51 | Ảnh phủ cả padding của card; spinner khi tải, lỗi không có nút thử lại, icon rỗng khi không có URL | `dash:widgets/image/ImageWidgetView.tsx` |
| W52 | Đo v1: textarea không viền, không nền, padding 2px, line-height 1.5. Widget lưu không có `style_settings` dùng `defaultStyleSettings` của v1 (12px, font chính của dashboard) và `text_color` / `font_size` cũ; có `style_settings` thì thiếu gì lấy mặc định của getter (13px, Roboto) | `dash:widgets/text/` |
| W53 | **Không làm.** `ZoomControlBar` được khai báo trong `ChartComponent.ts` nhưng không template nào dùng (code chết ở v1) | |

Sửa thêm ngoài bảng: menu tại điểm bấm (`PointAnchor`) giờ render trong trang thay vì trong card, vì grid item dời
bằng `transform` làm `position: fixed` tính từ card (menu của chart trong tab mở lệch chỗ). `colorTextQuaternary: '#ccc'` chuyển từ token của trang về riêng `Switch` (trước đó làm xám
placeholder và chữ disabled của mọi control trong trang, kể cả builder).

Để lại:

- **W10**: trên màn cảm ứng không có đường tới menu của card (Download), như v1. Bảng chọn giá trị là một nhóm trong
  menu antd (v1 là panel 200×250px riêng); không có dòng "There is not any dimension to select" vì chart không có giá
  trị thì hai mục không hiện.
- **W14**: panel lấy danh sách giá trị từ chính response chart đang vẽ (v1 query lại). Chưa so ảnh với v1 (dữ liệu mẫu
  không bật drill down; đã thử trên v2 bằng cách bật `is_enable_drilldown` trong response). Danh sách field của v1
  **không** có icon kiểu dữ liệu (đã đọc lại `DrilldownSetting.vue`, `FieldListingItem.vue`); ghi chú cũ sai.
- **W17**: v1 tính tick lúc chart còn cao 400px (mặc định của Highcharts) rồi co lại mà không tính lại, nên chart thấp
  có nhiều tick hơn (cách nhau 19–38px). Đây là suy từ số đo ba chart, chưa thử trực tiếp trên v1. Số tick phụ thuộc
  lịch sử kích thước, không ghim được bằng một option; v2 giữ cách tính chuẩn của Highcharts (72px một tick).
- **W21**: ở card 231px, v1 ẩn bớt nhãn pie chồng nhau, v2 (Highcharts 13) vẽ đủ. Cỡ chữ đã khớp (9.8px).
- **W24**: style prefix / postfix hai bên giống nhau trong code; phần lệch trên ảnh có lẽ do Montserrat chưa tải lúc
  chụp v1 (chưa kiểm). Đã thêm 2px sau prefix / postfix rỗng như v1.
- **W27**: layout có date range (không trend line) của v1 thực tế lệch trái: `ComparisonNumberRenderer.scss` không bao
  giờ được nạp (import chỉ dùng làm kiểu nên bị bỏ), range và thanh so sánh rơi về lề trái. v2 căn giữa theo đúng CSS
  đó (bug v1, không chép). Khi compare value bằng 0 v1 vẫn vẽ thanh với "--"; v2 không vẽ thanh. Mũi tên của date range
  chưa đổi sang SVG của v1.
- **W33**: ô chọn số dòng là Select, v1 là ô nhập có gợi ý. Số trang hiện tại của v1 là chữ trắng trên nền
  `#f5f5f5` (không đọc được); v2 giữ màu chữ của header.
- **W42**: ô ngày của slicer cao 32px (v1 33px).
- **W52**: ở edit mode v1 cho sửa chữ ngay trên card (có hỏi xác nhận); v2 sửa qua dialog.
- Trên ảnh "v2 Sample": nhãn trục X của "Revenue by region" (chart nằm trong tab widget) xoay −45° và bị cắt đầu, kèm
  lỗi console `<foreignObject> attribute transform … rotate(-45 NaN NaN)`. Có từ trước phần làm ngày 2026-11-11, chưa
  tìm nguyên nhân.
- Story: `DashboardStoryFrame` (`dash:theme/`) bọc `.dashboard-page` và `DashboardThemeProvider`; ba story cũ và story
  KPI đã dùng. Story mới của dashboard nên dùng nó.
- Preview của builder: khung preview thêm `position: relative` để KPI không theme (phủ kín khung chứa) không tràn ra
  modal; làm lại ở B24, B25.

### Nợ từ review bước 0 và 1 (2026-11-10)

Review bằng đọc code ở `f309a28f`, chưa nhìn trên app. Xếp theo mức ảnh hưởng tới các bước sau:

1. **Bỏ (theme tối).** Dialog ở theme tối: nền modal là `--modal-background-color` (luôn `#fff`), còn title, nút X và nút Cancel
   theo `--text-color` / `--secondary-text-color` của theme (gần trắng).
2. **Bỏ (theme tối).** Theme antd của trang không có `algorithm` nên theo mode của app, không theo nhóm `dark_*` / `light_*` của
   dashboard: Input, Checkbox, Tree, Table, DatePicker không được vá màu như dropdown và popover.
3. **Xong ở bước 4 (`DialogScope`) cho dialog; lịch và popover filter vẫn như cũ.** Scope mặc định port thiếu: `[builder-default-style]` chỉ có 5 biến (v1 reset cả bộ biến sáng);
   `.filter-popover-area-default-style` không reset `--filter-color`, `--icon-color`, `--toggle-color`,
   `--scrollbar-*`, `--tab-filter-*`; `colorPrimary` của antd không đổi theo scope CSS (nên `MainDate.css` phải ép nền
   nút Apply). Cần một component scope gồm class reset đủ biến và `DashboardThemeProvider themeName="light_default"`
   lồng, dùng cho lịch, popover filter, builder (B1) và dialog. Sau quyết định chỉ hỗ trợ theme sáng, phần reset
   màu nền và chữ không còn cần; chỉ còn phần accent ở theme sáng có accent khác (Anzac).
4. **CSS restyle antd ngoài `@layer components`**: `dash:access/PasswordGate.css`, `MainDate.css:249-256`,
   `DashboardHeader.css:125-135` (trùng với rule popover của F1). Input nền xám 42px và footer hai nút chia đôi là
   mẫu `DiCustomModal` mà D1, D12, B39 cần, hiện nằm riêng trong `.password-gate`. Bước 2 cũng thêm CSS ngoài layer ở
   `AppliedFilters.css`, `InnerFilter.css`, `FlattenTable.css` (theo cách các file widget sẵn có).
5. **`getPopupContainer` truyền tay thừa** ở 11 chỗ (bước 4 đã gỡ ở ba dialog settings) sau khi F1 đã cấp qua `ConfigProvider`;
   `popupContainer.ts` lấy `.dashboard-page` đầu tiên trong DOM.
6. **Toast**: còn `message.*` ở `chart-builder/host/useChartSave.ts`, `field-actions/useTableRefresh.ts`,
   `useFieldActions.ts`, `shared/relationship/useRelationshipEditActions.ts`, `features/share/`; `useToast` chưa có
   `warning` / `loading`.
7. **Biến không định nghĩa** (`--icon-hover-color`, `--accent-disabled-color`) và `#d6d6d6` ghi cứng dù có
   `--line-d6d6d6`.
8. Tài liệu lệch code: F1 ghi `ThemeContext.tsx` (nay là `v2:app/theme/appTheme.ts`); F3 ghi mọi popup mang class
   `dashboard-popover` (code style theo `.dashboard-page .ant-*`).

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

**Trạng thái: làm ngày 2026-11-11, xong B1–B39 trừ B38** (còn lại ghi ở "để lại" bên dưới). Đã đo DOM và chụp hai bên ở
1440×900 trên "v2 Builder" (chart 31, column), theme `light_default`: khung, cây field, vùng Type, các zone, Filters,
menu function, "View all", tab Settings (Title & Subtitle) khớp v1 trong vài px. Chỉ chụp v2 (script không mở được
trên v1): popover điều kiện, dialog Config, picker, hint. Chưa chụp: builder ở dashboard có accent khác (Anzac),
builder của Data Cook và của query editor, lúc đang kéo field, các tab Settings ngoài Title & Subtitle.

| Mục | Kết quả | Nằm ở |
|---|---|---|
| B1 | `BuilderScope`: một lớp phủ màn hình mang `.dashboard-theme.dashboard-page[data-dashboard-theme=light-default]` và `[builder-default-style]`, có `ConfigProvider` (token `light_default`, popup render trong lớp này) và `App` riêng. Builder ở dashboard, query editor và Data Cook đều bọc trong nó, nên luôn sáng với accent `#597fff` và nhận CSS antd của F1 kể cả ngoài trang dashboard. Preview bọc lại `.dashboard-theme` của dashboard để chart giữ theme | `cb:theme/BuilderScope.tsx`, `builderScope.css`, `cb:host/ChartBuilderHost.tsx`, `v2:features/data-cook/…/EtlChartBuilder.tsx` |
| B2–B6 | Modal bo 20px, padding 0, cao 640–735px; rail 134px (item 40px, thanh accent 6px); vùng làm việc xám padding `18px 13px 20px 11px`; title 24px/400; hai nút 64px cách 16px; cột 238 / 385 (padding `0 15px` theo số đo) / 631, cách 8px | `cb:modal/ChartBuilderModalView.tsx`, `ChartBuilderModal.css` |
| B7 | Picker 800px không header, không X (Esc hoặc bấm ngoài để huỷ), title giữa 24px/500, card 118×126. Chỉ liệt kê loại dựng được, như v1 | `cb:picker/ChartTypePickerModal.tsx`, `ChartTypeCardsView.tsx`, `ChartTypes.css` |
| B8 | "Type" + "View all", dải ô 60×60 cuộn ngang (ô đang chọn tự cuộn vào giữa), popover 600×450 gồm các card, mở từ mép phải nút. Vùng Type đứng yên, các zone cuộn bên dưới | `cb:picker/ChartTypeStripView.tsx` |
| B9–B13 | Thanh tab 40px hai ô; dropdown 32px và nút search tròn `ic_search.svg`; dòng bảng 41px (caret Font Awesome, "⋯" luôn hiện), dòng field 36px / 12px, thụt 18px (số đo; plan ghi 20px), hover `--hover-color`; ghost 200px viền accent có `move.svg`; trạng thái rỗng như v1; placeholder "Search tab controls..." | `cb:field-tree/`, `FieldTree.css`, `v2:shared/menu/ActionMenuView.tsx` (`pinned`) |
| B14 | Icon measure là SVG "fx" trên nền accent của v1 (`FunctionIcon.vue`); icon kiểu cột đổi sang accent. Chữ nghiêng giữ như cũ, chưa kiểm v1 | `cb:field-tree/FieldLabelView.tsx` |
| B15–B19 | Title zone 14px/500/.6px, cách ô 16px; ô nền `#f2f2f7` viền 1px cùng màu (số đo; plan ghi 1.5px), nét đứt accent khi nhận kéo; hint `ic-drag.svg` căn giữa padding 16px, "click here" màu accent; item không nền, link gạch liền, tên đậm, "⋯" hiện khi hover dòng; vạch chèn thụt 8px | `v2:shared/field-dnd/FieldDnd.css`, `cb:config-panel/ConfigPanel.css` |
| B20 | Menu trong builder: trắng, `--menu-shadow`, dòng 8px, hover `--active-color`, dòng đang chọn có "✓" accent. Căn **trái** (v1 ghi `text-align: center` nhưng render ra căn trái). Menu "click here" là một danh sách: tên bảng đậm rồi các field, 250×316. Remove là dòng thường | `cb:theme/builderScope.css`, `cb:config-panel/fieldMenu.utils.ts` |
| B21, B22 | Nhóm AND là card `--hover-color`; nhãn "AND" ở góc khi đang kéo; "Or" giữa các nhóm; tên đậm, kiểu điều kiện opacity .5, chip accent chữ trắng 12px, "Click to filter" màu accent | `cb:config-panel/filter/`, `ConfigPanel.css` |
| B23 | Popover 380px, padding `16px 20px 16px 16px`, shadow `0 4px 12px rgba(0,0,0,.16)`, mở phía trên; title semi-bold .6px; thân margin 24px; `di-icon-delete` (hover đỏ), Cancel viền accent, Apply primary, cao 42px | `cb:config-panel/filter/ConditionEditorView.tsx` |
| B24, B25, B27 | Panel `#fafafb` padding 16px có title "Visualization"; chart nằm trên card widget cỡ mặc định của loại chart (`cột × 27.5 − 16`, `dòng × 32 − 16`) ở giữa panel, theo widget setting của dashboard; loading / lỗi dùng F4 | `cb:preview/PreviewCardView.tsx`, `preview.utils.ts`, `PreviewView.tsx` |
| B26 | Hint theo loại chart: `idea.svg`, "How to create a …?", các dòng hướng dẫn và hình minh hoạ (port `HintChartData.ts` thành `chartHints.json`, 31 loại) | `cb:preview/PreviewHintView.tsx`, `chartHint.utils.ts` |
| B28–B36 | Header panel 40px có đường kẻ, mũi tên bên trái (xuống khi mở, như v1), title 14px/500 viết hoa; label 14px `#5f6368` cách 4px; dòng cách 16px; ô 33px nền `#f2f2f7` không viền; ô màu là ô hex + swatch 20px (115px); cỡ chữ 64px / 11.2px; toggle bên trái label; slider có ô số 42px; align là ba glyph bootstrap; Revert là chữ accent căn phải | `cb:settings/Settings.css`, `SettingsCollapse.tsx`, `cb:settings/fields/` |
| B37 | "Advanced controls" chỉ hiện khi toggle bật | `cb:settings/table/FormattingRow.tsx` |
| B39 | 500px, không X, "Config **Data**" 16px và dòng nguồn 12px, field xếp dọc nền xám (input 42px, dropdown 40px), toggle có label bên trái, hai nút 42px chia đôi footer | `cb:config-panel/ItemConfigModal.tsx`, `.builder-dialog` trong `builderScope.css` |

Để lại:

- **B38, B40, B41, B42**: icon "?" cạnh label; dialog Formula, Update table by query, Conditional formatting. Chưa làm.
- **B5**: nút lưu khi sửa chart vẫn ghi "Update" (code v1 ghi `'Update'`, bản v1 đang chạy ở docker ghi "Save"); mục 3
  ở đầu tài liệu chưa quyết.
- **B7, B8**: v2 dựng được nhiều loại hơn bản v1 đang chạy (Spline, các loại Inverted Axes, …) nên danh sách dài hơn.
- **B17**: Filters vẫn giữ hint "click here" dưới các nhóm (v1 chỉ hiện khi chưa có filter), để còn thêm nhóm bằng bấm.
- **B22**: chip của v1 có nút "×" bỏ từng giá trị; v2 chưa có.
- **B23**: nội dung popover (Select điều kiện, Radio Manual Input / Chart Control, danh sách checkbox) vẫn là control antd.
- **B26**: loại chart không có hint thì v2 ghi "Drag and drop your fields to create a … chart." (v1: "Learn to create …
  Chart here" với link). Ba hình `hint-drilldown-*` v1 tham chiếu không có trong repo.
- **B31**: ô màu vẫn hiện "Theme" cho màu theo theme (v1 hiện hex); popover là antd `ColorPicker`, chưa có "Reset to
  default" và Cancel / OK.
- **B28–B36**: mới so ảnh tab Title & Subtitle. Các tab khác dùng chung control nên đổi theo, nhưng chưa xem từng tab;
  `RuleRow`, `SlicerControlTab` còn class bề rộng Tailwind cũ.
- `BuilderScope` mang class `dashboard-page` để dùng lại CSS antd của F1. `dashboardPageContainer()` lấy
  `.dashboard-page` đầu tiên trong DOM: ở Data Cook và query editor đó là lớp của builder.
- Preview của query editor (`ChartTabResult`) không truyền `card` nên chart vẫn vẽ kín khung, như trước.

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

**Trạng thái: làm ngày 2026-11-11, xong D1–D12** (còn lại ghi ở "để lại" bên dưới). Đã đo DOM và chụp hai bên ở
1440×900 trên "v2 Sample" với theme `light_theme1` (Anzac): Rename, Add Text, Sort, Add Chart, Config Tab, xác nhận xoá
trùng v1 về kích thước khung và vị trí nút (lệch vài px: nút Save của header rộng hơn 2px, preview của Config Tab hẹp hơn 4.5px). Chỉ chụp v2: View As, Share, Relationship, Edit
Dashboard, Themes, Config của filter panel. Chưa chụp: Password, Image, Edit Widgets, mobile.

| Mục | Kết quả | Nằm ở |
|---|---|---|
| Scope | `DialogScope`: lớp phủ màn hình mang `.dashboard-theme.dashboard-page[data-dashboard-theme=light-default]`, có `ConfigProvider` (token `light_default`) và `App` riêng; mọi dialog của trang và popup của chúng render trong đó nên luôn sáng với accent `#597fff`, như v1. `BuilderScope` giờ là `DialogScope` thêm class của builder. Ba dialog settings bỏ `getContainer` truyền tay | `dash:theme/DialogScope.tsx`, `dialogScope.css`, `dash:detail/DashboardPageView.tsx`, `DashboardPageContent.tsx`, `DashboardPageBody.tsx` |
| Khung | Ba khung dùng chung: `CustomDialog` (`DiCustomModal`: không X, input nền xám 42px, hai nút 40px chia đôi footer), `HeaderDialog` (`EtlModal`: title bên trái, Cancel 25px và nút chính 24px bên phải header, nền trắng hoặc xám), `ConfirmDialogView`. Có story `Dashboard/Dialogs` | `dash:dialogs/` |
| D1 | `CustomDialog` 500px, label trên input, nút "Rename", lỗi tại chỗ. Dialog Image (chỉ có ở v2) dùng cùng khung | `dash:edit/RenameModalView.tsx`, `ImageUrlModalView.tsx` |
| D2 | 1071px; header icon `add-text.svg`; hai nửa 495×400: tab Text / HTML (màu `#0066ff` như v1), mô tả, textarea xám; "Review" vẽ widget thật trên theme của dashboard. Dải config: font family 161, cỡ 100, B / I / U, align, màu, opacity chữ; nhóm Background (màu, opacity). Text mới căn theo `--widget-primary-font-align` (giữa) như v1 | `dash:edit/TextEditorModalView.tsx`, `TextEditor.css`, `textEditor.utils.ts`, `v2:core/dashboard/widgetJson.ts` (`TextStyle`) |
| D3 | `HeaderDialog` 1200px nền xám, thân 600px: preview trên theme của dashboard bên trái, cột setting trắng 350px bên phải dùng control của tab Settings trong builder. Tab: Position, Font family, màu + cỡ, Background active / inactive, Revert. Filter panel: ba panel Header, Apply (Footer title, font, màu, cỡ, align, Apply Background), Background, mỗi panel có Revert | `dash:edit/TabStyleModalView.tsx`, `TabStylePreview.tsx`, `tabEdit.utils.ts`, `dash:widgets/tab/tabWidget.utils.ts` |
| D4 | `HeaderDialog` 444px trắng, title 24px và subtitle, ô search, danh sách 400px gồm dòng 46px (icon loại chart, tên 14px/500, ô check SVG của v1). Câu chữ của v1 | `dash:edit/PickWidgetsModalView.tsx`, `pickWidgets.utils.ts` |
| D5 | "Sort Orders" / "Drag to customize the order", dòng 46px kéo thả (`@dnd-kit/core`), `di-icon-drag` | `dash:edit/SortTabsModalView.tsx`, `movedTo` trong `tabEdit.utils.ts` |
| D6 | Password gate render trong `DialogScope` (style đã làm ở S7) | `dash:detail/DashboardPageBody.tsx` |
| D7 | `CustomDialog` 560px, label "Select user", input 42px, gợi ý hiện dưới input khi gõ (dòng user 40px), chọn xong hiện card user và chip thuộc tính, nút "Apply". Chip ghi tên thuộc tính như đã lưu (v1 đổi sang snake case) | `dash:view-as/ViewAsModalView.tsx`, `ViewAsModal.css`, `attributeChips` |
| D8, D9, D10 | Không sửa code riêng: title 24px/500, X tròn 24px, nút primary `#597fff` đã có từ F1 và `DialogScope` (đã đo trên v2) | |
| D11 | Thân min-height 480; bỏ override nền và hover của nút primary (giờ lấy `--accent-hover-color` từ F1) | `dash:edit/settings/settings.css` |
| D12 | **Khác plan**: trên v1 đang chạy, xoá widget hỏi bằng sweetalert ("Remove widget", No / Yes), không phải `ConfirmationModal`. Làm theo số đo đó: 398px, vòng cảnh báo 48px `#ffab00`, title 16px/700, hai nút 42px, nền mờ `rgba(0,0,0,.4)`. `ConfirmProvider` + `useConfirm()` thay `modal.confirm` ở xoá widget, rời edit mode, xoá main date | `dash:dialogs/ConfirmDialogView.tsx`, `ConfirmContext.tsx` |

Sửa thêm ngoài bảng: control setting của builder (`fields/`, `SettingsCollapse`, `Settings.css`) chuyển sang
`v2:shared/settings/` vì dashboard giờ cũng dùng; `ThemeColorInput` bỏ.

Để lại:

- **D2**: v1 cuộn textarea và Review cùng nhau; v2 không. Ô màu là antd `ColorPicker` (như B31). Chiều cao widget mới
  vẫn lấy mặc định (v1 lấy theo chiều cao Review).
- **D3**: trên v1 đang chạy, Config tab của tab widget mẫu (thiếu `extra_data.header`) bị lỗi nên cột setting trống;
  phần setting làm theo code v1, chưa có ảnh để so. Ô màu hiện "Theme" cho màu theo theme (B31). Preview của filter
  panel không vẽ các filter bên trong.
- **D4**: v2 liệt kê cả text và ảnh (v1 chỉ chart); loại chart v1 không có icon thì v2 dùng icon chung.
- **D7**: chưa chụp được v1 (script không mở được dialog); làm theo code v1.
- **D12**: `shared/relationship/useRelationshipEditActions.ts` và `shared/routing/useUnsavedGuard.ts` vẫn dùng
  `modal.confirm` (dùng chung ngoài trang dashboard).
- Input trong dialog không tự focus khi mở (v1 có `autofocus`; rule lint `jsx-a11y/no-autofocus`).
- `PasswordGate.css` vẫn giữ style riêng, chưa chuyển sang `CustomDialog`.
- CSS của `settings.css` và `Settings.css` không nằm trong layer nên thắng CSS trong `@layer components`; hai rule của
  bước này phải đặt ngoài layer (`.tab-style__half`, `.text-editor__color`).

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
- Bổ sung vào bộ ảnh: một dashboard theme có accent khác (Anzac), mọi dialog ở bước 4, màn
  375px, hover của card và menu, lúc đang kéo field trong builder, builder của table và KPI.
- Trước khi coi một bước là xong: `pnpm typecheck`, `pnpm lint`, `pnpm test:run`, `pnpm build`.

## Thứ tự và phụ thuộc

1. **Bước 0** trước tất cả. F1 và F3 đổi màu và bo góc của mọi thứ, nên chụp lại toàn bộ sau bước này rồi mới so
   tiếp; một số mục ở bước 1 đến 4 sẽ tự hết (D9, D10, D8 một phần).
2. **Bước 1** và **bước 2** độc lập với **bước 3**; có thể làm song song.
3. Trong bước 3: B1 đến B6 (khung) trước, rồi B28 đến B36 (control của Settings, dùng lại ở mọi tab), rồi phần còn
   lại.
4. **Bước 4** sau khi quyết định xong mục 2 ở đầu tài liệu.
5. Các mục [nghi] phải kiểm trên v1 đang chạy trước khi sửa: S12, S14, S16, S21, W29, W38, W43, W45, B14, B42,
   color picker ở F2.
