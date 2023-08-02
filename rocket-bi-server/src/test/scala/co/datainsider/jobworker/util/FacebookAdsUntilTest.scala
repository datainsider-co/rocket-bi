package co.datainsider.jobworker.util

import co.datainsider.jobworker.domain.job.FacebookAdsTimeRange
import com.twitter.inject.Test

class FacebookAdsUntilTest extends Test {

  test("break down time range to days") {
    val facebookAdsTimeRange = FacebookAdsTimeRange("2019-12-13", "2020-02-01")
    val days = FacebookAdsTimeRange.split(facebookAdsTimeRange, 1)
    assert(days.length == 51)
  }

  test("break down time range to week") {
    val facebookAdsTimeRange = FacebookAdsTimeRange("2019-12-13", "2020-01-01")
    val days = FacebookAdsTimeRange.split(facebookAdsTimeRange, 7)
    assert(days.length == 3)
  }

  test("test break dow when since after until") {
    val facebookAdsTimeRange = FacebookAdsTimeRange("2019-12-13", "2019-11-13")
    val days = FacebookAdsTimeRange.split(facebookAdsTimeRange, 7)
    assert(days.isEmpty)
  }

}
