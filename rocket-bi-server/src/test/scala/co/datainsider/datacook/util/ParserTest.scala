package co.datainsider.datacook.util

import co.datainsider.bi.util.Implicits.ImplicitString
import co.datainsider.bi.util.ZConfig
import co.datainsider.datacook.domain.operator.OldOperator
import co.datainsider.schema.misc.ClickHouseUtils
import co.datainsider.schema.misc.ClickHouseUtils.{ETL_DATABASE_PATTERN, PREVIEW_ETL_DATABASE_PATTERN}
import com.twitter.inject.Test
import datainsider.client.domain.scheduler.{ScheduleOnce, ScheduleTime}
import datainsider.client.util.JsonParser

import scala.util.matching.Regex

/**
  * @author tvc12 - Thien Vi
  * @created 10/14/2021 - 12:01 AM
  */
class ParserTest extends Test {
  test("Parser Success") {
    val text =
      """
        |[
        |    {
        |        "class_name": "join_operator",
        |        "join_configs": [
        |            {
        |                "left_operator": {
        |                    "class_name": "get_data_operator",
        |                    "table_schema": {
        |                        "name": "animal",
        |                        "db_name": "db_testing",
        |                        "organization_id": 1212,
        |                        "display_name": "Table For Testing",
        |                        "columns": [
        |                            {
        |                                "class_name": "string",
        |                                "name": "gender",
        |                                "display_name": "Gender",
        |                                "description": "Hola",
        |                                "default_value": "Female",
        |                                "is_nullable": true,
        |                                "default_expr": null,
        |                                "default_expression": null
        |                            },
        |                            {
        |                                "class_name": "date",
        |                                "name": "birth_day",
        |                                "display_name": "Birth day",
        |                                "description": "Birth day of animal",
        |                                "input_formats": [],
        |                                "default_value": 1632735838402,
        |                                "is_nullable": true,
        |                                "default_expr": null,
        |                                "default_expression": null
        |                            }
        |                        ],
        |                        "engine": null,
        |                        "primary_keys": [],
        |                        "partition_by": [],
        |                        "order_bys": [],
        |                        "query": null,
        |                        "table_type": null,
        |                        "temporary": false
        |                    },
        |                    "dest_table_config": null,
        |                    "is_persistent": false,
        |                    "persist_configuration": null
        |                },
        |                "right_operator": {
        |                    "class_name": "get_data_operator",
        |                    "table_schema": {
        |                        "name": "animal",
        |                        "db_name": "db_testing",
        |                        "organization_id": 1212,
        |                        "display_name": "Table For Testing",
        |                        "columns": [
        |                            {
        |                                "class_name": "string",
        |                                "name": "gender",
        |                                "display_name": "Gender",
        |                                "description": "Hola",
        |                                "default_value": "Female",
        |                                "is_nullable": true,
        |                                "default_expr": null,
        |                                "default_expression": null
        |                            },
        |                            {
        |                                "class_name": "date",
        |                                "name": "birth_day",
        |                                "display_name": "Birth day",
        |                                "description": "Birth day of animal",
        |                                "input_formats": [],
        |                                "default_value": 1632735838402,
        |                                "is_nullable": true,
        |                                "default_expr": null,
        |                                "default_expression": null
        |                            }
        |                        ],
        |                        "engine": null,
        |                        "primary_keys": [],
        |                        "partition_by": [],
        |                        "order_bys": [],
        |                        "query": null,
        |                        "table_type": null,
        |                        "temporary": false
        |                    },
        |                    "dest_table_config": null,
        |                    "is_persistent": false,
        |                    "persist_configuration": null
        |                },
        |                "conditions": [],
        |                "join_type": "left"
        |            }
        |        ],
        |        "dest_table_configuration": {
        |            "tbl_name": "cat",
        |            "db_display_name": "casting",
        |            "tbl_display_name": "catting"
        |        },
        |        "is_persistent": false,
        |        "persist_configuration": null
        |    }
        |]""".stripMargin
    val operators: Array[OldOperator] = JsonParser.fromJson[Seq[OldOperator]](text).toArray

    assertResult(true)(operators.nonEmpty)
  }

  test("schedule time parser") {
    val data = ScheduleOnce(System.currentTimeMillis())
    val jsonData = JsonParser.toJson(data)
    println(jsonData)
    val result = JsonParser.fromJson[ScheduleTime](jsonData)
    println(result)
  }

  test("Pattern matching") {
    val isOk = StringUtils.test("org1_etl_1", ETL_DATABASE_PATTERN)
    assertResult(true)(isOk)
  }

