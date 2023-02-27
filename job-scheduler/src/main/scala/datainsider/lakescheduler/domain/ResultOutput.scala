package datainsider.lakescheduler.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.lakescheduler.domain.WriteMode.WriteMode

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[HadoopResultOutput], name = "hadoop_result_output"),
    new Type(value = classOf[ClickhouseResultOutput], name = "clickhouse_result_output")
  )
)
abstract class ResultOutput

case class HadoopResultOutput(
    resultPath: String,
    @JsonScalaEnumeration(classOf[WriteModeRef])
    writeMode: WriteMode
) extends ResultOutput

case class ClickhouseResultOutput(
    databaseName: String,
    tableName: String,
    @JsonScalaEnumeration(classOf[WriteModeRef])
    writeMode: WriteMode
) extends ResultOutput

class WriteModeRef extends TypeReference[WriteMode.type]

object WriteMode extends Enumeration {
  type WriteMode = Value
  val Append: WriteMode.Value = Value("Append")
  val Replace: WriteMode.Value = Value("Replace")
}
