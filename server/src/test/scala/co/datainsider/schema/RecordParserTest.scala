package co.datainsider.schema

import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.schema.misc.ColumnDetector
import co.datainsider.schema.misc.parser.ClickHouseDataParser
import com.twitter.inject.Test
import co.datainsider.common.client.util.JsonParser
import org.scalatest.BeforeAndAfterAll

import java.sql.Timestamp

/**
  * @author andy
  * @since 7/10/20
  */
class RecordParserTest extends Test with BeforeAndAfterAll {

  test("Normalize properties") {

    val properties = ColumnDetector.normalizeProperties(
      Map[String, Any](
        "di_event" -> "Purchased",
        "di_tracking_id" -> "1",
        "di_platform" -> "web",
        "di_lib_version" -> "0.0.1",
        "di_time" -> System.currentTimeMillis(),
        "di_time_ms" -> System.currentTimeMillis(),
        "Item id" -> 10,
        "TITLE" -> "iPhone 6s 99% like new",
        "category" -> "Mobile",
        "price" -> 120.45,
        "is  exclusive" -> true,
        "relevant items" -> Seq(1, 23, 44),
        "purchased time" -> System.currentTimeMillis()
      )
    )
    println(s"Properties: ${JsonParser.toJson(properties)}")

  }

  test("Timestamp") {
    val time = new Timestamp(1600534819971L)
    println(s"""
               |${time.toString}
               |nanos: ${time.getNanos}
               |""".stripMargin)
    time.setNanos(time.getNanos / 1000000)
    println(s"""
               |${time.toString}
               |nanos: ${time.getNanos}
               |""".stripMargin)
  }

  test("Parse records") {
    val tableSchema = TableSchema(
      dbName = "analytics_1",
      name = "transaction",
      organizationId = 1L,
      displayName = "User Transaction",
      columns = Seq(
        Int32Column("id", "Id"),
        DateTimeColumn(
          "created_date",
          "Created Date",
          inputFormats = Seq(
            "yyyy-MM-dd HH:mm:ss"
          )
        ),
        StringColumn("location", "Location"),
        StringColumn("shop", "Shop"),
        Int64Column("sale", "Sale")
      ),
      primaryKeys = Seq("id")
    )

    val records = Seq(
      Array(1, "2020-01-12 09:12:09", "Ho Chi Minh", "PT2000", 67),
      Array(1, "2020-01-12 09:12:09", "Ho Chi Minh", "Yame", 5980),
      Array(1, "2020-02-12 09:12:09", "Hanoi", "4Men", "9080")
    )

    val r = ClickHouseDataParser(tableSchema).parseCSVRecords(records)

    println(JsonParser.toJson(r))

    assertResult(3)(r.totalRecords)
    assertResult(0)(r.totalSkippedRecords)
    assertResult(0)(r.totalInvalidRecords)
    assertResult(0)(r.totalInvalidFields)

  }

