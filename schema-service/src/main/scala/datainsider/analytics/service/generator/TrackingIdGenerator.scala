package datainsider.analytics.service.generator

import com.twitter.util.Future
import datainsider.client.domain.Implicits.ScalaFutureLike
import datainsider.client.exception.InternalError
import education.x.commons.IDGenerator

import scala.concurrent.ExecutionContext.Implicits.global

trait TrackingIdGenerator {
  def generateTrackingId(organizationId: Long): Future[String]
}

case class TrackingIdGeneratorImpl(idGenerator: IDGenerator[Int]) extends TrackingIdGenerator {

  override def generateTrackingId(organizationId: Long): Future[String] = {
    idGenerator
      .getNextId()
      .map {
        case Some(value) => value.toString
        case _           => throw InternalError(s"Error to generate new tracking id for $organizationId")
      }
      .asTwitter
  }
}
