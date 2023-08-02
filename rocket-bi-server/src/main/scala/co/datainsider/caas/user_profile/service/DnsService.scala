package co.datainsider.caas.user_profile.service

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.Future
import datainsider.client.exception.{BadRequestError, InternalError}
import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_profile.util.JsonParser
import scalaj.http.{Http, HttpResponse}

import scala.util.{Failure, Success, Try}

trait DnsService {
  def create(domain: String): Future[String]

  def get(domain: String): Future[Option[String]]

  def exists(domain: String): Future[Boolean]

  def edit(oldDomain: String, newDomain: String): Future[Boolean]

  def delete(domain: String): Future[Boolean]
}

/**
  * https://api.cloudflare.com/#dns-records-for-a-zone-create-dns-record
  */
class CloudflareDnsService extends DnsService {

  val host: String = ZConfig.getString("cloudflare.host")
  val zoneId: String = ZConfig.getString("cloudflare.zone_id")
  val apiKey: String = ZConfig.getString("cloudflare.api_key")

  val subDomainType: String = ZConfig.getString("cloudflare.sub_domain_config.type", "A")
  val content: String = ZConfig.getString("cloudflare.sub_domain_config.content")
  val ttl: Int = ZConfig.getInt("cloudflare.sub_domain_config.ttl", 1)
  val priority: Int = ZConfig.getInt("cloudflare.sub_domain_config.priority", 10)
  val proxied: Boolean = ZConfig.getBoolean("cloudflare.sub_domain_config.proxied", true)

  val path = s"$host/zones/$zoneId/dns_records"

  override def create(domain: String): Future[String] =
    Future {
      val postData =
        s"""
        |{
        |	"type": "$subDomainType",
        |	"name": "$domain",
        |	"content": "$content",
        |	"ttl": $ttl,
        |	"priority": $priority,
        |	"proxied": $proxied
        |}
        |""".stripMargin

      val r: HttpResponse[String] = Http(path)
        .postData(postData)
        .header("Content-Type", "application/json")
        .header("Authorization", apiKey)
        .asString

      Try(parseCloudflareResp(r)) match {
        case Failure(exception) => throw exception
        case Success(jsonResp)  => jsonResp.at("/result/name").textValue()
      }
    }

  override def get(domain: String): Future[Option[String]] =
    Future {
      val r = Http(path)
        .param("name", domain)
        .header("Content-Type", "application/json")
        .header("Authorization", apiKey)
        .asString

      Try(parseCloudflareResp(r)) match {
        case Failure(exception) => None
        case Success(jsonResp) =>
          if (jsonResp.get("result").size() != 0) {
            Some(jsonResp.get("result").get(0).get("id").textValue())
          } else None
      }
    }

  override def exists(domain: String): Future[Boolean] = {
    get(domain).map {
      case Some(value) => true
      case None        => false
    }
  }

  override def edit(oldDomainName: String, newDomainName: String): Future[Boolean] = {
    for {
      domainId <- get(oldDomainName)
      ok <- updateDomainName(domainId.get, newDomainName)
    } yield ok
  }

  override def delete(domainName: String): Future[Boolean] = {
    for {
      domainId <- get(domainName)
      ok <- deleteDomain(domainId.get)
    } yield ok
  }

  private def deleteDomain(domainId: String): Future[Boolean] =
    Future {
      val r = Http(s"$path/$domainId")
        .header("Content-Type", "application/json")
        .header("Authorization", apiKey)
        .asString

      Try(parseCloudflareResp(r)) match {
        case Failure(exception) => false
        case Success(value)     => true
      }
    }

  private def updateDomainName(domainId: String, newDomainName: String): Future[Boolean] =
    Future {
      val data =
        s"""
             |{
             |	"type": "$subDomainType",
             |	"name": "$newDomainName",
             |	"content": "$content",
             |	"ttl": $ttl,
             |	"priority": $priority,
             |	"proxied": $proxied
             |}
             |""".stripMargin

      val r = Http(s"url/$domainId")
        .method("PUT")
        .postData(data)
        .header("Content-Type", "application/json")
        .header("Authorization", apiKey)
        .asString

      Try(parseCloudflareResp(r)) match {
        case Failure(exception) => throw exception
        case Success(json)      => json.get("success").asBoolean()

      }
    }

  private def parseCloudflareResp(resp: HttpResponse[String]): JsonNode = {
    if (resp.code >= 200 && resp.code < 300) {
      val json = if (resp.body.nonEmpty) resp.body else "{}"
      JsonParser.fromJson[JsonNode](json)
    } else if (resp.code >= 400 && resp.code < 500) throw BadRequestError(s"cloudflare bad request error: $resp")
    else throw InternalError(s"cloudflare internal error: $resp")
  }

}
