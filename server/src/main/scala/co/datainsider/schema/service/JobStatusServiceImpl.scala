package co.datainsider.schema.service

import co.datainsider.bi.util.Implicits.RichScalaFuture
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import education.x.commons.KVS

import scala.concurrent.ExecutionContext.Implicits.global

class JobStatusServiceImpl(db: KVS[Long, Boolean]) extends JobStatusService with Logging {
  def isRunning(syncId: Long): Future[Boolean] = {
    db.get(syncId).asTwitterFuture.map(_.getOrElse(false))
  }

  def setRunning(syncId: Long, isRunning: Boolean): Future[Unit] = {
    db.add(syncId, isRunning).asTwitterFuture.unit
  }

  def remove(syncId: Long): Future[Unit] = {
    db.remove(syncId).asTwitterFuture.unit.rescue {
      case ex: Throwable =>
        logger.error(s"remove syncId: $syncId failure, cause: ${ex.getMessage}", ex)
        Future.Unit
    }
  }

  def size(): Future[Int] = {
    db.size().map(_.getOrElse(0)).asTwitterFuture
  }
}
