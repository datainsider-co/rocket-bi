package datainsider.analytics.service

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import datainsider.client.domain.Page
import datainsider.ingestion.util.Implicits.FutureEnhance
import datainsider.ingestion.util.TimeUtils
import education.x.commons.SsdbSortedSet

import java.util.concurrent.Executors
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.DurationInt

@deprecated("no longer used")
trait BaseScheduleQueue {
  def getSchedules(from: Int, size: Int): Future[Page[Map[String, Any]]]

  def enqueue(id: String, time: Long): Unit

  def peek(): Option[(String, Long)]

  def start(): Unit

  def stop(): Unit
}

@deprecated("no longer used")
case class TimeBasedScheduleQueue(
    queue: SsdbSortedSet,
    trigger: OnScheduledTrigger
) extends BaseScheduleQueue
    with Logging {
  private val sync = new Object()

  private val executor = Executors.newFixedThreadPool(1)

  override def enqueue(id: String, time: Long): Unit = {
    sync.synchronized {
      queue.add(id, time).asTwitter.syncGet()
      sync.notifyAll()
    }
  }

  override def peek(): Option[(String, Long)] = {
    sync.synchronized {
      queue.range(0, 1).asTwitter.syncGet().getOrElse(Array.empty).headOption
    }
  }

  override def getSchedules(from: Int, size: Int): Future[Page[Map[String, Any]]] = {
    for {
      total <- queue.size().asTwitter.map(_.getOrElse(0))
      data <- queue.range(from, size).asTwitter.map(_.getOrElse(Array.empty))
      schedules = data.map {
        case (id, time) =>
          val deltaDuration = time - System.currentTimeMillis()
          Map(
            "id" -> id,
            "run_at" -> time,
            "run_after" -> deltaDuration,
            "run_after_as_str" -> TimeUtils.prettyTime(deltaDuration)
          )
      }

    } yield {
      Page(total, schedules)
    }

  }

  override def start(): Unit = {
    executor.submit(new Runnable {
      override def run(): Unit = {
        while (true) {
          onProcess()
        }
      }
    })
  }

  override def stop(): Unit = {
    executor.shutdown()
  }

  private def onProcess(): Unit = {
    sync.synchronized {
      try {
        peek() match {
          case Some((id, checkpointTime)) =>
            val deltaDuration = checkpointTime - System.currentTimeMillis()
            if (deltaDuration <= 0) {
              trigger.onScheduled(id, checkpointTime)
              queue.remove(id).asTwitter.syncGet()
            } else {
              info(s"onProcess: waiting in ${TimeUtils.prettyTime(deltaDuration)} for $id")
              sync.wait(deltaDuration)
            }
          case _ => sync.wait()
        }
      } catch {
        case ex =>
          error("trigger", ex)
          sync.wait(5.seconds.toMillis)
      }
    }
  }

}
