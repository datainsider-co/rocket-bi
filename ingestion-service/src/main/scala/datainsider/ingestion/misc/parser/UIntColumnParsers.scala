package datainsider.ingestion.misc.parser

import datainsider.ingestion.domain.{UInt16Column, UInt32Column, UInt64Column, UInt8Column}

case class UInt8ColumnParser(column: UInt8Column) extends IColumnParser[UInt8Column] {
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

case class UInt16ColumnParser(column: UInt16Column) extends IColumnParser[UInt16Column] {
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

case class UInt32ColumnParser(column: UInt32Column) extends IColumnParser[UInt32Column] {
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

case class UInt64ColumnParser(column: UInt64Column) extends IColumnParser[UInt64Column] {
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
