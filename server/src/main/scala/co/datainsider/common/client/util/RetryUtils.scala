package co.datainsider.common.client.util

import com.twitter.finagle.util.DefaultTimer.Implicit
import com.twitter.util.{Duration, Future}

import scala.util.Random

/**
  * created 2023-12-13 10:54 AM
  *
  * @author tvc12 - Thien Vi
  */
object RetryUtils {
  @scala.annotation.tailrec
  def retry[T](n: Int)(fn: => T): T = {
    try {
      fn
    } catch {
      case e: Throwable =>
        if (n > 1) retry(n - 1)(fn)
        else throw e
    }
  }

  @scala.annotation.tailrec
  def retry[T](n: Int, delay: Long)(fn: => T): T = {
    try {
      fn
    } catch {
      case e: Throwable =>
        if (n > 1) {
          Thread.sleep(delay)
          retry(n - 1, delay)(fn)
        } else throw e
    }
  }

  def retryFuture[T](n: Int)(fn: => Future[T]): Future[T] = {
    fn.rescue {
      case e: Throwable if (n > 1) => retryFuture(n - 1)(fn)
      case e: Throwable            => Future.exception(e)
    }
  }

  def retryFuture[T](n: Int, delayMs: Long)(fn: => Future[T]): Future[T] = {
    fn.rescue {
      case e: Throwable if (n > 1) =>
        Future.sleep(Duration.fromMilliseconds(delayMs)).before(retryFuture(n - 1, delayMs)(fn))
      case e: Throwable => Future.exception(e)
    }
  }

}