  test("Pattern matching of PREVIEW_ETL_DATABASE_PATTERN") {
    assert(!StringUtils.test("org1_etl_1", PREVIEW_ETL_DATABASE_PATTERN))
    assert(StringUtils.test("org1_preview_etl_1", PREVIEW_ETL_DATABASE_PATTERN))
    assert(!StringUtils.test("preview_etl_qasdasd1", PREVIEW_ETL_DATABASE_PATTERN))
    assert(StringUtils.test("preview_etl_1", PREVIEW_ETL_DATABASE_PATTERN))
  }

  test("Pattern not matching") {
    val isOk = StringUtils.test("org1_preview_etl_1_ho", ETL_DATABASE_PATTERN)
    assertResult(false)(isOk)
  }

  test("Pattern hidden matching") {
    val hiddenPatterns: Seq[String] = ZConfig.getStringList("hidden_db_name_patterns")
    assert(hiddenPatterns.exists(StringUtils.test("org1_preview_etl_1", _)))
    assert(hiddenPatterns.exists(StringUtils.test("org1_etl_1", _)))
    assert(!hiddenPatterns.exists(StringUtils.test("org_1_etl_1_ho", _)))
    assert(!hiddenPatterns.exists(StringUtils.test("etl_1_ho", _)))
    assert(hiddenPatterns.exists(StringUtils.test("etl_123", _)))
    assert(!hiddenPatterns.exists(StringUtils.test("etl_", _)))
    assert(!hiddenPatterns.exists(StringUtils.test("etl", _)))
  }

  test("validate database ok") {
    val json =
      """{"class_name":"join_operator","join_configs":[{"left_operator":{"class_name":"get_data_operator","table_schema":{"name":"covid","db_name":"org1_","organization_id":1,"display_name":"covid","columns":[{"class_name":"int32","name":"cases","display_name":"cases","is_nullable":true},{"class_name":"datetime","name":"date","display_name":"date","input_as_timestamp":false,"input_formats":["yyyy-MM-dd"],"is_nullable":true},{"class_name":"int32","name":"deaths","display_name":"deaths","is_nullable":true},{"class_name":"int32","name":"fips","display_name":"fips","is_nullable":true},{"class_name":"string","name":"state","display_name":"state","is_nullable":true}],"primary_keys":[],"partition_by":[],"order_bys":[],"temporary":false},"is_persistent":false},"right_operator":{"class_name":"get_data_operator","table_schema":{"name":"finance","db_name":"org1_address_10_303966","organization_id":1,"display_name":"finance","columns":[{"class_name":"string","name":"_c0","display_name":"_c0","is_nullable":true},{"class_name":"string","name":"_c1","display_name":"_c1","is_nullable":true},{"class_name":"string","name":"_c2","display_name":"_c2","is_nullable":true},{"class_name":"string","name":"_c3","display_name":"_c3","is_nullable":true},{"class_name":"string","name":"_c4","display_name":"_c4","is_nullable":true},{"class_name":"string","name":"_c5","display_name":"_c5","is_nullable":true},{"class_name":"string","name":"_c6","display_name":"_c6","is_nullable":true},{"class_name":"string","name":"_c7","display_name":"_c7","is_nullable":true},{"class_name":"string","name":"_c8","display_name":"_c8","is_nullable":true},{"class_name":"string","name":"_c9","display_name":"_c9","is_nullable":true}],"primary_keys":[],"partition_by":[],"order_bys":[],"temporary":false},"is_persistent":false},"conditions":[{"class_name":"equal_field","left_field":{"class_name":"table_field","db_name":"org1_etl_3","tbl_name":"covid","field_name":"date","field_type":"datetime"},"right_field":{"class_name":"table_field","db_name":"org1_etl_3","tbl_name":"finance","field_name":"_c3","field_type":"string"}}],"join_type":"left"}],"dest_table_configuration":{"tbl_name":"tbl_covid_finance","db_display_name":"ETL database","tbl_display_name":"Table covid finance"},"is_persistent":false}"""
    val operator = JsonParser.fromJson[OldOperator](json)
    try {
      operator.validate()
    } catch {
      case ex: Throwable =>
        ex.printStackTrace()
        assert(false)
    }
  }

