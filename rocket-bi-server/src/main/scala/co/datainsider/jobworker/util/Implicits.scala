package co.datainsider.jobworker.util

import com.twitter.util.{Await, Future, FuturePool, Promise, Return, Throw}

import scala.concurrent.{ExecutionContext, Future => ScalaFuture, Promise => ScalaPromise}
import scala.util.{Failure, Success}

/**
  * @author anhlt
  */
object Implicits {


  implicit val futurePool = FuturePool.unboundedPool

  implicit def async[A](f: => A): Future[A] = futurePool{ f }

  def using[A <: AutoCloseable, B](a: A)(fn: A => B): B = {
    try {
      fn(a)
    } finally {
      if (a != null) {
        a.close()
      }
    }
  }

  implicit class FutureEnhance[T](f: Future[T]) {
    def sync(): T = Await.result(f)
  }

  implicit def value2Opt[A](f: A): Option[A] = Option(f)

  implicit def opt2Value[A](f: Option[A]): A = f.get



  implicit class ImplicitOptString(value: Option[String]) {
    def ignoreEmpty: Option[String] = value.filter(_.nonEmpty)
  }

  implicit class ImplicitBoolean(value: Option[Boolean]) {
    def orFalse: Boolean = value.getOrElse(false)

    def orTrue: Boolean = value.getOrElse(true)
  }

  implicit class ImplicitList[T](value: Seq[T]) {
    def itemIsDuplicated: Boolean = value.distinct.size != value.size

    def itemDuplicated: Seq[T] = {
      value.groupBy(f => f).collect {
        case (x, ys) if ys.size > 1 => x
      }.toSeq
    }

    def opt: Option[Seq[T]] = Option(value) match {
      case Some(x) if x.isEmpty => None
      case x => x
    }
  }

  implicit class ImplicitCollection[A](value: Stream[A]) {
    def convertToSeq: Seq[A] = {
      val seq = scala.collection.mutable.ListBuffer.empty[A]
      val it = value.iterator
      while (it.hasNext) seq += it.next()
      seq
    }
  }

  /** Convert from a Scala Future to a Twitter Future */
  implicit class RichScalaFuture[A](val sf: ScalaFuture[A]) extends AnyVal {
    def asTwitterFuture(implicit e: ExecutionContext): Future[A] = {
      val promise: Promise[A] = new Promise[A]()
      sf.onComplete {
        case Success(value)     => promise.setValue(value)
        case Failure(exception) => promise.setException(exception)
      }
      promise
    }
  }

  /** Convert from a Twitter Future to a Scala Future */
  implicit class RichTwitterFuture[A](val tf: Future[A]) extends AnyVal {
    def asScalaFuture: ScalaFuture[A] = {
      val promise: ScalaPromise[A] = ScalaPromise()
      tf.respond {
        case Return(value)    => promise.success(value)
        case Throw(exception) => promise.failure(exception)
      }
      promise.future
    }
  }
}
