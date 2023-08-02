package co.datainsider.jobworker.util

import com.twitter.util.logging.Logging
import datainsider.client.exception.InternalError

import java.math.BigInteger
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
  * created 2023-04-12 3:21 PM
  * @author tvc12 - Thien Vi
  */
object HashUtils extends Logging {
  /**
   * Hash text by SHA256 algorithm with secret key provided.
   * Hash function use to sign request base oauth standard like shopee, lazada,... etc.
   */
  @throws[InternalError]("when hash text failed")
  def hashSHA256(secretKey: String, text: String): String = {
    try {
      val textAsBytes: Array[Byte] = text.getBytes("UTF-8")
      val keyAsBytes: Array[Byte] = secretKey.getBytes("UTF-8")
      val mac: Mac = Mac.getInstance("HmacSHA256")
      val secretKeySpec = new SecretKeySpec(keyAsBytes, "HmacSHA256")
      mac.init(secretKeySpec)
      val hashedText = String.format("%064x", new BigInteger(1, mac.doFinal(textAsBytes)))
      hashedText
    } catch {
      case ex: Throwable => {
        logger.error(s"Cannot hash text ${text}", ex)
        throw InternalError(s"Cannot hash text ${text}, cause ${ex.getMessage}", ex)
      }
    }
  }
}
