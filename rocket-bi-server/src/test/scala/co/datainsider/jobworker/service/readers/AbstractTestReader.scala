package co.datainsider.jobworker.service.readers

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import com.twitter.inject.Test
import co.datainsider.schema.domain.column._
import org.scalatest.FunSuite

import java.sql.{Date, Timestamp}

abstract class AbstractTestReader extends Test {
  def ensureRecords(columns: Seq[Column], records: Seq[Record]): Unit = {
    assert(columns.length == records.head.length)
    records.foreach(record => {
      assert(record.length == columns.length)
      record.zip(columns).map(item => {
        val column: Column = item._2
        val record: Any = item._1
        column match {
          case _: Int32Column => assert(record.isInstanceOf[Int] || record == null)
          case _: UInt32Column => assert(record.isInstanceOf[Int] || record == null)
          case _: DoubleColumn => assert(record.isInstanceOf[Double] || record == null)
          case _: StringColumn =>
            assert(record.isInstanceOf[String] || record == null)
          case _: Int64Column => assert(record.isInstanceOf[Long] || record == null)
          case _: BoolColumn => assert(record.isInstanceOf[Boolean] || record == null)
          case _: DateTimeColumn =>
            assert(record.isInstanceOf[Timestamp] || record == null)
          case _: FloatColumn => assert(record.isInstanceOf[Float] || record == null)
          case _: DateColumn =>
            assert(record.isInstanceOf[Date] || record == null)
          case _ =>
            assert(record == null)
        }
      })
    })

  }
}
