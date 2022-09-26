package datainsider.analytics.service.tracking

import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.google.inject.name.Named
import com.twitter.inject.Logging
import com.twitter.util.Future
import com.typesafe.config.Config
import datainsider.analytics.domain.commands.{EventBatch, TrackingEvent}
import datainsider.analytics.domain.tracking.TrackingStatus
import datainsider.analytics.service.TrackingSchemaService
import datainsider.client.util.ZConfig
import datainsider.client.{JsonObjectKafkaConsumer, Jsoning, StringKafkaProducer}
import datainsider.ingestion.domain.TableSchema
import datainsider.ingestion.misc.JdbcClient.Record
import datainsider.ingestion.repository.{DataRepository, SchemaRepository}
import datainsider.ingestion.util.Implicits.{FutureEnhance, ImplicitString}
import datainsider.profiler.Profiler
import org.apache.kafka.clients.consumer.ConsumerRecord

import java.text.SimpleDateFormat
import java.util
import java.util.Date
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import scala.concurrent.duration.Duration
import scala.util.control.NonFatal
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * Created by phg on 9/21/21.
 **/
@deprecated("no longer used")
case class KafkaTrackingService @Inject() (
    @Named("kafka-async-tracking-config") config: Config,
    schemaMerger: TrackingSchemaMerger,
    dataRepository: DataRepository,
    schemaRepository: SchemaRepository,
    trackingSchemaService: TrackingSchemaService
) extends AsyncTrackingService
    with Jsoning
    with Logging {

  private val producer = StringKafkaProducer.producerWithConfig(config.getConfig("producer"))
  private val topic = config.getString("topic")

  /**
    * push track content to a message queue to process later
    *
    * @param eventBatch list of events to be records
    * @return
    */
  override def track(eventBatch: EventBatch): Future[Boolean] =
    Profiler(s"[Tracking] ${this.getClass.getName}::track") {
      val apiKey = eventBatch.trackingApiKey
      val orgId = eventBatch.orgId

      // categorize events into same-type-event batch
      // construct data block for each event
      // push to queue
      val fns: Seq[Future[Boolean]] = eventBatch.events
        .groupBy(_.name)
        .map {
          case (eventName, events) =>
            if (events.nonEmpty) {
              toDataBlock(orgId, events).map { dataBlock =>
                producer.send(topic, eventName, dataBlock.toJsonString)
                true
              }
            } else Future.True
        }
        .toSeq
      Future.collect(fns).map(_.reduce(_ && _))
    }

  private def toDataBlock(orgId: Long, events: Seq[TrackingEvent]): Future[DataBlock] =
    Profiler(s"[Tracking] ${this.getClass.getName}::toDataBlock") {
      {
        schemaMerger.mergeEventDetailSchema(orgId, events.head.name, events.head.properties).map { schema =>
          val rows: Seq[Record] = events.map(event => toRows(event, schema))

          /***
            * param pattern get from config
            * param field is a field name use as timestamp, get from config
            * if event don't have field to use as timestamp, use current time instead
            */
          val pattern = ZConfig.getString("partition_key.pattern", "yyyy/MM/dd")
          val timestampField = ZConfig.getString("partition_key.field", "")
          val timestamp: Long =
            if (events.head.properties.contains(timestampField)) {
              events.head.properties(timestampField).asInstanceOf[Number].longValue()
            } else {
              System.currentTimeMillis()
            }
          val pathConfig = EventPathConfig(schema.name, pattern, timestamp)

          DataBlock(BlockConfig(schema = schema, pathConfig = Some(pathConfig)), System.currentTimeMillis(), rows)

        }
      }
    }

  private def toRows(event: TrackingEvent, schema: TableSchema): Record = {
    Profiler(s"[Tracking] ${this.getClass.getName}::toRows") {
      val normalizeProperties = event.properties.map { case (k, v) => k.toSnakeCase -> v }
      schema.columns.map(c => {
        normalizeProperties.getOrElse(c.name, null)
      })
    }
  }

  val eventConsumer: JsonObjectKafkaConsumer[DataBlock] = new JsonObjectKafkaConsumer[DataBlock] {

    private val _delayPoll = config.getDuration("delay-poll").toMillis
    private val _delayError = config.getDuration("delay-error").toMillis
    private var _delay = _delayPoll

    override protected def mapConfig: util.Map[String, AnyRef] = config.getConfig("consumer").asPropertyMap

    override protected def topics: List[String] = List(topic)

    override protected def delay: Duration = Duration(_delay, TimeUnit.MILLISECONDS)

    override protected def consume(record: ConsumerRecord[String, DataBlock]): Unit = {
      try {
        val block: DataBlock = record.value()
        ingest(block)
      } catch {
        case NonFatal(throwable) =>
          error(s"consume error, retry in ${_delayError} millis...", throwable)
          _delay = _delayError

          // throw exception to ignore commit kafka
          throw throwable
      }
      Unit
    }
  }

  @deprecated("use a separate worker to write to clickhouse, will be rewritten")
  override def startTrackingWorkers(): Boolean = {
    ???
  }

  @deprecated("use a separate worker to write to clickhouse, will be rewritten")
  override def stopTrackingWorkers(): Boolean = {
    ???
  }

  override def status(): Future[TrackingStatus] = ???

  private def ingest(block: DataBlock): Future[Int] = {
    val batchSize = ZConfig.getInt("tracking.ingest.batch_size", 1000)
    dataRepository.writeRecords(block.blockConfig.schema, block.rows, batchSize)
  }

}

case class DataBlock(
    blockConfig: BlockConfig,
    timestamp: Long,
    rows: Seq[Record]
)

case class BlockConfig(schema: TableSchema, pathConfig: Option[PathConfig] = None)

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[EventPathConfig], name = "event_path_config")
  )
)
trait PathConfig {
  def getPartitionPath: String
}

case class EventPathConfig(tblName: String, pattern: String, timestamp: Long) extends PathConfig {
  override def getPartitionPath: String = {
    val date = new Date(timestamp)
    val formatter = new SimpleDateFormat(pattern)
    s"events/$tblName/${formatter.format(date)}"
  }
}
