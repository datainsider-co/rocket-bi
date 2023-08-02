package co.datainsider.bi.util.tracker

import co.datainsider.bi.util.{Serializer, ZConfig}
import co.datainsider.schema.misc.ClickHouseUtils
import com.twitter.inject.Logging
import datainsider.client.util.HttpClient

import java.util
import java.util.concurrent.{LinkedBlockingQueue, TimeUnit}
import scala.collection.JavaConverters._

object UserActivityTrackingClient extends Logging {

  val BASE_TRACKING_DB: String = ZConfig.getString("tracking_client.events_tracking.db_name", "tracking")
  val EVENTS_TBL: String = ZConfig.getString("tracking_client.events_tracking.event_tbl_name", "di_events")
  val CUSTOMERS_TBL: String = ZConfig.getString("tracking_client.events_tracking.customer_tbl_name", "di_customers")

  val BASE_SYSTEM_DB: String = ZConfig.getString("tracking_client.user_activities.db_name", "di_system")
  val USER_ACTIVITIES_TBL: String = ZConfig.getString("tracking_client.user_activities.tbl_name", "user_activities")

  var isEnable: Boolean = ZConfig.getBoolean("tracking_client.enable", true)

  val userActivityTrackingUrl: String =
    ZConfig.getString("tracking_client.user_activity_tracking_host", "http://localhost:8080/activities")
  val secretToken: String = ZConfig.getString("tracking_client.secret_token", "user_activity@bi_service")

  val eventBatchSize: Int = ZConfig.getInt("tracking_client.event_batch_size", 100)
  val maxQueueSize: Int = ZConfig.getInt("tracking_client.max_queue_size", 1000)
  val sleepTimeMs: Int = ZConfig.getInt("tracking_client.sleep_time_ms", 100)
  val maxWaitTimeMs: Int = ZConfig.getInt("tracking_client.max_wait_time_ms", 10000)
  val queuingTimeoutMs: Int = ZConfig.getInt("tracking_client.queuing_timeout_ms", 100)

  val eventsQueue = new LinkedBlockingQueue[UserActivityEvent](maxQueueSize)

  def track(event: UserActivityEvent): Unit = {
    if (isEnable) {
      eventsQueue.offer(event, queuingTimeoutMs, TimeUnit.MILLISECONDS)
    }
  }

  def setIsEnable(enable: Boolean): Unit = {
    isEnable = enable
  }

  def start(): Unit = {

    val consumerThread = new Thread(
      () => {
        var waitTime: Int = 0
        while (true) {
          try {
            if (eventsQueue.size() >= eventBatchSize || waitTime >= maxWaitTimeMs) {
              waitTime = 0
              val events = new util.ArrayList[UserActivityEvent]()
              eventsQueue.drainTo(events, eventBatchSize)
              send(events.asScala)
            } else {
              waitTime += sleepTimeMs
              Thread.sleep(sleepTimeMs)
            }
          } catch {
            case ex: Throwable => error(ex.getMessage)
          }

        }
      },
      "tracking-client-consumer-thread"
    )
    info(s"start ${consumerThread.getName}")

    consumerThread.start()

    addShutdownHook()

  }

  start()

  private def addShutdownHook(): Unit = {
    scala.sys.addShutdownHook({
      logger.info(s"{${this.getClass.getSimpleName}::ShutdownHook start flush remain message: " + eventsQueue.size())
      if (eventsQueue.size() > 0) {
        val events = new util.ArrayList[UserActivityEvent]()
        eventsQueue.drainTo(events)
        send(events.asScala)
      }
      logger.info(s"${this.getClass.getSimpleName}::ShutdownHook end flush remain message")
    })
  }

  private def send(events: Seq[UserActivityEvent]): Unit = {
    if (events.nonEmpty) {
      try {
        val request = TrackUserActivitiesRequest(events)
        var nRetries = 0

        while (nRetries < 3) {
          if (
            HttpClient
              .post(
                url = userActivityTrackingUrl,
                data = Serializer.toJson(request),
                headers = Map("secret_token" -> secretToken)
              )
              .isSuccess
          ) {
            return
          }
          nRetries += 1
          error(s"${this.getClass.getSimpleName}::send retries ${nRetries} time")
        }

        error(s"${this.getClass.getSimpleName}::send error after ${nRetries} time")
      } catch {
        case e: Throwable => error(s"${this.getClass.getSimpleName}::send fail with exception: ${e}")
      }
    }
  }

  def TRACKING_DB(orgId: Long): String = {
    ClickHouseUtils.buildDatabaseName(orgId, BASE_TRACKING_DB)
  }

  def SYSTEM_DB(orgId: Long): String = {
    ClickHouseUtils.buildDatabaseName(orgId, BASE_SYSTEM_DB)
  }

}
