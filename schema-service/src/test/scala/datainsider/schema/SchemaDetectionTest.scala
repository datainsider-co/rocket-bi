package datainsider.schema

import com.twitter.inject.Test
import datainsider.client.util.JsonParser
import datainsider.schema.domain.column.DateColumn
import datainsider.schema.misc.ColumnDetector
import datainsider.schema.util.{TableExpressionUtils, TimeUtils}
import org.scalatest.BeforeAndAfterAll

/**
  * @author andy
  * @since 7/10/20
  */
class SchemaDetectionTest extends Test with BeforeAndAfterAll {

  test("Parse Date From String") {

    val date = "4/12/2017"
    val fmt = "dd/MM/yyyy"

    val t = TimeUtils.parse(date, fmt)

    println(t)
    assertResult(true)(TimeUtils.isEqualDate(date, TimeUtils.format(t, fmt)))
  }

  test("Detect MM/dd/yyyy Date In String") {

    val properties = JsonParser.fromJson[Map[String, Any]](
      JsonParser.toJson(
        Map[String, Any](
          "di_event" -> "Purchased",
          "created_at" -> "12/05/2017"
        )
      )
    )

    val columns = ColumnDetector.detectColumns(properties)

    println(s"Columns: ${JsonParser.toJson(columns)}")
    assertResult(2)(columns.size)

    assertResult(true)(columns(1).isInstanceOf[DateColumn])

  }

  test("Detect dd/MM/yyyy Date In String") {

    val properties = Map[String, Any](
      "di_event" -> "Purchased",
      "created_at" -> "24/05/2017"
    )

    val columns = ColumnDetector.detectColumns(properties)

    println(s"Columns: ${JsonParser.toJson(columns)}")
    assertResult(2)(columns.size)

    assertResult(true)(columns(1).isInstanceOf[DateColumn])

  }

  test("Detect d/M/yyyy Date In String") {

    val properties = Map[String, Any](
      "di_event" -> "Purchased",
      "created_at" -> "4/05/2017"
    )

    val columns = ColumnDetector.detectColumns(properties)

    println(s"Columns: ${JsonParser.toJson(columns)}")
    assertResult(2)(columns.size)

    assertResult(true)(columns(1).isInstanceOf[DateColumn])

  }

  test("Detect schema from properties") {

    val properties = JsonParser.fromJson[Map[String, Any]](
      JsonParser.toJson(
        Map[String, Any](
          "di_event" -> "Purchased",
          "di_tracking_id" -> "1",
          "di_platform" -> "web",
          "di_lib_version" -> "0.0.1",
          "di_time" -> System.currentTimeMillis(),
          "di_time_ms" -> System.currentTimeMillis(),
          "item_id" -> 10,
          "title" -> "iPhone 6s 99% like new",
          "category" -> "Mobile",
          "price" -> 120.45,
          "is_exclusive" -> true,
          "relevant_items" -> Seq(1, 23, 44),
          "purchased_time" -> System.currentTimeMillis()
        )
      )
    )

    val columns = ColumnDetector.detectColumns(properties)

    println(s"Columns: ${JsonParser.toJson(columns)}")
    assertResult(13)(columns.size)

    assertResult(13)(
      columns
        .map(_.name)
        .intersect(
          Seq(
            "di_event",
            "di_tracking_id",
            "di_platform",
            "di_lib_version",
            "di_time",
            "di_time_ms",
            "item_id",
            "title",
            "category",
            "price",
            "is_exclusive",
            "relevant_items",
            "purchased_time"
          )
        )
        .size
    )

  }

  test("Detect schema from properties has nested map") {
    val json = JsonParser.toJson(
      Map[String, Any](
        "di_event" -> "Purchased",
        "di_tracking_id" -> "1",
        "purchased_info" -> Map(
          "item_id" -> 10,
          "title" -> "iPhone 6s 99% like new",
          "category" -> "Mobile",
          "price" -> 120.45,
          "is_exclusive" -> true,
          "relevant_items" -> Seq(1, 23, 44),
          "purchased_time" -> System.currentTimeMillis()
        )
      )
    )
    val properties = JsonParser.fromJson[Map[String, Any]](json)

    val columns = ColumnDetector.detectColumns(properties)

    println(s"Detect: $json")
    println(s"Columns: ${JsonParser.toJson(columns)}")
    assertResult(3)(columns.size)

    assertResult(3)(
      columns
        .map(_.name)
        .intersect(
          Seq(
            "di_event",
            "di_tracking_id",
            "purchased_info"
          )
        )
        .size
    )

  }

  test(" test find full expression from existing expressions") {
    val fullExpr =
      TableExpressionUtils.parseFullExpr(
        sql = "select (cost_usd + cost_jpy) * 23000 from sale_db.trans",
        existingExpressions = Map("cost_usd" -> "cost/23000", "cost_jpy" -> "cost/170", "cost" -> "Total_Cost")
      )

    assert(fullExpr == "select (Total_Cost/23000 + Total_Cost/170) * 23000 from sale_db.trans")
    println(fullExpr)
  }

}
