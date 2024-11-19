package co.datainsider.bi.utils

import co.datainsider.bi.util.{DayNumFormatter, MonthNumFormatter, WeekNumFormatter}
import org.scalatest.FunSuite

class FormatterTest extends FunSuite {

  test("format-deformat MonthNumFormatter") {
    for (monthNum <- 1 until 100000) {
      val monthStr = MonthNumFormatter.format(monthNum.asInstanceOf[Object])
      val deformattedMonthNum = MonthNumFormatter.deformat(monthStr)
      assert(monthNum == deformattedMonthNum.toString.toInt)
    }
  }

  test("format-deformat WeekNumFormatter") {
    for (weekNum <- 0 until 100000) {
      val weekStr: Object = WeekNumFormatter.format(weekNum.asInstanceOf[Object])
      val deformattedWeekNum = WeekNumFormatter.deformat(weekStr)
      assert(deformattedWeekNum.toString.toInt == weekNum)
    }
  }

  test("format-deformat DayNumFormatter") {
    for (dateNum <- 0 until 100000) {
      val dateStr: Object = DayNumFormatter.format(dateNum.asInstanceOf[Object])
      val deformattedDateNum = DayNumFormatter.deformat(dateStr)
      assert(dateNum == deformattedDateNum.toString.toInt)
    }
  }

}
