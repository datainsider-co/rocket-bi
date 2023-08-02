package co.datainsider.jobscheduler.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[CsvConfig], name = "csv_config")
  )
)
trait FileConfig

case class CsvConfig(
    includeHeader: Boolean = true,
    skipRows: Int = 0,
    delimiter: String = ",",
    quote: Char = '"',
    escape: Char = '\\',
    fileExtensions: Seq[String] = Seq("csv", "txt")
) extends FileConfig
