package co.datainsider.jobscheduler.util

import co.datainsider.jobworker.util.DateTimeUtils
import com.twitter.inject.Test

import java.sql.Date
import java.util.TimeZone

/**
  * created 2023-07-11 2:06 PM
  *
  * @author tvc12 - Thien Vi
  */
class DateTimeUtils extends Test {
  // set local timezone to UTC for testing
  override def beforeAll(): Unit = {
    super.beforeAll()
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
  }

  override def afterAll(): Unit = {
    super.afterAll()
    TimeZone.setDefault(TimeZone.getDefault)
  }



  test("get today") {
    val today: Date = DateTimeUtils.getToday()
    val expected: Date = new Date(System.currentTimeMillis())
    assert(today.toString == expected.toString)
  }

  test("get yesterday") {
    val yesterday: Date = DateTimeUtils.getYesterday()
    val expected: Date = new Date(System.currentTimeMillis() - 24 * 60 * 60 * 1000)
    assert(yesterday.toString == expected.toString)
  }

  test("get last 7 day") {
    val last7Day: Date = DateTimeUtils.getLastNDays(7)
    val expected: Date = new Date(System.currentTimeMillis() - 7 * 24 * 60 * 60 * 1000)
    assert(last7Day.toString == expected.toString)
  }

  test("parse date time") {
    val dateTime: Option[Date] = DateTimeUtils.parseToDate("2021-07-11")
    assert(dateTime.isDefined)
    assert(dateTime.get.toString == "2021-07-11")

    val yesterday: Option[Date] = DateTimeUtils.parseToDate("yesterday")
    assert(yesterday.isDefined)
    val yesterdayExpected: Date = new Date(System.currentTimeMillis() - 24 * 60 * 60 * 1000)
    assert(yesterday.get.toString == yesterdayExpected.toString)

    val today: Option[Date] = DateTimeUtils.parseToDate("today")
    assert(today.isDefined)
    val todayExpected: Date = new Date(System.currentTimeMillis())
    assert(today.get.toString == todayExpected.toString)

    val last7Day: Option[Date] = DateTimeUtils.parseToDate("last_7_days")
    assert(last7Day.isDefined)
    val last7DayExpected: Date = new Date(System.currentTimeMillis() - 7 * 24 * 60 * 60 * 1000)
    assert(last7Day.get.toString == last7DayExpected.toString)

    val last365Day: Option[Date] = DateTimeUtils.parseToDate("last_365_days")
    assert(last365Day.isDefined)
    val last365DayExpected: Date = new Date(System.currentTimeMillis() - 365L * 24 * 60 * 60 * 1000)
    assert(last365Day.get.toString == last365DayExpected.toString)

    val errorDay: Option[Date] = DateTimeUtils.parseToDate("error_day")
    assert(errorDay.isEmpty)
  }

  test("split date ranges (2021-07-01, 2021-07-11) window days = 3") {
    val startDate = Date.valueOf("2021-07-01")
    val endDate = Date.valueOf("2021-07-11")
    val dateRanges = DateTimeUtils.splitDateRanges(startDate, endDate, 3)
    assert(dateRanges.size == 4)
    assert(dateRanges(0).from.toString == "2021-07-01")
    assert(dateRanges(0).to.toString == "2021-07-04")
    assert(dateRanges(1).from.toString == "2021-07-04")
    assert(dateRanges(1).to.toString == "2021-07-07")
    assert(dateRanges(2).from.toString == "2021-07-07")
    assert(dateRanges(2).to.toString == "2021-07-10")
    assert(dateRanges(3).from.toString == "2021-07-10")
    assert(dateRanges(3).to.toString == "2021-07-11")
  }

  test("split date ranges (2021-07-01, 2021-07-11), window days = 4") {
    val startDate = Date.valueOf("2011-10-10")
    val endDate = Date.valueOf("2011-10-20")
    val dateRanges = DateTimeUtils.splitDateRanges(startDate, endDate, 4)
    assert(dateRanges.size == 3)
    assert(dateRanges(0).from.toString == "2011-10-10")
    assert(dateRanges(0).to.toString == "2011-10-14")
    assert(dateRanges(1).from.toString == "2011-10-14")
    assert(dateRanges(1).to.toString == "2011-10-18")
    assert(dateRanges(2).from.toString == "2011-10-18")
    assert(dateRanges(2).to.toString == "2011-10-20")
  }

  test("split date ranges (2011-10-10, 2011-10-12), window days = 1") {
    val startDate = Date.valueOf("2011-10-10")
    val endDate = Date.valueOf("2011-10-12")
    val dateRanges = DateTimeUtils.splitDateRanges(startDate, endDate, 1)
    assert(dateRanges.size == 2)
    assert(dateRanges(0).from.toString == "2011-10-10")
    assert(dateRanges(0).to.toString == "2011-10-11")
    assert(dateRanges(1).from.toString == "2011-10-11")
    assert(dateRanges(1).to.toString == "2011-10-12")
  }

  test("split date ranges (2011-10-10, 2011-09-12), window days = 1") {
    val startDate = Date.valueOf("2011-10-10")
    val endDate = Date.valueOf("2011-09-12")
    val dateRanges = DateTimeUtils.splitDateRanges(startDate, endDate, 1)
    assert(dateRanges.isEmpty)
  }

  test("split date range when start date = endDate") {
    val startDate = Date.valueOf("2011-10-10")
    val endDate = Date.valueOf("2011-10-10")
    val dateRanges = DateTimeUtils.splitDateRanges(startDate, endDate, 1)
    assert(dateRanges.isEmpty)
  }

  test("get next day") {
    val startDate = Date.valueOf("2011-10-10")
    val nextDay: Date = DateTimeUtils.getNextDay(startDate)
    assert(nextDay.toString == "2011-10-11")
  }

  test("is after 2011-10-10") {
    val startDate = Date.valueOf("2011-10-10")
    val endDate = Date.valueOf("2011-10-10")
    assert(startDate.after(endDate) == false)
    assert(startDate.before(endDate) == false)
    assert(startDate.equals(endDate) == true)
  }

    test("is after 2011-10-11") {
        val startDate = Date.valueOf("2011-10-11")
        val endDate = Date.valueOf("2011-10-10")
        assert(startDate.after(endDate) == true)
        assert(startDate.before(endDate) == false)
        assert(startDate.equals(endDate) == false)
    }
}
