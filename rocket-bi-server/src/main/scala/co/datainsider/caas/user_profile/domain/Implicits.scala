package co.datainsider.caas.user_profile.domain

import com.twitter.util.{Await, Future, FuturePool, Promise => TwitterPromise}
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.domain.user.{User, UserInfo}
import datainsider.client.exception.NotFoundError

import scala.concurrent.{ExecutionContext, Future => ScalaFuture}
import scala.util.{Failure, Success}

/**
  * @author anhlt
  */
object Implicits {
  implicit val futurePool = FuturePool.unboundedPool

  def using[A <: AutoCloseable, B](a: A)(fn: A => B): B = {
    try {
      fn(a)
    } finally {
      if (a != null) {
        a.close()
      }
    }
  }

  implicit def async[A](fn: => A): Future[A] =
    futurePool {
      fn
    }

  implicit class FutureEnhanceLike[T](val fn: Future[T]) extends AnyVal {
    def syncGet(): T = Await.result(fn)
  }

  implicit class FutureOptionEnhanceLike[T](val fn: Future[Option[T]]) extends AnyVal {
    def notNullOrEmpty: Future[T] = {
      fn.flatMap({
        case Some(x) => Future.value(x)
        case None    => Future.exception(NotFoundError("Resource is not found."))
      })
    }

    def notNullOrEmpty(msg: String): Future[T] = {
      fn.flatMap({
        case Some(x) => Future.value(x)
        case None    => Future.exception(NotFoundError(msg))
      })
    }
  }

  implicit def val2Opt[A](value: A): Option[A] = Option(value)

  implicit def opt2Val[A](value: Option[A]): A = value.get

  implicit def Option2String(v: Option[String]): String = {
    v.getOrElse("")
  }

  implicit class ScalaFutureLike[A](val scalaFn: ScalaFuture[A]) extends AnyVal {
    def asTwitter(implicit e: ExecutionContext): Future[A] = {
      val promise: TwitterPromise[A] = new TwitterPromise[A]()
      scalaFn.onComplete {
        case Success(value)     => promise.setValue(value)
        case Failure(exception) => promise.setException(exception)
      }
      promise
    }
  }

  implicit class OptionString(val s: Option[String]) extends AnyVal {
    def notEmptyOrNull: Option[String] = s.flatMap(x => if (x != null && x.trim.nonEmpty) Some(x.trim) else None)
  }

}
