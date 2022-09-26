package datainsider.analytics.service.tracking

import java.util.concurrent.{LinkedBlockingQueue, TimeUnit}

import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.{Await, Future}
import datainsider.analytics.domain.commands.EventBatch
import datainsider.analytics.domain.tracking.TrackingStatus
import datainsider.client.util.ZConfig
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

class AsyncTrackingServiceWithPool @Inject() (asyncTrackingService: AsyncTrackingService)
    extends AsyncTrackingService
    with Logging {

  val numConsumer: Int = ZConfig.getInt("tracking.num_workers", Runtime.getRuntime.availableProcessors() * 2)
  val maxPoolSize: Int = ZConfig.getInt("tracking.max_pool_size", 1000000)
  val arrConsumers = new Array[Thread](numConsumer)
  val enqueueTimeout: Int = ZConfig.getInt("tracking.enqueue_timeout", 1 /*second*/ )
  val queue = new LinkedBlockingQueue[EventBatch](maxPoolSize)

  override def track(eventBatch: EventBatch): Future[Boolean] =
    Profiler(s"[Tracking] ${this.getClass.getName}::track") {
      Future {
        queue.offer(eventBatch, enqueueTimeout, TimeUnit.SECONDS)
      }
    }

  override def startTrackingWorkers(): Boolean = {
    for (threadIndex <- 0 until numConsumer) {
      val consumerThread = new Thread(
        () => {
          while (true) {
            val eventBatch: EventBatch = queue.take()
            Await.result(asyncTrackingService.track(eventBatch))
          }
        },
        s"event-consumer-to-kafka-$threadIndex"
      )
      consumerThread.start()
      logger.info(s"start event consumer $threadIndex")
      arrConsumers(threadIndex) = consumerThread
    }
    true
  }

  val instanceName: String = ZConfig.getString("profiler.instance_name")

  override def status(): Future[TrackingStatus] =
    Future {
      val runningThreadAsStr = arrConsumers.map(t => t.getName).mkString(", ")
      TrackingStatus(
        instanceName = instanceName,
        runningThreads = runningThreadAsStr,
        numWorkers = numConsumer,
        maxPoolSize = maxPoolSize,
        currentPoolSize = queue.size()
      )
    }

  override def stopTrackingWorkers(): Boolean = ???
}
