package datainsider.analytics.service.tracking

import com.twitter.util.Future
import datainsider.analytics.domain.EventData
import datainsider.analytics.domain.commands.{EventBatch, TrackingEvent}
import datainsider.analytics.domain.tracking.TrackingStatus
import datainsider.analytics.misc.PropertiesResolver
import datainsider.analytics.repository.TrackingDataRepository
import datainsider.client.exception.{BadRequestError, InternalError}
import datainsider.client.util.JsonParser

import java.util.concurrent.LinkedBlockingQueue
import javax.inject.Inject

/**
  * responsible for receive tracking request from client and push request's content to a message queue
  * tracking worker will later on take messages from queue and perform ingestion later
  */
@deprecated("no longer used")
trait AsyncTrackingService {

  /**
    * push track content to a message queue to process later
    * @param request list of events to be records
    * @return
    */
  def track(eventBatch: EventBatch): Future[Boolean]

  def startTrackingWorkers(): Boolean

  def stopTrackingWorkers(): Boolean

  def status(): Future[TrackingStatus]

}

@deprecated("use kafka KafkaTrackingService")
class InMemAsyncTrackingService @Inject() (trackingWorker: TrackingWorker) extends AsyncTrackingService {

  val eventQueue = new LinkedBlockingQueue[String]()

  override def track(eventBatch: EventBatch): Future[Boolean] =
    Future {
      try {
        produceEvent(eventBatch)
        true
      } catch {
        case _: Throwable => false
      }
    }

  private def produceEvent(eventBatch: EventBatch): Unit = {
    eventQueue.put(JsonParser.toJson(eventBatch))
  }

  val consumerThread: Thread = new Thread(() => {
    while (true) {
      val eventBatch: EventBatch = JsonParser.fromJson[EventBatch](eventQueue.take())
      trackingWorker.run(eventBatch)
    }
  })

  def startTrackingWorkers(): Boolean = {
    consumerThread.start()
    true
  }

  override def stopTrackingWorkers(): Boolean = {
    consumerThread.interrupt()
    true
  }

  override def status(): Future[TrackingStatus] = ???
}

/**
  * input: tracking event: 1 event or list of event?
  * output: succeed or not
  */
class TrackingWorker @Inject() (
    propertyResolver: PropertiesResolver,
    schemaMerger: TrackingSchemaMerger,
    trackingDataRepository: TrackingDataRepository
) {

  /***
    * process and insert a list of track event
    * @param eventBatch batch tracking request
    * @return
    */
  def run(eventBatch: EventBatch): Future[Boolean] = {
    val fns: Seq[Future[Boolean]] = eventBatch.events
      .groupBy(_.name)
      .map {
        case (_, events) =>
          if (events.nonEmpty) ingestTrackingData(eventBatch.orgId, events)
          else Future.True
      }
      .toSeq
    Future.collect(fns).map(_.reduce(_ && _))
  }

  private def ingestTrackingData(orgId: Long, events: Seq[TrackingEvent]): Future[Boolean] = {
    for {
      eventsProps <- propertyResolver.buildListEventProps(orgId, events)
      _ <- mergeEventSchema(orgId, eventsProps.head.toEventData())
      isSuccess <- trackingDataRepository.insertTrackingEvent(orgId, eventsProps.map(_.toEventData()))
    } yield {
      if (isSuccess) {
        true
      } else {
        throw InternalError("No records were saved")
      }
    }
  }

  /**
    * prepare table schema that match with list of properties from request
    */
  private def mergeEventSchema(organizationId: Long, eventData: EventData): Future[Unit] = {
    for {
      _ <- schemaMerger.mergeEventDetailSchema(organizationId, eventData.name, eventData.detailProperties)
    } yield {}
  }

}

@deprecated("no longer used")
class MockTrackingService extends AsyncTrackingService {

  override def track(eventBatch: EventBatch): Future[Boolean] = throw BadRequestError("events tracking is disable")

  override def startTrackingWorkers(): Boolean = true

  override def stopTrackingWorkers(): Boolean = true

  override def status(): Future[TrackingStatus] = ???

}
