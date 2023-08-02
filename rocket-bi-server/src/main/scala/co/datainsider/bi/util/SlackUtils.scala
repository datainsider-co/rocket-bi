package co.datainsider.bi.util

import com.twitter.inject.Logging
import datainsider.client.util.HttpClient
import org.apache.commons.lang.StringEscapeUtils.escapeJava

object SlackUtils extends Logging {
  private val slackWebhookUrl = ZConfig.getString("slack_notification.webhook_url")

  def send(message: String): Unit = {
    try {
      val postBody =
        s"""
           |{
           |  "text": "${escapeJava(message)}"
           |}
           |""".stripMargin

      val resp = HttpClient.post(slackWebhookUrl, postBody)

      if (!resp.isSuccess) {
        throw new InternalError(s"sendMessage fail with response: $resp")
      }
    } catch {
      case e: Throwable => logger.error(s"send slack message failed with message: ${e.getMessage}", e)
    }
  }
}
