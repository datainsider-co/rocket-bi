/*
 * @author: tvc12 - Thien Vi
 * @created: 3/29/21, 11:31 AM
 */

export enum DashboardEvents {
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
  ShowCalendar = 'show_calendar',
  ShowBoostMenu = 'show_boost_menu',
  Export = 'export',
  UpdateTab = 'update_tab',
  AddChartToTab = 'add_chart_to_tab',
  AddFilterToGroup = 'add_filter_to_group',
  RemoveChartFromTab = 'remove_chart_from_tab',
  SortTab = 'sort_tab',
  ShowImageBrowserModal = 'show_image_browser_modal',
  UpdateFilter = 'update_filter'
}
