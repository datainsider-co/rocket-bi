package co.datainsider.schema.misc.parser

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.schema.domain.column._
import co.datainsider.common.client.exception.UnsupportedError

/**
  * @author andy
  * @since 7/22/20
  */

trait IColumnParser[C] {
  val column: C
  def parse(input: Any): Any
}

case class ColumnParser(column: Column) extends IColumnParser[Column] {
  override def parse(data: Any): Any = {
    column match {
      case column: BoolColumn       => BoolColumnParser(column).parse(data)
      case column: Int8Column       => Int8ColumnParser(column).parse(data)
      case column: Int16Column      => Int16ColumnParser(column).parse(data)
      case column: Int32Column      => Int32ColumnParser(column).parse(data)
      case column: Int64Column      => Int64ColumnParser(column).parse(data)
      case column: UInt8Column      => UInt8ColumnParser(column).parse(data)
      case column: UInt16Column     => UInt16ColumnParser(column).parse(data)
      case column: UInt32Column     => UInt32ColumnParser(column).parse(data)
      case column: UInt64Column     => UInt64ColumnParser(column).parse(data)
      case column: FloatColumn      => FloatColumnParser(column).parse(data)
      case column: DoubleColumn     => DoubleColumnParser(column).parse(data)
      case column: StringColumn     => StringColumnParser(column).parse(data)
      case column: DateColumn       => DateColumnParser(column).parse(data)
      case column: DateTimeColumn   => DateTimeColumnParser(column).parse(data)
      case column: DateTime64Column => DateTime64ColumnParser(column).parse(data)
      case column: ArrayColumn      => ArrayColumnParser(column).parse(data)
      case column: NestedColumn     => NestedColumnParser(column).parse(data)
      case _                        => throw UnsupportedError(s"this column type is not supported: ${column.getClass.getSimpleName}")
    }
  }
}

case class BoolColumnParser(column: BoolColumn) extends IColumnParser[BoolColumn] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null       => column.defaultValue.orNull
        case v: Boolean => if (v) 1 else 0
        case v: Short   => if (v <= 0) 0 else 1
        case v: Int     => if (v <= 0) 0 else 1
        case v: Long    => if (v <= 0) 0 else 1
        case v: Float   => if (v <= 0) 0 else 1
        case v: Double  => if (v <= 0) 0 else 1
        case _          => if (data.toString.toBoolean) 1 else 0
      }
    } finally {
      column.defaultValue.orNull
    }
  }
}

case class FloatColumnParser(column: FloatColumn) extends IColumnParser[FloatColumn] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null       => column.defaultValue.orNull
        case v: Boolean => if (v) 1 else 0
        case v: Byte    => v
        case v: Short   => v
        case v: Int     => v
        case v: Long    => v
        case v: Float   => v
        case v: Double  => v.toFloat
        case _          => data.toString.toFloat
      }
    } finally {
      column.defaultValue.orNull
    }
  }
}

case class DoubleColumnParser(column: DoubleColumn) extends IColumnParser[DoubleColumn] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null       => column.defaultValue.orNull
        case v: Boolean => if (v) 1 else 0
        case v: Byte    => v
        case v: Short   => v
        case v: Int     => v
        case v: Long    => v
        case v: Float   => v
        case v: Double  => v
        case _          => data.toString.toDouble
      }
    } finally {
      column.defaultValue.orNull
    }
  }
}

case class StringColumnParser(column: StringColumn) extends IColumnParser[StringColumn] {
  override def parse(data: Any): Any = {
    data match {
      case null      => column.defaultValue.getOrElse("")
      case v: String => v
      case _         => data.toString
    }
  }
}

case class ArrayColumnParser(column: ArrayColumn) extends IColumnParser[ArrayColumn] {

  override def parse(data: Any): Any = {
    val itemColumn = column.column
    try {
      data match {
        case null        => column.defaultValue.map(v => v.map(ColumnParser(itemColumn).parse(_))).orNull
        case v: Seq[_]   => v.map(ColumnParser(itemColumn).parse(_))
        case v: Array[_] => v.map(ColumnParser(itemColumn).parse(_)).toSeq
        case _           => Seq(ColumnParser(itemColumn).parse(data))
      }
    } catch {
      case _: Throwable => column.defaultValue.map(v => v.map(ColumnParser(itemColumn).parse(_))).orNull
    }
  }

}

case class NestedColumnParser(column: NestedColumn) extends IColumnParser[NestedColumn] {

  override def parse(data: Any): Any = {
    data match {
      case record: Seq[_]               => parseRecord(record)
      case record: Array[_]             => parseRecord(record)
      case properties: Map[String, Any] => parseRecordFromMap(properties)
      case _                            => Seq.empty
    }
  }

  private def parseRecord(record: Seq[_]): Record = {
    column.nestedColumns
      .zip(record)
      .map { case (column, v) => ColumnParser(column).parse(v) }
      .toArray
  }

  private def parseRecordFromMap(properties: Map[String, Any]): Record = {
    column.nestedColumns
      .map(column => column -> properties.getOrElse(column.name, null))
      .map {
        case (column, v) => ColumnParser(column).parse(v)
      }
      .toArray
  }

}
