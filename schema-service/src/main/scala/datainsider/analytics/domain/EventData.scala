package datainsider.analytics.domain

object SystemTrackingEvents {
  val SESSION_END = "di_session_end"
  val PAGEVIEW = "di_pageview"
}

/**
  *  this should match with the column name in the config file: analytics.shared_columns
  */
object EventColumnIds {
  val EVENT_ID = "di_event_id"
  val EVENT_NAME = "di_event"
  val EVENT_DISPLAY_NAME = "di_event_display_name"
  val IS_SYSTEM_EVENT = "di_system_event"
  val LIB_PLATFORM = "di_lib_platform"
  val LIB_VERSION = "di_lib_version"
  val TRACKING_ID = "di_tracking_id"
  val SESSION_ID = "di_session_id"
  val USER_ID = "di_user_id"
  val SCREEN_NAME = "di_screen_name"
  val CLIENT_IP = "di_client_ip"
  val URL = "di_url"
  val PATH = "di_path"
  val QUERY_PARAMS = "di_url_params"
  val REFERRER = "di_referrer"
  val REFERRER_HOST = "di_referrer_host"
  val REFERRER_QUERY_PARAMS = "di_referrer_params"
  val REFERRER_SEARCH_ENGINE = "di_referrer_search_engine"
  val SEARCH_ENGINE_KEYWORD = "di_referrer_search_keyword"
  val OS = "di_os"
  val OS_VERSION = "di_os_version"
  val OS_VERSION_NAME = "di_os_version_name"
  val BROWSER = "di_browser"
  val BROWSER_VERSION = "di_browser_version"
  val BROWSER_USER_AGENT = "di_browser_ua"
  val BROWSER_PREFERRED_LANG = "di_browser_preffered_lang"
  val BROWSER_LANGUAGES = "di_browser_languages"
  val PLATFORM = "di_platform"
  val PLATFORM_MODEL = "di_platform_model"
  val PLATFORM_VENDOR = "di_platform_vendor"
  val START_TIME = "di_start_time"
  val DURATION = "di_duration"
  val TIME = "di_time"
  val TIME_MS = "di_time_ms"

  val ENHANCED_QUERY_PARAM_INFO = "query_param_info"
  val ENHANCED_REFERRER_QUERY_PARAM_INFO = "referrer_query_param_info"
}

case class EventData(
    name: String,
    properties: Map[String, Any],
    detailProperties: Map[String, Any]
)
