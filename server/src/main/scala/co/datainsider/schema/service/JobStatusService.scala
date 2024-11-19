package co.datainsider.schema.service

import com.twitter.util.Future

/**
  * created 2023-12-12 5:15 PM
  *
  * @author tvc12 - Thien Vi
  */

trait JobStatusService {
  def isRunning(id: Long): Future[Boolean]

  def setRunning(id: Long, isRunning: Boolean): Future[Unit]

  def remove(id: Long): Future[Unit]

  def size(): Future[Int]
}
