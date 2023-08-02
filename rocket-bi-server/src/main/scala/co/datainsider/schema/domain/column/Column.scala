package co.datainsider.schema.domain.column

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonIgnore, JsonSubTypes, JsonTypeInfo}
import datainsider.client.exception.InternalError

/**
  * @author andy
  * @since 7/8/20
  */

object Column {
  def getCustomClassName(column: Column): String = {
    column match {
      case column: BoolColumn => "bool"
      case column: Int8Column => "int8"
      case column: Int16Column => "int16"
      case column: Int32Column => "int32"
      case column: Int64Column => "int64"
      case column: UInt8Column => "uint8"
      case column: UInt16Column => "uint16"
      case column: UInt32Column => "uint32"
      case column: UInt64Column => "uint64"
      case column: FloatColumn => "float"
      case column: DoubleColumn => "double"
      case column: StringColumn => "string"
      case column: DateColumn => "date"
      case column: DateTimeColumn => "datetime"
      case column: DateTime64Column => "datetime64"
      case column: ArrayColumn => "array"
      case column: NestedColumn => "nested"
      case _ => "string"
    }
  }

  implicit class ColumnWithDefaultValueLike(val column: Column) extends AnyVal {

    def mergeWith(other: Column): Column = {
      column match {
        case column: NestedColumn =>
          other match {
            case other: NestedColumn => mergeNestedColumn(column, other)
            case _                   => throw InternalError(s"Can't change ${column.name} from Nested to ${other.name} ")
          }
        case _ => other
      }
    }

    private def mergeNestedColumn(column: NestedColumn, other: NestedColumn): Column = {
      val currentColumnNames = column.nestedColumns.map(_.name).toSet
      val newColumns = other.nestedColumns.filterNot(c => currentColumnNames.contains(c.name))
      column.copy(
        nestedColumns = column.nestedColumns ++ newColumns
      )
    }
  }

  implicit class ColumnListExtension(val columns: Seq[Column]) extends AnyVal {

    def existsIn(oldColumns: Seq[Column]): Seq[Column] = {
      hasNameIn(oldColumns.map(_.name).toSet)
    }

    def hasNameIn(names: Set[String]): Seq[Column] = {
      columns.filter(column => names.contains(column.name))
    }

    def removeColumns(oldColumns: Seq[Column]): Seq[Column] = {
      removeColumns(oldColumns.map(_.name).toSet)
    }

    def removeColumns(removingNames: Set[String]): Seq[Column] = {
      columns.filterNot(column => removingNames.contains(column.name))
    }

  }
}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[BoolColumn], name = "bool"),
    new Type(value = classOf[Int8Column], name = "int8"),
    new Type(value = classOf[Int16Column], name = "int16"),
    new Type(value = classOf[Int32Column], name = "int32"),
    new Type(value = classOf[Int64Column], name = "int64"),
    new Type(value = classOf[UInt8Column], name = "uint8"),
    new Type(value = classOf[UInt16Column], name = "uint16"),
    new Type(value = classOf[UInt32Column], name = "uint32"),
    new Type(value = classOf[UInt64Column], name = "uint64"),
    new Type(value = classOf[FloatColumn], name = "float"),
    new Type(value = classOf[DoubleColumn], name = "double"),
    new Type(value = classOf[StringColumn], name = "string"),
    new Type(value = classOf[DateColumn], name = "date"),
    new Type(value = classOf[DateTimeColumn], name = "datetime"),
    new Type(value = classOf[DateTime64Column], name = "datetime64"),
    new Type(value = classOf[ArrayColumn], name = "array"),
    new Type(value = classOf[NestedColumn], name = "nested")
  )
)
abstract class Column {
  val name: String
  val displayName: String
  val description: Option[String]

  val isNullable: Boolean
  @deprecated(message = "use `defaultExpression` instead.", since = "06/01/2021")
  val defaultExpr: Option[String]

  val defaultExpression: Option[DefaultExpression]

  val isEncrypted: Boolean

  @JsonIgnore
  def isMaterialized(): Boolean = {
    if (defaultExpression != null)
      defaultExpression.exists(_.defaultType == DefaultTypes.MATERIALIZED)
    else {
      false
    }
  }

  def copyTo(name: String, displayName: String): Column

  def copyTo(
      name: String = this.name,
      displayName: String = this.displayName,
      description: Option[String] = this.description,
      isNullable: Boolean = this.isNullable,
      defaultExpression: Option[DefaultExpression] = this.defaultExpression,
      isEncrypted: Boolean = this.isEncrypted
  ): Column
}
