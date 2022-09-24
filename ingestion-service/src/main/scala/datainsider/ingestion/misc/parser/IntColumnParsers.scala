package datainsider.ingestion.misc.parser

import datainsider.ingestion.domain.{Int16Column, Int32Column, Int64Column, Int8Column}

case class Int8ColumnParser(column: Int8Column) extends IColumnParser[Int8Column] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null       => column.defaultValue.orNull
        case v: Boolean => if (v) 1.toByte else 0.toByte
        case v: Byte    => v
        case v: Short   => v.toByte
        case v: Int     => v.toByte
        case v: Long    => v.toByte
        case _          => data.toString.toByte
      }
    } finally {
      column.defaultValue.orNull
    }
  }
}

case class Int16ColumnParser(column: Int16Column) extends IColumnParser[Int16Column] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null       => column.defaultValue.orNull
        case v: Boolean => if (v) 1 else 0
        case v: Byte    => v
        case v: Short   => v
        case v: Int     => v.toShort
        case v: Long    => v.toShort
        case _          => data.toString.toShort
      }
    } finally {
      column.defaultValue.orNull
    }
  }
}

case class Int32ColumnParser(column: Int32Column) extends IColumnParser[Int32Column] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null       => column.defaultValue.orNull
        case v: Boolean => if (v) 1 else 0
        case v: Byte    => v
        case v: Short   => v
        case v: Int     => v
        case v: Long    => v.toInt
        case _          => data.toString.toInt
      }
    } finally {
      column.defaultValue.orNull
    }
  }
}

case class Int64ColumnParser(column: Int64Column) extends IColumnParser[Int64Column] {
  override def parse(data: Any): Any = {
    try {
      data match {
        case null       => column.defaultValue.orNull
        case v: Boolean => if (v) 1L else 0L
        case v: Byte    => v
        case v: Short   => v
        case v: Int     => v
        case v: Long    => v
        case _          => data.toString.toLong
      }
    } finally {
      column.defaultValue.orNull
    }
  }
}
