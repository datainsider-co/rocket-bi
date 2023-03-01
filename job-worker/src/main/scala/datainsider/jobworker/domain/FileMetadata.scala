package datainsider.jobworker.domain

import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.core.`type`.TypeReference

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

object CompressType extends Enumeration {
  type CompressType = Value
  val GZ: CompressType = Value("gz")
  val Zip: CompressType = Value("zip")
  val XZ: CompressType = Value("xz")
  val None: CompressType = Value("none")

  def isCompressed(fileExtension: String): Boolean = values.exists(_.toString == fileExtension)
}

class CompressTypeRef extends TypeReference[CompressType.type]
