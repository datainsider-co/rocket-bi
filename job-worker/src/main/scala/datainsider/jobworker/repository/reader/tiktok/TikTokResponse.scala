package datainsider.jobworker.repository.reader.tiktok

import com.fasterxml.jackson.databind.JsonNode

import scala.util.Try

case class TikTokResponse[T](code: Int, message: String, requestId: String, data: T) {
  def isSuccess(): Boolean = code == 0
  def isError(): Boolean = !isSuccess()
}

case class TikTokAdsData(list: Array[JsonNode], pageInfo: TikTokPageInfo) {
  def isValidData(): Boolean = list != null && pageInfo.isValidPageInfo()
}

case class TikTokTokenInfo(advertiserIds: Array[String], scope: Seq[Int], accessToken: String)

case class TikTokAdvertiserData(list: Array[AdvertiserInfo])

case class AdvertiserInfo(advertiserId: String, advertiserName: String)

case class TikTokPageInfo(totalPage: Int, page: Int, pageSize: Int, totalNumber: Int) {
  def hasNextPage: Boolean = page < totalPage
  def isValidPageInfo(): Boolean = page > -1 && totalPage > -1 && pageSize > 0 && totalNumber > -1
}
