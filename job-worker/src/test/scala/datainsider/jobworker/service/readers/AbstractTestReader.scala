package datainsider.jobworker.service.readers

import datainsider.client.domain.schema.column._
import datainsider.jobworker.client.JdbcClient
import org.scalatest.FunSuite

import java.sql.{Date, Timestamp}

abstract class AbstractTestReader extends FunSuite {
  def ensureRecord(columns: Seq[Column], record: JdbcClient.Record): Unit = {
    assert(columns.length == record.length)

    val columnWithRecord = columns.zip(record)

    columnWithRecord.foreach(item => {
      val column = item._1
      val record = item._2
      column match {
        case _: Int32Column  => assert(record.isInstanceOf[Int] || record == null)
        case _: UInt32Column => assert(record.isInstanceOf[Int] || record == null)
        case _: DoubleColumn => assert(record.isInstanceOf[Double] || record == null)
        case _: StringColumn =>
          assert(record.isInstanceOf[String] || record == null)
        case _: Int64Column => assert(record.isInstanceOf[Long] || record == null)
        case _: BoolColumn  => assert(record.isInstanceOf[Boolean] || record == null)
        case _: DateTimeColumn =>
          assert(record.isInstanceOf[Timestamp] || record == null)
        case _: FloatColumn => assert(record.isInstanceOf[Float] || record == null)
        case _: DateColumn =>
          assert(record.isInstanceOf[Date] || record == null)
        case _ =>
          assert(record == null)
      }
    })

  }
}
