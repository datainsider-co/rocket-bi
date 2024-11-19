package co.datainsider.common.client.util

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Request
import com.twitter.util.{Await, Future}
import co.datainsider.common.client.domain.Implicits.VALUE_NULL
import co.datainsider.common.client.exception.BadRequestError
import org.apache.commons.text.WordUtils

object Implicits {


  implicit class ImplicitRequestLike(val request: Request) extends AnyVal {

    def getQueryOrBodyParam(paramName: String): String = {
      val fromQueryFn = (request: Request) => {
        Some(request.getParam(paramName))
          .filterNot(_ == null)
          .filterNot(_.isEmpty)
      }
      val fromBodyFn = (request: Request) => {
        try {
          Option(
            JsonParser
              .fromJson[JsonNode](request.contentString)
              .get(paramName)
              .asText(null)
          ).filterNot(_ == null)
            .filterNot(_.isEmpty)
        } catch {
          case _ => None
        }
      }

      val value = Seq(fromQueryFn, fromBodyFn)
        .foldLeft[Option[String]](None)((result, fn) =>
          result match {
            case None => fn(request)
            case _    => result
          }
        )

      value match {
        case Some(value) => value
        case _           => throw BadRequestError(s"the field `$paramName` is missing or empty.")
      }
    }

    def getFromHeader(name: String): Option[String] = {
      request.headerMap.get(name)
    }

    def getFromQuery(name: String): Option[String] = {
      Some(request.getParam(name))
        .filterNot(_ == null)
        .filterNot(_.isEmpty)
    }
  }

  implicit class ImplicitString(val value: String) extends AnyVal {

    def asEventName = {
      value.trim.replaceAll("\\s+", "_").toLowerCase()
    }

    def asColumnName: String = {
      value
        .trim()
        .toLowerCase()
        .replaceAll("\\n", "_")
        .replaceAll("\\r", "_")
        .replaceAll("\\s+", "_")
        .replaceAll("_+", "_")
    }

    def asPrettyDisplayName = {
      WordUtils.capitalizeFully(
        value
          .replaceAll("_+", " ")
          .replaceAll("\\s+", " ")
      )
    }

    def isNull: Boolean = {
      value == null || value == VALUE_NULL
    }

  }


}
