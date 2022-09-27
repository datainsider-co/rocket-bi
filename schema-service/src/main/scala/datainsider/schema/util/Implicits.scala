package datainsider.schema.util

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Request
import com.twitter.util.{Await, Future, FuturePool, Promise => TwitterPromise}
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.exception.{BadRequestError, InternalError}
import datainsider.client.util.JsonParser
import org.apache.commons.text

import scala.concurrent.{ExecutionContext, Future => ScalaFuture}
import scala.util.{Failure, Success}

/**
  * @author anhlt
  */
object ImplicitsFunc {
  implicit def mustSuccess(status: Boolean, msgError: String): Unit = {
    if (!status) {
      throw InternalError(msgError)
    }
  }
}

object Implicits {

  implicit val futurePool: FuturePool = FuturePool.unboundedPool

//  implicit def futurePool(poolSize: Int): FuturePool = FuturePool(Executors.newFixedThreadPool(poolSize))

  implicit def async[A](f: => A): Future[A] = futurePool { f }

  implicit class FutureEnhance[T](val fn: Future[T]) extends AnyVal {
    def syncGet(): T = Await.result(fn)
  }

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
  }

  implicit class ScalaFutureLike[A](val sf: ScalaFuture[A]) extends AnyVal {
    def asTwitter(implicit e: ExecutionContext): Future[A] = {
      val promise: TwitterPromise[A] = new TwitterPromise[A]()
      sf.onComplete {
        case Success(value)     => promise.setValue(value)
        case Failure(exception) => promise.setException(exception)
      }
      promise
    }
  }

  implicit class ImplicitString(val value: String) extends AnyVal {

    def asEventName = {
      value.trim
        .replaceAll("\\n", "_")
        .replaceAll("\\r", "_")
        .replaceAll("\\s+", "_")
        .replaceAll("_+", "_")
        .toLowerCase()
    }

    def escape = {
      s"`${value.trim}`"
    }

    def unescape: String = {
      value.trim.replaceAll("^`(.*)`$", "$1")
    }

    def toSnakeCase: String = {
      value
        .trim()
        .toLowerCase()
        .replaceAll("[^A-Za-z0-9]", "_")
        .replaceAll("-+", "_")
        .replaceAll("\\n", "_")
        .replaceAll("\\r", "_")
        .replaceAll("\\s+", "_")
        .replaceAll("_+", "_")
    }

    def asPrettyDisplayName = {
      value
        .replaceAll("_+", " ")
        .replaceAll("\\s+", " ")
        .capitalizeFully
    }

    def capitalizeFully = {
      text.WordUtils.capitalizeFully(value)
    }
  }

  implicit class ImplicitOptString(val value: Option[String]) extends AnyVal {
    def ignoreEmpty: Option[String] = value.filter(_.nonEmpty)
  }

  implicit class ImplicitOptBoolean(val value: Option[Boolean]) extends AnyVal {
    def orFalse: Boolean = value.getOrElse(false)

    def orTrue: Boolean = value.getOrElse(true)
  }

  implicit class ImplicitJsonNode(val jsonNode: JsonNode) extends AnyVal {

    def atOpt(jsonPtrExpr: String): Option[JsonNode] = {
      jsonNode.at(jsonPtrExpr) match {
        case x if x.isMissingNode || x.size() == 0 => None
        case x                                     => Option(x)
      }
    }

    def isNullOrMissing: Boolean = {
      jsonNode == null || jsonNode.isNull || jsonNode.isMissingNode
    }

    def getString(field: String) = jsonNode.path(field).asText()

    def optString(field: String) = opt(field).map(_.asText())

    def getInt(field: String) = jsonNode.path(field).asInt()

    def optInt(field: String) = opt(field).map(_.asInt())

    def getLong(field: String) = jsonNode.path(field).asLong()

    def getBoolean(field: String) = jsonNode.path(field).asBoolean()

    def optBoolean(field: String) = opt(field).map(_.asBoolean())

    def opt(fieldName: String): Option[JsonNode] = {
      Option(jsonNode.path(fieldName)) match {
        case Some(x) if x.isNullOrEmpty => None
        case Some(x)                    => Some(x)
        case _                          => None
      }
    }

    def isNullOrEmpty: Boolean = {
      jsonNode == null || jsonNode.isNull || jsonNode.isMissingNode ||
      (jsonNode.isContainerNode && jsonNode.size() == 0) ||
      (jsonNode.isTextual && jsonNode.asText.isEmpty)
    }

    def isEmptyTextOrObject: Boolean = isEmptyText || isEmptyObject

    def isEmptyObject: Boolean = jsonNode.isObject && jsonNode.size() == 0

    def isEmptyText: Boolean = jsonNode.isTextual && jsonNode.asText().isEmpty

    def isEmptyNode: Boolean = isEmptyText || isEmptyContainer

    def isEmptyContainer: Boolean =
      jsonNode.isContainerNode && jsonNode.size() == 0

  }

  implicit class ImplicitAny(val value: Any) extends AnyVal {
    def toJson(pretty: Boolean = false) = JsonParser.toJson(value, pretty)

    def asOptInt: Option[Int] = value.asOptAny.map(_.asInstanceOf[Int])

    def asOptLong: Option[Long] = value.asOptAny.map(_.asInstanceOf[Long])

    def asOptAny: Option[Any] =
      value match {
        case s: Option[_] => s
        case _            => Option(value)
      }

    def asOptString: Option[String] = value.asOptAny.map(_.asInstanceOf[String])

    def asOptDouble: Option[Double] = value.asOptAny.map(_.asInstanceOf[Double])

    def asOptFloat: Option[Float] = value.asOptAny.map(_.asInstanceOf[Float])

    def asOptBoolean: Option[Boolean] =
      value.asOptAny.map(_.asInstanceOf[Boolean])

    def asOptShort: Option[Short] = value.asOptAny.map(_.asInstanceOf[Short])

    def orEmpty: String =
      value match {
        case Some(x) => x.toString
        case _       => value.toString
      }

    def toMapAny: Map[String, Any] = {

      JsonParser.fromJson[Map[String, Any]](JsonParser.toJson(value, false))
    }

  }

  /** Convert from a Scala Future to a Twitter Future */
  implicit class RichScalaFuture[A](val sf: ScalaFuture[A]) extends AnyVal {
    def asTwitterFuture(implicit e: ExecutionContext): Future[A] = {
      val promise: TwitterPromise[A] = new TwitterPromise[A]()
      sf.onComplete {
        case Success(value)     => promise.setValue(value)
        case Failure(exception) => promise.setException(exception)
      }
      promise
    }
  }

  implicit class ActionListEnhanceImplicits(val actions: Seq[String]) extends AnyVal {
    def toPermissions(organizationId: Long, resourceType: String, resourceId: String): Seq[String] = {
      actions.map(action =>
        PermissionProviders.permissionBuilder.perm(organizationId, resourceType, action, resourceId)
      )
    }
  }
}
