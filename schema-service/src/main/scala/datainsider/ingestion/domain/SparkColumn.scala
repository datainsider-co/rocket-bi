package datainsider.ingestion.domain

import datainsider.ingestion.domain.SparkDataType.SparkDataType
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class SparkColumn(
   name: String,
   @JsonScalaEnumeration(classOf[SparkDataTypeRef]) dataType: SparkDataType,
   defaultValue: String,
   isNullable: Boolean = true
)

class SparkDataTypeRef extends TypeReference[SparkDataType.type]

object SparkDataType extends Enumeration {
  type SparkDataType = Value
  val BooleanType: SparkDataType.Value = Value("BooleanType")
  val IntegerType: SparkDataType.Value = Value("IntegerType")
  val LongType: SparkDataType.Value = Value("LongType")
  val FloatType: SparkDataType.Value = Value("FloatType")
  val DoubleType: SparkDataType.Value = Value("DoubleType")
  val StringType: SparkDataType.Value = Value("StringType")
  val DateType: SparkDataType.Value = Value("DateType")
  val TimestampType: SparkDataType.Value = Value("TimestampType")
  val ShortType: SparkDataType.Value = Value("ShortType")
}

class SparkWriteModeRef extends TypeReference[SparkWriteMode.type]

object SparkWriteMode extends Enumeration {
  type SparkWriteMode = Value
  val Overwrite: SparkWriteMode.Value = Value("overwrite")
  val Append: SparkWriteMode.Value = Value("append")
}
