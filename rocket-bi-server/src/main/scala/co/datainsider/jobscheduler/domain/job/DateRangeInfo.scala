package co.datainsider.jobscheduler.domain.job

import co.datainsider.bi.util.Implicits.RichOption
import co.datainsider.jobworker.util.DateTimeUtils
import com.fasterxml.jackson.annotation.JsonIgnore
import com.twitter.finatra.validation.constraints.Pattern

import java.sql.Date

/**
  * created 2023-09-05 5:31 PM
  *
  * @author tvc12 - Thien Vi
  */
case class DateRangeInfo(
    // yyyy-MM-dd, yesterday, last_n_days, today
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}|yesterday|last_\\d+_days|today")
    fromDate: String,
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}|yesterday|last_\\d+_days|today")
    toDate: String
) {

  @JsonIgnore
  def calculateFromDate(): Date =
    DateTimeUtils.parseToDate(fromDate).getOrElseThrow(new IllegalArgumentException(s"invalid date format $fromDate"))
  @JsonIgnore
  def calculateToDate(): Date =
    DateTimeUtils.parseToDate(toDate).getOrElseThrow(new IllegalArgumentException(s"invalid date format $toDate"))
}
