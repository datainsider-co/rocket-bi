package datainsider.analytics.service.actors

import akka.actor.{Actor, Cancellable}
import com.twitter.inject.Logging
import datainsider.analytics.service.actors.ResetEventIdGeneratorActor.ResetEventIdGeneratorEvent
import datainsider.analytics.service.generator.EventIdGeneratorFactory
import datainsider.ingestion.util.Implicits._
import datainsider.ingestion.util.TimeUtils
import org.apache.commons.lang3.time.StopWatch

@deprecated("no longer used")
object ResetEventIdGeneratorActor {

  case class ResetEventIdGeneratorEvent(beginOfDayInMillis: Long)
}

@deprecated("no longer used")
case class ResetEventIdGeneratorActor(idGeneratorFactory: EventIdGeneratorFactory) extends Actor with Logging {
  import context._

  private var resetScheduler: Option[akka.actor.Cancellable] = None

  override def receive: Receive = {
    case _: StartSchedulerEvent                         => setupAndStartResetScheduler()
    case ResetEventIdGeneratorEvent(beginOfDayInMillis) => resetEventIdGeneratorOf(beginOfDayInMillis)
    case x                                              => logger.error(s"Received an unknown message: $x")
  }

  /**
    * 1. Stop current scheduler if exists
    * 2. Setup scheduler to run at 01:00 AM everyday and start it.
    * 3. Send the first reset event to this actor
    */
  private def setupAndStartResetScheduler(): Unit = {
    resetScheduler.foreach(_.cancel())
    resetScheduler = Some(createResetScheduler())
    sendResetLastNDays(7)
  }

  private def createResetScheduler(): Cancellable = {
    import scala.concurrent.duration.DurationLong
    val (delay, _) = TimeUtils.durationToTomorrowCheckpoint(1, 0)
    val interval = 24.hours
    system.scheduler.scheduleAtFixedRate(delay.millis, interval)(() => sendResetLastNDays(7))
  }

  private def sendResetLastNDays(numDays: Int): Unit = {
    import scala.concurrent.duration.DurationLong
    List
      .range(1, numDays + 1)
      .foreach(i => {
        val yesterdayTime = System.currentTimeMillis() - i.days.toMillis
        val (beginOfDayInMillis, _) = TimeUtils.calcBeginOfDayInMillsFrom(yesterdayTime)
        self ! ResetEventIdGeneratorEvent(beginOfDayInMillis)
      })
  }

  private def resetEventIdGeneratorOf(beginOfDayInMillis: Long): Unit = {
    val stopWatch = new StopWatch()
    try {
      stopWatch.start()
      info(s"[START]Reset counter for date: ${TimeUtils.format(beginOfDayInMillis, "dd/MM/yyyy HH:mm:ss.SSS")}")
      val idGenerator = idGeneratorFactory.eventIdGenerator(beginOfDayInMillis)
      idGenerator.reset().asTwitter.syncGet()
    } finally {
      stopWatch.stop()
      info(
        s"[END]Reset counter for date: ${TimeUtils.format(beginOfDayInMillis, "dd/MM/yyyy HH:mm:ss.SSS")} in ${stopWatch.formatTime()} successfully"
      )
    }

  }

}
