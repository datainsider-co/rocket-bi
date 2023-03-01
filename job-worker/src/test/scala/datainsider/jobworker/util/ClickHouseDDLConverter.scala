package datainsider.jobworker.util;

import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.exception.UnsupportedError;

case class ClickHouseDDLConverter() extends Logging {

  // this only create shard table
  def toCreateSQL(tableSchema: TableSchema): String = {
    s"""
       |CREATE TABLE IF NOT EXISTS `${tableSchema.dbName}`.`${tableSchema.name}`(
       | ${toMultiColumnDDL(tableSchema.columns)}
       |) ENGINE = MergeTree()
       |${getPrimaryKeyDDL(tableSchema)}
       |${getPartitionByDDL(tableSchema)}
       |ORDER BY ${getOrderByDDL(tableSchema)}
       |""".stripMargin
  }


  private def toMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(toColumnDDLExpr(_))
      .filterNot(_ == null)
      .filterNot(_.isEmpty)
      .mkString(",\n")
  }

  private def toColumnDDLExpr(column: Column, defaultEnabled: Boolean = true): String = {
    column match {
      case column: NestedColumn => toNestedColumnDDLExpr(column)
      case column               => s"`${column.name}` ${getSQLDataTypeExpr(column)}"
    }
  }

  private def toNestedColumnDDLExpr(column: NestedColumn): String = {
    column.nestedColumns.nonEmpty match {
      case false => ""
      case true =>
        val childColumnDDL = column.nestedColumns
          .filterNot(_.isInstanceOf[NestedColumn])
          .map(toColumnDDLExpr(_, false))
        s"""
           |`${column.name}` Nested(
           | \t${childColumnDDL.mkString(",\n\t")}
           | )
           |""".stripMargin
    }
  }

  private def getSQLDataTypeExpr(column: Column): String = {
    val dataType = column match {
      case column: BoolColumn   => "UInt8"
      case column: Int8Column   => "Int8"
      case column: Int16Column  => "Int16"
      case column: Int32Column  => "Int32"
      case column: Int64Column  => "Int64"
      case column: UInt8Column  => "UInt8"
      case column: UInt16Column => "UInt16"
      case column: UInt32Column => "UInt32"
      case column: UInt64Column => "UInt64"
      case column: FloatColumn  => "Float32"
      case column: DoubleColumn => "Float64"
      case column: StringColumn => "String"
      case column: DateColumn   => "Date"
      case column: DateTimeColumn =>
        if (column.timezone.isDefined)
          s"DateTime('${column.timezone.getOrElse("")}')"
        else
          s"DateTime"
      case column: DateTime64Column =>
        if (column.timezone.isDefined)
          s"DateTime64(3,'${column.timezone.getOrElse("")}')"
        else
          s"DateTime64(3)"
      case arrayColumn: ArrayColumn => s"Array(${getSQLDataTypeExpr(arrayColumn.column)})"
      case column: NestedColumn     => "Nested"
      case _                        => throw UnsupportedError(s"This column isn't supported: ${column.getClass.getName}")
    }

    (column.isNullable, column) match {
      case (false, _)              => dataType
      case (true, _: ArrayColumn)  => dataType
      case (true, _: NestedColumn) => dataType
      case _                       => s"Nullable($dataType)"
    }
  }

  private def getPrimaryKeyDDL(tableInfo: TableSchema): String = {
    if (tableInfo.primaryKeys != null && tableInfo.primaryKeys.nonEmpty) {
      s"PRIMARY KEY (${tableInfo.primaryKeys.mkString(", ")})"
    } else {
      ""
    }
  }

  private def getPartitionByDDL(tableSchema: TableSchema): String = {
    if (tableSchema.partitionBy != null && tableSchema.partitionBy.nonEmpty) {
      s"PARTITION BY (${tableSchema.partitionBy.mkString(",")})"
    } else {
      ""
    }
  }

  private def getOrderByDDL(tableInfo: TableSchema): String = {
    if (tableInfo.orderBys != null && tableInfo.orderBys.nonEmpty) {
      s"(${tableInfo.orderBys.mkString(", ")})"
    } else {
      "tuple()"
    }
  }


}
