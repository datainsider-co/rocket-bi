/*
 * @author: tvc12 - Thien Vi
 * @created: 3/29/21, 11:31 AM
 */

export enum DashboardEvents {
  // Event for show widget as full size with param: chartInfo
  ShowWidgetFullSize = 'show_widget_full_size',
  HideWidgetFullSize = 'hide_widget_full_size',
  ResizeWidget = 'on_resize_widget',
  ClickDataPoint = 'click_data_point',
  ShowDrillDown = 'show_drilldown',
  HideDrillDown = 'hide_drilldown',
  ShowContextMenuOnPointData = 'show_context_menu_on_point_data',
  ShowContextMenuOnWidget = 'show_context_menu_on_widget',
  AddChart = 'add_chart',
  UpdateChart = 'update_chart',
  AddInnerFilter = 'all_inner_filter',
  UpdateInnerFilter = 'update_inner_filter',
  ShowShareModal = 'show_share_modal',
  ShowContextMenu = 'show_context_menu',
  ShowEditTextModal = 'show_edit_text_modal',
  ShowEditChartTitleModal = 'show_edit_chart_title_modal',
  ApplyCrossFilter = 'apply_cross_filter',
  ShowCalendar = 'show_calendar',
  HideCalendar = 'hide_calendar',
  ShowBoostMenu = 'show_boost_menu',
  Export = 'export',
  UpdateTab = 'update_tab',
  AddChartToTab = 'add_chart_to_tab',
  AddFilterToGroup = 'add_filter_to_group',
  RemoveChartFromTab = 'remove_chart_from_tab',
  SortTab = 'sort_tab',
  AddDynamicControl = 'add_dynamic_control',
  UpdateDynamicFunctionWidget = 'update_dynamic_function',
  UpdateDynamicConditionWidget = 'update_dynamic_control',
  ShowImageBrowserModal = 'show_image_browser_modal',
  UpdateFilter = 'update_filter'
}
