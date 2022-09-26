package datainsider.analytics.misc.report

import datainsider.analytics.domain.JobInfo

import java.sql.ResultSet

trait Report {
  def run(jobInfo: JobInfo): Boolean
}

object Report {
  def collectActiveMetric(rs: ResultSet): (Long, Long) = {
    if (rs.next()) {
      val unique = rs.getLong(1)
      val total = rs.getLong(2)
      (unique, total)
    } else {
      (0, 0L)
    }
  }
}