  test("Parse properties map with Array Columns") {
    val tableSchema = TableSchema(
      "analytics_1",
      "shopping",
      1L,
      "Shopping Activity",
      Seq(
        StringColumn("di_event", "Event"),
        StringColumn("di_tracking_id", "Tracking Id"),
        StringColumn("di_user_id", "Tracking User Id", defaultValue = Some("")),
        StringColumn("di_platform", "Platform"),
        StringColumn("di_lib_version", "Library Version"),
        DateTime64Column("di_time", "Time"),
        DateTime64Column("di_start_time", "Start Time", defaultValue = Some(0)),
        Int32Column("di_duration", "Duration", defaultValue = Some(0)),
        NestedColumn(
          "purchase",
          "Purchase",
          nestedColumns = Seq(
            Int32Column("item_id", "Id"),
            StringColumn("title", "Product Title"),
            StringColumn("category", "Category"),
            DoubleColumn("price", "Price"),
            BoolColumn("is_exclusive", "Is Exclusive", defaultValue = Some(false)),
            ArrayColumn("relevant_items", "Relevant ItemIds", column = Int32Column("", "")),
            DateTime64Column("purchased_time", "Purchase_Time")
          )
        )
      ),
      primaryKeys = Seq("id"),
      orderBys = Seq("id")
    )

    val properties = Map[String, Any](
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

    val r = ClickHouseDataParser(tableSchema).parseRecord(properties)

    println(s"Parsed result: $r")
    assertResult(1)(r.totalRecords)
    assertResult(0)(r.totalSkippedRecords)
    assertResult(0)(r.totalInvalidRecords)
    assertResult(0)(r.totalInvalidFields)
  }

  test("Parse properties map with Nested Columns") {
    val tableSchema = TableSchema(
      "analytics_1",
      "shopping",
      1L,
      "Shopping Activity",
      Seq(
        StringColumn("di_event", "Event"),
        StringColumn("di_tracking_id", "Tracking Id"),
        StringColumn("di_user_id", "Tracking User Id", defaultValue = Some("")),
        StringColumn("di_platform", "Platform"),
        StringColumn("di_lib_version", "Library Version"),
        DateTime64Column("di_time", "Time"),
        DateTime64Column("di_start_time", "Start Time", defaultValue = Some(0)),
        Int32Column("di_duration", "Duration", defaultValue = Some(0)),
        NestedColumn(
          "purchase",
          "Purchase",
          nestedColumns = Seq(
            Int32Column("id", "Id"),
            Int64Column("price", "Price"),
            DateTime64Column("purchase_time", "Purchase_Time")
          )
        )
      ),
      primaryKeys = Seq("id"),
      orderBys = Seq("id")
    )

    val properties = Map[String, Any](
      "di_event" -> "purchase",
      "di_tracking_id" -> "12",
      "di_platform" -> "web",
      "di_lib_version" -> "0.0.1",
      "di_time" -> "2020-01-12 09:12:09",
      "id" -> 10,
      "price" -> 400000,
      "purchase_time" -> "2019-01-12 09:12:09"
    )

    val r = ClickHouseDataParser(tableSchema).parseRecord(properties)

    assertResult(1)(r.totalRecords)
    assertResult(0)(r.totalSkippedRecords)
    assertResult(0)(r.totalInvalidRecords)
    assertResult(0)(r.totalInvalidFields)

  }

  test("Parse properties map with Nested Map") {
    val tableSchema = TableSchema(
      "analytics_1",
      "shopping",
      1L,
      "Shopping Activity",
      Seq(
        StringColumn("di_event", "Event"),
        StringColumn("di_tracking_id", "Tracking Id"),
        NestedColumn(
          "purchased_info",
          "Purchased Info",
          nestedColumns = Seq(
            Int32Column("item_id", "Id"),
            StringColumn("title", "Title"),
            StringColumn("category", "Category"),
            DoubleColumn("price", "Price"),
            BoolColumn("is_exclusive", "Is Exclusive"),
            ArrayColumn("relevant_items", "Relevant Items", column = Int32Column("relevant_items", "Relevant Items")),
            DateTime64Column("purchased_time", "Purchased Time")
          )
        )
      ),
      primaryKeys = Seq("di_event"),
      orderBys = Seq("di_event")
    )

    val properties = Map[String, Any](
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

    val r = ClickHouseDataParser(tableSchema).parseRecord(properties)

    r.records.foreach(record => {
      println(record)
    })

    assertResult(1)(r.totalRecords)
    assertResult(0)(r.totalSkippedRecords)
    assertResult(0)(r.totalInvalidRecords)
    assertResult(0)(r.totalInvalidFields)

  }

  test("New Clickhouse Parser Parse properties map with Nested Columns") {
    val tableSchema = TableSchema(
      "analytics_1",
      "shopping",
      1L,
      "Shopping Activity",
      Seq(
        StringColumn("di_event", "Event"),
        StringColumn("di_tracking_id", "Tracking Id"),
        StringColumn("di_user_id", "Tracking User Id", defaultValue = Some("")),
        StringColumn("di_platform", "Platform"),
        StringColumn("di_lib_version", "Library Version"),
        DateTime64Column("di_time", "Time"),
        DateTime64Column("di_start_time", "Start Time", defaultValue = Some(0)),
        Int32Column("di_duration", "Duration", defaultValue = Some(0)),
        NestedColumn(
          "purchase",
          "Purchase",
          nestedColumns = Seq(
            Int32Column("id", "Id"),
            Int64Column("price", "Price"),
            Int64Column("discount_price", "Price"),
            ArrayColumn("relevant_items", "Relevant ItemIds", column = Int32Column("", "")),
            DateTime64Column("purchase_time", "Purchase_Time")
          )
        )
      ),
      primaryKeys = Seq("id"),
      orderBys = Seq("id")
    )

    val properties = Map[String, Any](
      "di_event" -> "purchase",
      "di_tracking_id" -> "12",
      "di_platform" -> "web",
      "di_lib_version" -> "0.0.1",
      "di_time" -> "2020-01-12 09:12:09",
      "id" -> 10,
      "price" -> 400000,
      "purchase_time" -> "2019-01-12 09:12:09",
      "relevant_items" -> Seq(1, 23, 44)
    )

    val r = ClickHouseDataParser(tableSchema).parseRecord(properties)
    println(s"""
               |Parsed Record:
               |${r.records}
               | as
               |${r.records.map(JsonParser.toJson(_)).mkString("\n")}
               |""".stripMargin)
    assertResult(1)(r.totalRecords)
    assertResult(0)(r.totalSkippedRecords)
    assertResult(0)(r.totalInvalidRecords)
    assertResult(0)(r.totalInvalidFields)

  }

}