  test("validate database failure ok") {
    val json =
      """{"class_name":"join_operator","join_configs":[{"left_operator":{"class_name":"get_data_operator","table_schema":{"name":"covid","db_name":"org1_","organization_id":1,"display_name":"covid","columns":[{"class_name":"int32","name":"cases","display_name":"cases","is_nullable":true},{"class_name":"datetime","name":"date","display_name":"date","input_as_timestamp":false,"input_formats":["yyyy-MM-dd"],"is_nullable":true},{"class_name":"int32","name":"deaths","display_name":"deaths","is_nullable":true},{"class_name":"int32","name":"fips","display_name":"fips","is_nullable":true},{"class_name":"string","name":"state","display_name":"state","is_nullable":true}],"primary_keys":[],"partition_by":[],"order_bys":[],"temporary":false},"is_persistent":false},"right_operator":{"class_name":"get_data_operator","table_schema":{"name":"finance","db_name":"org1_address_10_303966","organization_id":1,"display_name":"finance","columns":[{"class_name":"string","name":"_c0","display_name":"_c0","is_nullable":true},{"class_name":"string","name":"_c1","display_name":"_c1","is_nullable":true},{"class_name":"string","name":"_c2","display_name":"_c2","is_nullable":true},{"class_name":"string","name":"_c3","display_name":"_c3","is_nullable":true},{"class_name":"string","name":"_c4","display_name":"_c4","is_nullable":true},{"class_name":"string","name":"_c5","display_name":"_c5","is_nullable":true},{"class_name":"string","name":"_c6","display_name":"_c6","is_nullable":true},{"class_name":"string","name":"_c7","display_name":"_c7","is_nullable":true},{"class_name":"string","name":"_c8","display_name":"_c8","is_nullable":true},{"class_name":"string","name":"_c9","display_name":"_c9","is_nullable":true}],"primary_keys":[],"partition_by":[],"order_bys":[],"temporary":false},"is_persistent":false},"conditions":[{"class_name":"equal_field","left_field":{"class_name":"table_field","db_name":"org1_address_10_303966","tbl_name":"covid","field_name":"date","field_type":"datetime"},"right_field":{"class_name":"table_field","db_name":"org_10_303966","tbl_name":"finance","field_name":"_c3","field_type":"string"}}],"join_type":"left"}],"dest_table_configuration":{"tbl_name":"tbl_covid_finance","db_display_name":"ETL database","tbl_display_name":"Table covid finance"},"is_persistent":false}"""
    val operator = JsonParser.fromJson[OldOperator](json)
    try {
      operator.validate()
      assert(false)
    } catch {
      case ex: Throwable =>
        ex.printStackTrace()
        Unit
    }
  }

  test("escape string ok") {
    assertResult("`dog`")("dog".escape)
    assertResult("`animal cat`")("animal cat".escape)
    assertResult("``animal cat``")("`animal cat`".escape)
  }

  test("unescape string ok") {
    assertResult("dog")("`dog`".unescape)
    assertResult("animal cat")("`animal cat`".unescape)
    assertResult("animal cat")("`animal cat`".unescape)
    assertResult("dog")("  `dog`  ".unescape)
    assertResult(" animal cat")(" ` animal cat`".unescape)
    assertResult("animal cat")("  `animal cat`  ".unescape)
  }

  test("unescape and escape string ok") {
    assertResult("`dog`")("`dog`".unescape.escape)
    assertResult("`animal cat`")("`animal cat`".unescape.escape)
    assertResult("`animal cat`")("`animal cat`".unescape.escape)
  }

  test("test matching with: org123_preview_etl_1") {
    logger.info(s"test_matching ${PREVIEW_ETL_DATABASE_PATTERN}")
    val matcher: Option[Regex.Match] = PREVIEW_ETL_DATABASE_PATTERN.r.findFirstMatchIn("org123_preview_etl_1")
    assertResult(true)(matcher.isDefined)
    assertResult("123")(matcher.get.group(1))
  }

  test("test matching with: preview_etl_1") {
    logger.info(s"test_matching ${PREVIEW_ETL_DATABASE_PATTERN}")
    val matcher: Option[Regex.Match] = PREVIEW_ETL_DATABASE_PATTERN.r.findFirstMatchIn("preview_etl_1")
    assertResult(true)(matcher.isDefined)
    assertResult(null)(matcher.get.group(1))
  }

  test("get org from database: org123_preview_etl_1") {
    val orgId = ClickHouseUtils.reverseETLOrgId("org123_preview_etl_1")
    assertResult(123)(orgId)
  }

  test("get org from database: preview_etl_1") {
    val orgId = ClickHouseUtils.reverseETLOrgId("preview_etl_1")
    assertResult(ClickHouseUtils.SINGLE_TENANT_ID)(orgId)
  }
}
