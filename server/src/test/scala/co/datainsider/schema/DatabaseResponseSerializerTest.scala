package co.datainsider.schema

import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import co.datainsider.schema.domain.column._
import com.twitter.inject.Test
import co.datainsider.common.client.util.JsonParser

/**
  * @author andy
  * @since 7/8/20
  */
class DatabaseResponseSerializerTest extends Test {

  test("Sample database") {
    val organizationId = 1L

    val columns = Seq(
      BoolColumn("online", "Online Status", Some("Indicate user online status"), defaultValue = Some(false)),
      Int8Column("color", "Color", Some("Color for pan")),
      Int16Column("color", "Color", Some("Color for pan")),
      Int32Column("color", "Color", Some("Color for pan")),
      Int64Column("color", "Color", Some("Color for pan")),
      UInt8Column("color", "Color", Some("Color for pan")),
      Int16Column("color", "Color", Some("Color for pan")),
      UInt32Column("color", "Color", Some("Color for pan")),
      Int64Column("color", "Color", Some("Color for pan")),
      StringColumn("name", "Name", Some("name for pan")),
      FloatColumn("percent", "Change Percent", Some("percent change")),
      DoubleColumn("percent", "Decrease Percent", Some("percent change")),
      DateColumn(
        "birthday",
        "Date of Birth",
        Some("Birthday of user"),
        inputFormats = Seq("dd/MM/yyyy")
      ),
      DateTimeColumn(
        "birthday",
        "Date of Birth",
        Some("Birthday of user"),
        timezone = None,
        inputFormats = Seq("dd/MM/yyyy"),
        inputAsTimestamp = false,
        inputTimezone = None
      ),
      DateTime64Column(
        "birthday",
        "Date of Birth",
        Some("Birthday of user"),
        timezone = None,
        inputAsTimestamp = false,
        inputFormats = Seq("dd/MM/yyyy"),
        inputTimezone = None
      )
    )
    val table = TableSchema("user_attribute", "1001_xshop", organizationId, "User Attribute", columns)
    val database = DatabaseSchema("1001_xshop", organizationId, "xshop_1", "X", 1234, 1234, Seq(table))
    val json = JsonParser.toJson(database)

    println(json)
    assert(json != null)
  }

}
