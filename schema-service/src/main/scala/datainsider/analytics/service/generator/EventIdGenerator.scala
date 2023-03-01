package datainsider.analytics.service.generator

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import datainsider.client.exception.InternalError
import datainsider.ingestion.util.TimeUtils

import java.util.UUID
import scala.concurrent.ExecutionContext.Implicits.global

trait EventIdGenerator {
  def generateEventId(organizationId: Long): Future[String]
}

/**
  * ResetEventIdGeneratorActor will reset (clear) the past generators
  */
case class EventIdGeneratorImpl(idGeneratorFactory: EventIdGeneratorFactory) extends EventIdGenerator with Logging {

  override def generateEventId(organizationId: Long): Future[String] = {
    val idGenerator = idGeneratorFactory.eventIdGenerator()
    idGenerator
      .getNextId()
      .map {
        case Some(value) => buildEventId(organizationId, value)
        case _           => throw InternalError(s"Error to generate new id for $organizationId")
      }
      .recover {
        case ex => buildFallbackEventId(organizationId)
      }
      .asTwitter
  }

  private def buildEventId(organizationId: Long, counter: Int): String = {
    val (beginOfDayInMillis, _) = TimeUtils.calcBeginOfDayInMills()
    s"$organizationId-$beginOfDayInMillis-$counter"
  }

  private def buildFallbackEventId(organizationId: Long): String = {
    s"$organizationId-${UUID.randomUUID().toString}"
  }

}
