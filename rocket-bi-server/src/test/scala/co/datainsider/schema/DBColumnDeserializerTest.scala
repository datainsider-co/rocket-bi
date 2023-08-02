package co.datainsider.schema

import co.datainsider.schema.domain.column._
import com.twitter.inject.Test
import datainsider.client.util.JsonParser

/**
  * @author andy
  * @since 7/8/20
  */
class DBColumnDeserializerTest extends Test {

  test("Bool") {
    val column =
      BoolColumn("online", "Online Status", Some("Indicate user online status"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("Int8") {
    val column = Int8Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("Int16") {
    val column = Int16Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("Int32") {
    val column = Int32Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("Int64") {
    val column = Int64Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("UInt8") {
    val column = UInt8Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("UInt16") {
    val column = UInt16Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("UInt32") {
    val column = UInt32Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("UInt64") {
    val column = UInt64Column("color", "Color", Some("Color for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("String") {
    val column = StringColumn("name", "Name", Some("name for pan"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("float") {
    val column =
      FloatColumn("percent", "Change Percent", Some("percent change"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("Double") {
    val column =
      DoubleColumn("percent", "Decrease Percent", Some("percent change"))

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("Date") {
    val column = DateColumn(
      "birthday",
      "Date of Birth",
      Some("Birthday of user"),
      inputFormats = Seq("dd/MM/yyyy")
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("DateTime") {
    val column = DateTimeColumn(
      "birthday",
      "Date of Birth",
      Some("Birthday of user"),
      timezone = None,
      inputFormats = Seq("dd/MM/yyyy"),
      inputAsTimestamp = false,
      inputTimezone = None
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("DateTime64") {
    val column = DateTime64Column(
      "birthday",
      "Date of Birth",
      Some("Birthday of user"),
      timezone = None,
      inputAsTimestamp = false,
      inputFormats = Seq("dd/MM/yyyy"),
      inputTimezone = None
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("Array of String") {
    val column = ArrayColumn(
      "name",
      "Name",
      None,
      column = StringColumn("name", "Name", Some("name for pan"))
    );

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    println(json)
    assert(column == deserializedColumn)

  }

  test("DI Platform") {
    val column = StringColumn(
      "di_platform",
      "Platform"
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("DI Library Version") {
    val column = StringColumn(
      "di_lib_version",
      "Library Version"
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("DI User Id") {
    val column = StringColumn(
      "di_user_id",
      "User Id"
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("DI Start Time") {
    val column = Int64Column(
      "di_start_time",
      "Start Time",
      defaultValue = Some(0L)
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

  test("DI Duration") {
    val column = UInt64Column(
      "di_duration",
      "Duration",
      defaultValue = Some(0L)
    )

    val json = JsonParser.toJson(column)
    val deserializedColumn = JsonParser.fromJson[Column](json)

    assert(column == deserializedColumn)
    println(json)
  }

}
