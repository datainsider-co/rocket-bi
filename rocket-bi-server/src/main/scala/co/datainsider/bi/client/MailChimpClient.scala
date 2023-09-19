package co.datainsider.bi.client

import co.datainsider.bi.util.{Serializer, StringUtils, ZConfig}
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.exception.InternalError
import scalaj.http.{Http, HttpResponse}

object MailChimpClient {
  private val dc: String = ZConfig.getString("mailchimp.dc")
  private val apiKey: String = ZConfig.getString("mailchimp.api_key")
  private val listId: String = ZConfig.getString("mailchimp.list_id")

  def apply(): MailChimpClient = new MailChimpClient(dc, apiKey, listId)
}

class MailChimpClient(dc: String, apiKey: String, listId: String) {
  private val baseUrl = s"https://$dc.api.mailchimp.com/3.0"

  def ping(): String = {
    val resp: HttpResponse[String] =
      Http(s"$baseUrl/ping").method("GET").auth("key", apiKey).asString

    extract[String](resp)(resp => resp)
  }

  def addMember(email: String, firstName: String, lastName: String): Boolean = {
    val memberData =
      s"""
        |{
        |  "email_address": "$email",
        |  "status": "subscribed",
        |  "merge_fields": {
        |    "FNAME": "$firstName",
        |    "LNAME": "$lastName"
        |  }
        |}
        |""".stripMargin

    val resp: HttpResponse[String] =
      Http(s"$baseUrl/lists/$listId/members/${StringUtils.md5(email)}")
        .method("PUT")
        .auth("key", apiKey)
        .put(memberData)
        .asString

    extract[Boolean](resp)(resp => {
      val jsonNode = Serializer.fromJson[JsonNode](resp)
      jsonNode.get("id").asText() != null
    })
  }

  private def extract[T](resp: HttpResponse[String])(converter: String => T): T = {
    if (resp.isSuccess) {
      converter(resp.body)
    } else throw InternalError(s"call to MailChimp fail with code: ${resp.code}, message: ${resp.body}")
  }
}
