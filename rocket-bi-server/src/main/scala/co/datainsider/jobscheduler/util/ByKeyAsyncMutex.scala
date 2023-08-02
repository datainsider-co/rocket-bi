package co.datainsider.jobscheduler.util

import com.twitter.concurrent.{AsyncMutex, Permit}
import com.twitter.util.Future

import scala.util.control.NonFatal

/**
  * Inspired by `AsyncMutex` from Twitter Future util.
  *
  * @author andy
  */
case class ByKeyAsyncMutex(maxConcurrent: Int = 16) {

  require(maxConcurrent >= 1, s"maxConcurrent must be >= 1: $maxConcurrent")
  private[this] val mutexPool: Array[AsyncMutex] = Array.range(0, maxConcurrent).map(_ => new AsyncMutex())

  def acquire(key: String): Future[Permit] = {
    val idx = math.abs(key.hashCode) % mutexPool.size
    mutexPool(idx).acquire()
  }

  def acquireAndRun[T](key: String)(func: => Future[T]): Future[T] =
    acquire(key).flatMap { permit =>
      val f =
        try func
        catch {
          case NonFatal(e) =>
            Future.exception(e)
          case e: Throwable =>
            permit.release()
            throw e
        }
      f.ensure {
        permit.release()
      }
    }

  def acquireAndRunSync[T](key: String)(func: => T): Future[T] =
    acquire(key).flatMap { permit =>
      Future(func).ensure {
        permit.release()
      }
    }
}
