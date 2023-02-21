package datainsider.ingestion.domain

import com.fasterxml.jackson.annotation.{JsonIgnore, JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import datainsider.client.exception.InternalError
import datainsider.ingestion.domain.column.{DefaultExpression, DefaultTypes}

/**
  * @author andy
  * @since 7/8/20
  */

object ColumnTypes {
  val BOOL = "bool"
  val INT8 = "int8"
  val INT16 = "int16"
  val INT32 = "int32"
  val INT64 = "int64"
  val UINT8 = "uint8"
  val UINT16 = "uint16"
  val UINT32 = "uint32"
  val UINT64 = "uint64"
  val FLOAT = "float"
  val DOUBLE = "double"
  val STRING = "string"
  val DATE = "date"
  val DATETIME = "datetime"
  val DATETIME64 = "datetime64"
  val ARRAY = "array"
  val NESTED = "nested"

  val available = Seq(
    ColumnTypes.BOOL,
    ColumnTypes.INT8,
    ColumnTypes.INT16,
    ColumnTypes.INT32,
    ColumnTypes.INT64,
    ColumnTypes.UINT8,
    ColumnTypes.UINT16,
    ColumnTypes.UINT32,
    ColumnTypes.UINT64,
    ColumnTypes.FLOAT,
    ColumnTypes.DOUBLE,
    ColumnTypes.STRING,
    ColumnTypes.DATE,
    ColumnTypes.DATETIME,
    ColumnTypes.DATETIME64,
    ColumnTypes.ARRAY,
    ColumnTypes.NESTED
  )

  def toColumnType(idType: Int): String = {
    import java.sql.Types
    idType match {
      case Types.BIT     => ColumnTypes.BOOL
      case Types.BOOLEAN => ColumnTypes.BOOL

      case Types.TINYINT  => ColumnTypes.INT8
      case Types.SMALLINT => ColumnTypes.INT16
      case Types.INTEGER  => ColumnTypes.INT32
      case Types.BIGINT   => ColumnTypes.INT64

      case Types.FLOAT   => ColumnTypes.FLOAT
      case Types.REAL    => ColumnTypes.DOUBLE
      case Types.DOUBLE  => ColumnTypes.DOUBLE
      case Types.NUMERIC => ColumnTypes.DOUBLE
      case Types.DECIMAL => ColumnTypes.DOUBLE

      case Types.DATE      => ColumnTypes.DATE
      case Types.TIME      => ColumnTypes.DATETIME
      case Types.TIMESTAMP => ColumnTypes.DATETIME64

      case Types.BINARY        => ColumnTypes.STRING
      case Types.VARBINARY     => ColumnTypes.STRING
      case Types.LONGVARBINARY => ColumnTypes.STRING
      case Types.NULL          => ColumnTypes.STRING
      case Types.OTHER         => ColumnTypes.STRING
      case Types.NVARCHAR      => ColumnTypes.STRING
      case Types.LONGNVARCHAR  => ColumnTypes.STRING
      case Types.CHAR          => ColumnTypes.STRING
      case Types.VARCHAR       => ColumnTypes.STRING
      case Types.LONGVARCHAR   => ColumnTypes.STRING
      case Types.ARRAY         => ColumnTypes.NESTED
      case Types.NCHAR         => ColumnTypes.STRING

      case _ => throw InternalError(s"Type ${idType} do not matching any types")
    }
  }
}

object Column {
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
