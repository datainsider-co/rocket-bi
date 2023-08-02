package co.datainsider.jobworker.client.shopee

import co.datainsider.jobworker.util.HashUtils
import com.twitter.util.logging.Logging

object ShopeeClientUtils extends Logging {

  def hashSHA256(
      partnerKey: String,
      partnerId: String,
      path: String,
      timestamp: Long,
      accessToken: Option[String],
      shopId: Option[String]
  ): String = {
    val baseString = String.format(
      "%s%s%s%s%s",
      partnerId,
      path,
      String.valueOf(timestamp),
      accessToken.getOrElse(""),
      shopId.getOrElse("")
    )
    HashUtils.hashSHA256(partnerKey, baseString)
  }
}
