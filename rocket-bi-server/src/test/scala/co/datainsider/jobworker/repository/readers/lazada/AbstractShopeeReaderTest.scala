package co.datainsider.jobworker.repository.readers.lazada

import co.datainsider.jobworker.repository.reader.lazada.LazadaReader
import com.twitter.inject.Test
import co.datainsider.schema.domain.column._

import java.sql.Timestamp
import java.text.SimpleDateFormat

/**
  * created 2023-04-13 2:21 PM
  *
  * @author tvc12 - Thien Vi
  */
class AbstractShopeeReaderTest extends Test {

  protected def getNDaysAgoAsMillis(nDays: Int): Long = {
    val now: Long = System.currentTimeMillis()
    val nDaysAgoTimestamp: Long = now - nDays * 24 * 60 * 60 * 1000
    nDaysAgoTimestamp
  }

  /**
    * format by IOS 8601 like 2021-04-07T00:00:00Z
    */
  protected def getNDaysAgoAsString(nDays: Int): String = {
    val now: Long = System.currentTimeMillis()
    val nDaysAgoTimestamp: Long = now - nDays * 24 * 60 * 60 * 1000
    formateDate(nDaysAgoTimestamp)
  }

  protected def formateDate(timestamp: Long): String = {
    val date = new java.util.Date(timestamp)
    LazadaReader.DEFAULT_FORMATTER.format(date)
  }

  protected def assertDateFormat(timestamp: Timestamp, pattern: String): Unit = {
    val format: SimpleDateFormat = new java.text.SimpleDateFormat(pattern)
    val text = format.format(timestamp)
    assert(text != null)
    println(s"assertDateFormat: $text")
  }

  protected def assertValue(value: Any, column: Column): Unit = {
    if (value == null) {
      if (column.isInstanceOf[DateTimeColumn]) {
        println(s"column ${column.name} is DateTimeColumn, but parse is null")
      }
    } else {
      column match {
        case _: StringColumn => assert(value.isInstanceOf[String])
        case _: Int8Column   => assert(value.isInstanceOf[Int])
        case _: Int16Column  => assert(value.isInstanceOf[Int])
        case _: Int32Column  => assert(value.isInstanceOf[Int])
        case _: Int64Column  => assert(value.isInstanceOf[Long])
        case _: FloatColumn  => assert(value.isInstanceOf[Float])
        case _: DoubleColumn => assert(value.isInstanceOf[Double])
        case _: BoolColumn   => assert(value.isInstanceOf[Boolean])
        case _: DateTimeColumn => {
          assert(value.isInstanceOf[Timestamp])
          assertDateFormat(value.asInstanceOf[Timestamp], "yyyy-MM-dd'T'HH:mm:ssZ")
        }
        case _ => println(s"not support type ${column.getClass.getName}")
      }
    }
  }

  def ensureExistsValue(value: Any, column: Column, existsColumnNames: Set[String]): Unit = {
    if (existsColumnNames.contains(column.name)) {
      assert(value != null, s"column ${column.name} is null")
    }
  }
}
