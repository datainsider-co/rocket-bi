package co.datainsider.datacook.util

import co.datainsider.datacook.domain.EtlJob.ImplicitEtlOperator2Operator
import co.datainsider.datacook.domain.OperatorInfo
import co.datainsider.datacook.domain.operator.OldOperator
import com.twitter.inject.Test
import datainsider.client.util.JsonParser

class OldOperator2OperatorTest extends Test {
  test("convert etl Operators to Operators") {
    val json = """
        |[ {
        |  "class_name" : "join_operator",
        |  "join_configs" : [ {
        |    "left_operator" : {
        |      "class_name" : "get_data_operator",
        |      "table_schema" : {
        |        "name" : "view_product",
        |        "db_name" : "analytics",
        |        "organization_id" : 0,
        |        "display_name" : "view_product",
        |        "columns" : [ {
        |          "class_name" : "int64",
        |          "name" : "end_time",
        |          "display_name" : "End Time",
        |          "description" : null,
        |          "default_value" : 0,
        |          "is_nullable" : true,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "bool",
        |          "name" : "is_checkout_out",
        |          "display_name" : "Is Checkout Out",
        |          "description" : null,
        |          "default_value" : false,
        |          "is_nullable" : true,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "int64",
        |          "name" : "start_time",
        |          "display_name" : "Start Time",
        |          "description" : null,
        |          "default_value" : 0,
        |          "is_nullable" : true,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "int32",
        |          "name" : "total_product_views",
        |          "display_name" : "Total Product Views",
        |          "description" : null,
        |          "default_value" : 0,
        |          "is_nullable" : true,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "user_id",
        |          "display_name" : "User Id",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        } ],
        |        "engine" : null,
        |        "primary_keys" : [ ],
        |        "partition_by" : [ ],
        |        "order_bys" : [ ],
        |        "query" : null,
        |        "table_type" : "default",
        |        "temporary" : false
        |      },
        |      "dest_table_config" : {
        |        "tbl_name" : "analytics_view_product",
        |        "db_display_name" : "Analytics",
        |        "tbl_display_name" : "view_product"
        |      },
        |      "is_persistent" : false,
        |      "persist_configuration" : null,
        |      "third_party_persist_configurations" : [ ],
        |      "email_configuration" : null
        |    },
        |    "right_operator" : {
        |      "class_name" : "get_data_operator",
        |      "table_schema" : {
        |        "name" : "di_user_events",
        |        "db_name" : "analytics_0",
        |        "organization_id" : 0,
        |        "display_name" : "Events",
        |        "columns" : [ {
        |          "class_name" : "string",
        |          "name" : "di_browser",
        |          "display_name" : "Browser",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "array",
        |          "name" : "di_browser_languages",
        |          "display_name" : "Browser Languages",
        |          "description" : null,
        |          "column" : {
        |            "class_name" : "string",
        |            "name" : "di_browser_languages",
        |            "display_name" : "Browser Languages",
        |            "description" : null,
        |            "default_value" : null,
        |            "is_nullable" : false,
        |            "is_encrypted" : false,
        |            "default_expr" : null,
        |            "default_expression" : null
        |          },
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_value" : [ ],
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_browser_preffered_lang",
        |          "display_name" : "Browser Preffered Language",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_browser_ua",
        |          "display_name" : "Browser User Agent",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_browser_version",
        |          "display_name" : "Browser Version",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_client_ip",
        |          "display_name" : "Client Ip",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "uint64",
        |          "name" : "di_duration",
        |          "display_name" : "Event Duration",
        |          "description" : null,
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_event",
        |          "display_name" : "Event",
        |          "description" : null,
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_event_display_name",
        |          "display_name" : "Event Display Name",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_event_id",
        |          "display_name" : "Event Id",
        |          "description" : null,
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_lib_platform",
        |          "display_name" : "Lib Platform",
        |          "description" : null,
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_lib_version",
        |          "display_name" : "Client Library Version",
        |          "description" : null,
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_os",
        |          "display_name" : "OS",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_os_version",
        |          "display_name" : "OS Version",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_os_version_name",
        |          "display_name" : "OS Version Name",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_path",
        |          "display_name" : "Path",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_platform",
        |          "display_name" : "Platform",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_platform_model",
        |          "display_name" : "Platform Model",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_platform_vendor",
        |          "display_name" : "Platform Vendor",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_referrer",
        |          "display_name" : "Referrer",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_referrer_host",
        |          "display_name" : "Referrer Host",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_referrer_params",
        |          "display_name" : "Referrer Query Params",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_referrer_search_engine",
        |          "display_name" : "Referrer Search Engine",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_referrer_search_keyword",
        |          "display_name" : "Referrer Search Keyword",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_screen_name",
        |          "display_name" : "Screen Name",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_session_id",
        |          "display_name" : "Session Id",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "datetime64",
        |          "name" : "di_start_time",
        |          "display_name" : "Start Time",
        |          "description" : "",
        |          "timezone" : null,
        |          "input_as_timestamp" : true,
        |          "input_timezone" : null,
        |          "input_formats" : [ ],
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "bool",
        |          "name" : "di_system_event",
        |          "display_name" : "Is System Event",
        |          "description" : null,
        |          "default_value" : false,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "datetime64",
        |          "name" : "di_time",
        |          "display_name" : "Time",
        |          "description" : "",
        |          "timezone" : null,
        |          "input_as_timestamp" : true,
        |          "input_timezone" : null,
        |          "input_formats" : [ ],
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "int64",
        |          "name" : "di_time_ms",
        |          "display_name" : "Time In MS",
        |          "description" : "",
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_tracking_id",
        |          "display_name" : "Tracking Id",
        |          "description" : null,
        |          "default_value" : null,
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_url",
        |          "display_name" : "Url",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_url_params",
        |          "display_name" : "Query Params",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        }, {
        |          "class_name" : "string",
        |          "name" : "di_user_id",
        |          "display_name" : "User Id",
        |          "description" : null,
        |          "default_value" : "",
        |          "is_nullable" : false,
        |          "is_encrypted" : false,
        |          "default_expr" : null,
        |          "default_expression" : null
        |        } ],
        |        "engine" : null,
        |        "primary_keys" : [ ],
        |        "partition_by" : [ ],
        |        "order_bys" : [ ],
        |        "query" : null,
        |        "table_type" : "default",
        |        "temporary" : false
        |      },
        |      "dest_table_config" : {
        |        "tbl_name" : "analytics_0_di_user_events",
        |        "db_display_name" : "Analytics",
        |        "tbl_display_name" : "Events"
        |      },
        |      "is_persistent" : false,
        |      "persist_configuration" : null,
        |      "third_party_persist_configurations" : [ ],
        |      "email_configuration" : null
        |    },
        |    "conditions" : [ {
        |      "class_name" : "equal_field",
        |      "left_field" : {
        |        "class_name" : "table_field",
        |        "db_name" : "preview_etl_34",
        |        "tbl_name" : "analytics_view_product",
        |        "field_name" : "user_id",
        |        "field_type" : "string",
        |        "alias_name" : null
        |      },
        |      "right_field" : {
        |        "class_name" : "table_field",
        |        "db_name" : "preview_etl_34",
        |        "tbl_name" : "analytics_0_di_user_events",
        |        "field_name" : "di_path",
        |        "field_type" : "string",
        |        "alias_name" : null
        |      },
        |      "left_scalar_function" : null,
        |      "right_scalar_function" : null
        |    } ],
        |    "join_type" : "left"
        |  } ],
        |  "dest_table_configuration" : {
        |    "tbl_name" : "analytics_view_product_analytics_0_di_user_events_join",
        |    "db_display_name" : "ETL Database",
        |    "tbl_display_name" : "view_product Events Join"
        |  },
        |  "is_persistent" : true,
        |  "persist_configuration" : null,
        |  "third_party_persist_configurations" : [ {
        |    "class_name" : "oracle_jdbc_persist_configuration",
        |    "host" : "di-oracle",
        |    "port" : 1521,
        |    "service_name" : "ORCLCDB.localdomain",
        |    "username" : "tvc12",
        |    "password" : "di@123456",
        |    "database_name" : "TVC12",
        |    "table_name" : "yyyyy",
        |    "persist_type" : "Update",
        |    "ssl_configuration" : null,
        |    "ssl_server_cert_dn" : "",
        |    "retry_count" : 5,
        |    "retry_delay" : 2,
        |    "display_name" : null
        |  } ],
        |  "email_configuration" : null
        |} ]""".stripMargin
    val etlOperators = JsonParser.fromJson[Seq[OldOperator]](json).toArray
    val operatorInfo: OperatorInfo = etlOperators.toOperatorInfo()
    assert(operatorInfo != null)
    assert(operatorInfo.connections.length == 5)

    println(s"connections:: ")
    operatorInfo.connections.foreach {
      case (from, to) => println(s"linked ${from} -> ${to}")
    }

    println(s"data:: ${operatorInfo.mapOperators}")
  }
}
