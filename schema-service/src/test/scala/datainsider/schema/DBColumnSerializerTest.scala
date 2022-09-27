package datainsider.schema

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.Test
import datainsider.client.util.JsonParser
import datainsider.schema.domain.column._
/**
 * @author andy
 * @since 7/8/20
 **/
class DBColumnSerializerTest extends Test {

  test("Bool") {
    val column = BoolColumn("online","Online Status", Some("Indicate user online status"))
    val json = JsonParser.toNode[JsonNode](column)

    assert(json.at("/class_name").asText("").equals("bool"))
    println(json)
  }

  test("Int8") {
    val column = Int8Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("int8"))
    println(json)
  }

  test("Int16") {
    val column = Int16Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("int16"))
    println(json)
  }

  test("Int32") {
    val column = Int32Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("int32"))
    println(json)
  }

  test("Int64") {
    val column = Int64Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("int64"))
    println(json)
  }

  test("UInt8") {
    val column = UInt8Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("uint8"))
    println(json)
  }

  test("UInt16") {
    val column = UInt16Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("uint16"))
    println(json)
  }

  test("UInt32") {
    val column = UInt32Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("uint32"))
    println(json)
  }

  test("UInt64") {
    val column = UInt64Column("color","Color", Some("Color for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("uint64"))
    println(json)
  }

  test("String") {
    val column = StringColumn("name", "Name", Some("name for pan"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("string"))
    println(json)
  }

  test("float") {
    val column = FloatColumn("percent","Change Percent", Some("percent change"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("float"))
    println(json)
  }


  test("Double") {
    val column = DoubleColumn("percent","Decrease percent", Some("percent change"))

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("double"))
    println(json)
  }

  test("Date") {
    val column = DateColumn(
      "birthday",
      "Date of Birth",
      Some("Birthday of user"),
      inputFormats = Seq("dd/MM/yyyy")
    )

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("date"))
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

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("datetime"))
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

    val json = JsonParser.toNode[JsonNode](column)
    assert(json.at("/class_name").asText("").equals("datetime64"))
    println(json)
  }

}
