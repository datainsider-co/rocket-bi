package co.datainsider.bi.util

import co.datainsider.bi.domain.chart.TableColumn
import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.domain.query.{Function, Select}
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.{Await, FuturePool, Return, Throw, Future => TwitterFuture, Promise => TwitterPromise}
import datainsider.authorization.domain.PermissionProviders
import co.datainsider.schema.domain.column.{Column, NestedColumn}
import datainsider.client.exception.{InternalError, UnAuthorizedError}
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import org.apache.commons.text.WordUtils

import scala.concurrent.{ExecutionContext, Future => ScalaFuture, Promise => ScalaPromise}
import scala.util.{Failure, Success}

object Implicits {

  val NULL_VALUE = "null"

  implicit val futurePool: FuturePool = FuturePool.unboundedPool

  implicit def async[A](f: => A): TwitterFuture[A] = futurePool { f }

  implicit class FutureEnhance[T](val fn: TwitterFuture[T]) extends AnyVal {
    def syncGet(): T = Await.result(fn)
  }

  /** Convert from a Twitter Future to a Scala Future */
  implicit class RichTwitterFuture[A](val tf: TwitterFuture[A]) extends AnyVal {
    def asScalaFuture: ScalaFuture[A] = {
      val promise: ScalaPromise[A] = ScalaPromise()
      tf.respond {
        case Return(value)    => promise.success(value)
        case Throw(exception) => promise.failure(exception)
      }
      promise.future
    }
  }

  /** Convert from a Scala Future to a Twitter Future */
  implicit class RichScalaFuture[A](val sf: ScalaFuture[A]) extends AnyVal {
    def asTwitterFuture(implicit e: ExecutionContext): TwitterFuture[A] = {
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

    def escape: String = {
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
      WordUtils.capitalizeFully(
        value
          .replaceAll("_+", " ")
          .replaceAll("\\s+", " ")
      )
    }

    def isNull: Boolean = {
      value == null || value == NULL_VALUE
    }

  }

  implicit class ImplicitObject(val value: Object) extends AnyVal {
    def asString: String = {
      if (value != null) {
        value.toString
      } else NULL_VALUE
    }
  }

  implicit class RichOptionSeq[T](val seq: Option[Seq[T]]) extends AnyVal {

    def notNullOrEmpty: Option[Seq[T]] = {
      seq
        .filterNot(_ == null)
        .flatMap(x => if (x.isEmpty) None else Option(x))
    }
  }

  implicit class RichOption[T](val value: Option[T]) extends AnyVal {

    /**
      * method getOrElseThrow is used to throw exception when value is None
      * @param ex: Exception which will be thrown when value is None
      * @return value if it is not None
      */
    def getOrElseThrow(ex: Throwable): T = {
      value match {
        case Some(v) => v
        case None    => throw ex
      }
    }
  }

  implicit class ImplicitLoggedInRequest(val request: LoggedInRequest) extends AnyVal {
    def getOrganizationId: Long = {
      request.currentOrganizationId match {
        case Some(value) => value
        case None        => throw UnAuthorizedError("Not found organization id")
      }
    }
  }
}

object SchemaImplicits {

  implicit class JsonLike(val node: JsonNode) extends AnyVal {
    def getText(key: String, defaultValue: String): String = {
      val v = node.at(s"/$key").asText(null)
      Option(v).filterNot(_ == null).getOrElse(defaultValue)
    }

    def getValueAsText(key: String): Option[String] = {
      val v = node.at(s"/$key").asText(null)
      Option(v).filterNot(_ == null)
    }
  }

  implicit class ColumnListEnhanceImplicits(val columns: Seq[Column]) extends AnyVal {

    def toSelectFunctions(dbName: String, tblName: String): Array[Function] = {
      columns.map {
        case column =>
          val field = TableField(dbName, tblName, column.name, Column.getCustomClassName(column))
          Select(field)
      }.toArray
    }

    def toSelectTableColumns(dbName: String, tblName: String): Array[TableColumn] = {
      columns.map {
        case column =>
          val field = TableField(dbName, tblName, column.name, Column.getCustomClassName(column))
          val func = Select(field)
          TableColumn(column.name, func)
      }.toArray
    }

    /**
      * TODO: Handle extra columns from profile. Ignore it for now
      * @return
      */
    def toFlattenColumns(): Seq[Column] = {
      columns.flatMap {
        case column: NestedColumn => Seq.empty
        case column               => Seq(column)
      }
    }
  }

  implicit class ActionListEnhanceImplicits(val actions: Seq[String]) extends AnyVal {
    def toPermissions(organization: Long, resourceType: String, resourceId: String): Seq[String] = {
      actions.map(action => PermissionProviders.permissionBuilder.perm(organization, resourceType, action, resourceId))
    }
  }
}
