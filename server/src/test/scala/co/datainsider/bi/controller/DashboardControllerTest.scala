package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.Dashboard
import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.domain.request.ListDrillThroughDashboardRequest
import co.datainsider.bi.util.Serializer
import co.datainsider.share.domain.response.PageResult
import com.twitter.finagle.http.{Response, Status}
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import org.scalatest.BeforeAndAfterAll

class DashboardControllerTest extends FeatureTest with BeforeAndAfterAll {

  override val server = new EmbeddedHttpServer(new TestServer)
  private val apiPath = "/dashboards"
  private var templateId = 1L

  test("List Dashboards For Drill Through") {
    server.isHealthy
    val request = ListDrillThroughDashboardRequest(
      fields = Array(TableField("animal", "cat", "name", "string")),
      excludeIds = Array(1, 2, 3, 4),
      isRemoved = Some(false),
      from = 1,
      size = 100
    )
    println(Serializer.toJson(request))

    val response = server.httpPost(
      s"$apiPath/list_drill_through",
      postBody = Serializer.toJson(request),
      andExpect = Status.Ok
    )
    assertResult(true)(response.contentString != null)
    val pageResult = Serializer.fromJson[PageResult[Dashboard]](response.contentString)
    assertResult(true)(pageResult != null)
  }

  test("duplicate dashboard") {
    val request =
      """{"name":"load copy","parent_directory_id":-1,"widgets":[{"id":1039,"name":"","background_color":"var(--input-background-color)","text_color":"var(--text-color)","class_name":"text_widget","content":"tvc12","font_size":"12px","is_html_render":false}],"widget_positions":{"1039":{"row":-1,"column":-1,"width":5,"height":1,"z_index":1}},"directory_type":"dashboard","setting":{"version":"1","enable_overlap":false,"theme_name":"light_default"},"boost_info":{"enable":false,"schedule_time":{"recur_every":1,"at_time":1672209524542,"class_name":"schedule_daily"},"next_run_time":0}}"""
    val response: Response = server.httpPost(
      s"$apiPath/create",
      postBody = request,
      andExpect = Status.Ok
    )
    val newDashboard = Serializer.fromJson[Dashboard](response.contentString)
    assertResult(true)(newDashboard != null)
  }

//  test("create template") {
//    val request = """{"name":"Marketing Dashboard","description":"The Dashboard for sales or marketing","thumbnail":"https://randomwordgenerator.com/img/picture-generator/5fe5d240424faa0df7c5d57bc32f3e7b1d3ac3e45659764e70277fd691_640.jpg","setting":{"required_datasource_list":[{"type":"Shopify"}]},"dashboard":{"org_id":0,"id":4,"name":"tvc123","creator_id":"up-0a51dda6-e152-4db7-aad0-7bc2ed89d222","owner_id":"up-0a51dda6-e152-4db7-aad0-7bc2ed89d222","setting":{"version":"1","enable_overlap":false,"theme_name":"light_default","main_date_filter":{"id":-99887766,"mode":"all_time"},"border":{"width":1,"color":"#f2f2f7","color_opacity":100,"radius":{"top_left":20,"top_right":20,"bottom_right":20,"bottom_left":20},"position":"outside"},"size":{"width":100,"height":0,"width_unit":"%","height_unit":"auto"},"background_image":{"image_name":"","path":"","fit_mode":"repeat","brightness":100,"contrast":100,"grayscale":0,"opacity":100},"background":{"color":"#FAFAFB","opacity":100},"widget_setting":{"primary_text":{"font_family":"Roboto","font_size":"20px","font_weight":"500","text_align":"center","color":"#4f4f4f","color_opacity":100,"is_bold":false,"is_italic":false,"is_underline":false},"secondary_text":{"font_family":"Roboto","font_size":"14px","font_weight":"normal","text_align":"center","color":"#5f6368","color_opacity":100,"is_bold":false,"is_italic":false,"is_underline":false},"padding":15,"border":{"width":0,"color":"#f2f2f7","color_opacity":100,"radius":{"top_left":20,"top_right":20,"bottom_right":20,"bottom_left":20},"position":"outside"},"background":{"color":"#FFFFFF","opacity":100}},"auto_refresh_setting":{"is_auto_refresh":false,"refresh_interval_ms":10000}},"widgets":[{"class_name":"chart_v3","id":53,"name":"Untitled chart","description":"Subtitle description","setting":{"class_name":"number_chart_setting","value":{"name":"name","function":{"class_name":"count","field":{"class_name":"table_field","db_name":"analtyics","tbl_name":"organization","field_name":"name","field_type":"string"},"group_by_func":false,"aggregate_func":true},"is_horizontal_view":false,"is_calc_group_total":true,"is_calc_min_max":false,"is_dynamic_function":false,"is_flatten":false},"filters":[],"sorts":[],"sql_views":[],"options":{"options":{"percentage":{"icon":{"enabled":false},"enabled":true,"color_by_inherit":true,"position":"top-left","display":"percentage"},"trend_line":{"color_by_percentage":false,"enabled":false,"color":"#007126","display_as":"line","trend_by":"Month of"},"postfix":{"enabled":true,"is_word_wrap":false,"text":"$","style":{"color":"#11152D","font_family":"Montserrat","font_size":"24px"}},"subtitle":{"align":"left","enabled":true,"text":"Subtitle description","style":{"color":"var(--secondary-text-color)","text_decoration":"var(--widget-secondary-font-underlined, underline)","font_style":"var(--widget-secondary-font-style, normal)","line_height":"16.41px","font_weight":"var(--widget-secondary-font-weight, 400)","font_family":"var(--widget-secondary-font-family, Roboto)","font_size":"14px"}},"precision":0,"data_range":{"enabled":false,"date_range":{"start":"2023-11-14T09:09:48.276Z","end":"2023-11-20T09:09:48.270Z"},"date_field":{"field_type":"datetime","db_name":"analtyics","tbl_name":"organization","class_name":"table_field","field_name":"created_time_ts"},"mode":"last_7_days"},"comparison":{"enabled":false,"date_range":{"start":"Sun Sep 24 2023 18:27:39 GMT+0700 (Indochina Time)","end":"Sun Oct 22 2023 18:27:39 GMT+0700 (Indochina Time)"},"compare_style":"default","mode":"same_period_last_month"},"plot_options":{"kpi":{"data_labels":{"display_unit":"none"}}},"style":{"color":"#11152D","line_height":"42px","font_weight":"600","font_family":"var(--widget-secondary-font-family, Roboto)","font_size":"42px"},"background":"#BEE2CA","prefix":{"enabled":true,"is_word_wrap":false,"style":{"color":"#11152D","font_family":"Montserrat","font_size":"24px"}},"align":"left","icon":{"shadow":"0px 2px 4px 0px #0000001A","border":"4px","background":"#11152D","enabled":true,"color":"#BEE2CA","icon_class":"setting-icon-wallet-money-bold","shape":"rectangle"},"affected_by_filter":true,"tooltip":{"font_family":"var(--widget-secondary-font-family, Roboto)","background_color":"var(--chart-background-color)","value_color":"#000000"},"title":{"align":"left","enabled":true,"text":"Untitled chart","style":{"color":"var(--text-color)","font_style":"var(--widget-primary-font-style, normal)","line_height":"18.75px","font_weight":"var(--widget-primary-font-weight, 500)","font_family":"var(--widget-primary-font-family, Roboto)","font_size":"16px"}},"theme":"style_1"},"class_name":"number_chart_setting"},"dynamic_function_ids":[]},"creator_id":"up-0a51dda6-e152-4db7-aad0-7bc2ed89d222","owner_id":"up-0a51dda6-e152-4db7-aad0-7bc2ed89d222","background_color":"#BEE2CA","text_color":"#fff","extra_data":{"configs":{"value":[{"is_show_n_elements":false,"name":"name","table_name":"organization","is_nested":false,"field":{"field_type":"string","db_name":"analtyics","tbl_name":"organization","class_name":"table_field","field_name":"name"},"column_name":"name","function_family":"Aggregation","display_as_column":false,"id":4985,"sorting":"Unsorted","num_elems_shown":10,"function_type":"Count all"}]},"filters":{},"current_chart_type":"kpi"},"comparison_info":{}},{"class_name":"chart_v3","id":54,"name":"Untitled Chart","description":"","setting":{"class_name":"table_chart_setting","columns":[{"name":"name","function":{"class_name":"select","field":{"class_name":"table_field","db_name":"analtyics","tbl_name":"organization","field_name":"name","field_type":"string"},"group_by_func":false,"aggregate_func":false},"is_horizontal_view":false,"is_calc_group_total":true,"is_calc_min_max":false,"is_dynamic_function":false,"is_flatten":false},{"name":"owner","function":{"class_name":"select","field":{"class_name":"table_field","db_name":"analtyics","tbl_name":"organization","field_name":"owner","field_type":"string"},"group_by_func":false,"aggregate_func":false},"is_horizontal_view":false,"is_calc_group_total":true,"is_calc_min_max":false,"is_dynamic_function":false,"is_flatten":false},{"name":"is_active","function":{"class_name":"select","field":{"class_name":"table_field","db_name":"analtyics","tbl_name":"organization","field_name":"is_active","field_type":"int8"},"group_by_func":false,"aggregate_func":false},"is_horizontal_view":false,"is_calc_group_total":true,"is_calc_min_max":true,"is_dynamic_function":false,"is_flatten":false},{"name":"report_time_zone_id","function":{"class_name":"select","field":{"class_name":"table_field","db_name":"analtyics","tbl_name":"organization","field_name":"report_time_zone_id","field_type":"string"},"group_by_func":false,"aggregate_func":false},"is_horizontal_view":false,"is_calc_group_total":true,"is_calc_min_max":false,"is_dynamic_function":false,"is_flatten":false}],"formatters":[],"filters":[],"sorts":[],"sql_views":[],"options":{"options":{"subtitle":{"align":"center","enabled":true,"text":"","style":{"color":"var(--secondary-text-color)","text_decoration":"var(--widget-secondary-font-underlined, underline)","font_style":"var(--widget-secondary-font-style, normal)","font_weight":"var(--widget-secondary-font-weight, 400)","font_family":"var(--widget-secondary-font-family, Roboto)","font_size":"11px"}},"toggle_icon":{"color":"var(--text-color)","background_color":"var(--toggle-color)"},"background":"var(--chart-background-color)","affected_by_filter":true,"grid":{"horizontal":{"apply_body":true,"color":"var(--table-grid-line-color)","thickness":"1px","row_padding":"0px","apply_total":true,"apply_header":true},"vertical":{"apply_body":false,"color":"var(--table-grid-line-color)","thickness":"1px","apply_total":false,"apply_header":false}},"header":{"style":{"is_word_wrap":false,"color":"var(--text-color)","font_style":"var(--widget-primary-font-style, normal)","font_weight":"var(--widget-primary-font-weight, 500)","font_family":"var(--widget-primary-font-family, Roboto)","font_size":"12px"},"align":"left","is_word_wrap":false,"background_color":"var(--header-background-color)","color":"var(--text-color)","is_auto_width_size":false},"tooltip":{"font_family":"var(--widget-secondary-font-family, Roboto)","background_color":"var(--tooltip-background-color)","value_color":"var(--secondary-text-color)"},"title":{"align":"center","enabled":true,"text":"Untitled Chart","style":{"color":"var(--text-color)","font_style":"var(--widget-primary-font-style, normal)","font_weight":"var(--widget-primary-font-weight, 500)","font_family":"var(--widget-primary-font-family, Roboto)","font_size":"20px"}},"value":{"style":{"is_word_wrap":false,"color":"var(--secondary-text-color)","font_style":"var(--widget-secondary-font-style, normal)","font_weight":"var(--widget-secondary-font-weight, 400)","font_family":"var(--widget-secondary-font-family, Roboto)","font_size":"12px"},"align":"left","background_color":"var(--row-even-background-color)","color":"var(--text-color)","enable_url_icon":false,"alternate_background_color":"var(--row-odd-background-color)","alternate_color":"var(--text-color)"}},"class_name":"flatten_table_setting"},"dynamic_function_ids":[]},"creator_id":"up-0a51dda6-e152-4db7-aad0-7bc2ed89d222","owner_id":"up-0a51dda6-e152-4db7-aad0-7bc2ed89d222","background_color":"var(--chart-background-color)","text_color":"#fff","extra_data":{"configs":{"columns":[{"is_show_n_elements":false,"name":"name","table_name":"organization","is_nested":false,"field":{"field_type":"string","db_name":"analtyics","tbl_name":"organization","class_name":"table_field","field_name":"name"},"column_name":"name","function_family":"None","display_as_column":false,"id":2586,"sorting":"Unsorted","num_elems_shown":10,"function_type":""},{"is_show_n_elements":false,"name":"owner","table_name":"organization","is_nested":false,"field":{"field_type":"string","db_name":"analtyics","tbl_name":"organization","class_name":"table_field","field_name":"owner"},"column_name":"owner","function_family":"None","display_as_column":false,"id":1506,"sorting":"Unsorted","num_elems_shown":10,"function_type":""},{"is_show_n_elements":false,"name":"is_active","table_name":"organization","is_nested":false,"field":{"field_type":"int8","db_name":"analtyics","tbl_name":"organization","class_name":"table_field","field_name":"is_active"},"column_name":"is_active","function_family":"None","display_as_column":false,"id":751,"sorting":"Unsorted","num_elems_shown":10,"function_type":""},{"is_show_n_elements":false,"name":"report_time_zone_id","table_name":"organization","is_nested":false,"field":{"field_type":"string","db_name":"analtyics","tbl_name":"organization","class_name":"table_field","field_name":"report_time_zone_id"},"column_name":"report_time_zone_id","function_family":"None","display_as_column":false,"id":402,"sorting":"Unsorted","num_elems_shown":10,"function_type":""}]},"filters":{},"current_chart_type":"flatten_table"},"comparison_info":{}}],"widget_positions":{"53":{"row":0,"column":0,"width":16,"height":8,"z_index":0},"54":{"row":0,"column":16,"width":22,"height":10,"z_index":0}},"use_as_template":false,"all_query_views":[{"class_name":"table_view","db_name":"analtyics","tbl_name":"organization","alias_name":"tbl_754205"}]}}"""
//    val response: Response = server.httpPost(
//      s"$apiPath/template?admin_secret_key=12345678",
//      postBody = request,
//      andExpect = Status.Ok,
//    )
//    val template = Serializer.fromJson[TemplateDashboard](response.contentString)
//    templateId = template.id
//  }

//  test("create dashboard from template") {
//    val request = s"""{"template_id":${templateId},"name":"Sales Template","parent_directory_id":-1}"""
//    val response: Response = server.httpPost(
//      s"$apiPath/create_from_template",
//      postBody = request,
//      andExpect = Status.Ok,
//    )
//  }

}
