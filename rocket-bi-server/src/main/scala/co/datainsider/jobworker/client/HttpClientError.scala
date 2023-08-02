package co.datainsider.jobworker.client

import com.twitter.finagle.http.Status
import datainsider.client.exception.DIException

/**
 * created 2023-07-11 3:27 PM
 *
 * @author tvc12 - Thien Vi
 */
 case class HttpClientError(message: String, statusCode: Int, body: String, cause: Throwable = null) extends DIException(message, cause) {
  override val reason: String = "http_client_error"

  override def getStatus: Status = Status(statusCode)
}
