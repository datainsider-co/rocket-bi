package co.datainsider.jobworker.util

import co.datainsider.jobworker.repository.reader.tiktok.TikTokTimeRange
import com.twitter.inject.Test

class TikTokUtilsTest extends Test {
  test("test get tiktok time range ") {
    val timeRanges = TikTokTimeRange.getTimeRanges(Some("2022-10-01"))
    assert(timeRanges.nonEmpty)
    assert(timeRanges.head.start.equals("2022-10-01"))
  }

  test("test get next time"){
    val nextDateTime= TikTokTimeRange.getNextDate("2020-12-11")
    assert(nextDateTime.equals("2020-12-12"))
  }

  test("test get tiktok time range when last day is empty") {
    val timeRanges = TikTokTimeRange.getTimeRanges(None)
    assert(timeRanges.nonEmpty)
    assert(timeRanges.length <= 13)
  }

}
