package datainsider.client

import java.lang.reflect.{ParameterizedType, Type}
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.{DeserializationFeature, ObjectMapper, PropertyNamingStrategy}
import com.fasterxml.jackson.module.scala.{DefaultScalaModule, ScalaObjectMapper}
import com.twitter.inject.Logging
import com.twitter.util.{Future, Promise}
import com.typesafe.config.Config
import org.apache.kafka.clients.consumer.{ConsumerRecord, OffsetAndMetadata, KafkaConsumer => JKafkaConsumer}
import org.apache.kafka.clients.producer.{ProducerRecord, RecordMetadata, KafkaProducer => JKafkaProducer}
import org.apache.kafka.common.errors.{AuthorizationException, InvalidOffsetException}
import org.apache.kafka.common.serialization.{Deserializer, Serializer, StringDeserializer, StringSerializer}
import org.apache.kafka.common.{PartitionInfo, TopicPartition}

import scala.collection.JavaConverters._
import scala.collection.mutable
import scala.concurrent.duration.Duration
import scala.util.control.NonFatal

/**
  * Created by phg on 9/14/21.
 **/
trait KafkaConsumer[K, V] extends Converter with Logging {

  private[this] val wasCancelled = new AtomicBoolean(false)
  private[this] val isRunning = new AtomicBoolean(false)
  private[this] val locker = new Object

  private[this] val thread = new Thread(() => {
    val consumer: JKafkaConsumer[K, V] = new JKafkaConsumer[K, V](mapConfig, keyDeserializer, valueDeserializer)
    consumer.subscribe(topics.asJava)

    while (!this.wasCancelled.get()) try {

      val records = consumer.poll(java.time.Duration.ofMillis(pollTimeout.toMillis)).asScala.toList
      if (records.nonEmpty) {
        val offsets: mutable.Map[TopicPartition, OffsetAndMetadata] = mutable.Map()
        try {
          records.foreach(r => {
            consume(r)
            offsets += (new TopicPartition(r.topic, r.partition) -> new OffsetAndMetadata(r.offset + 1))
          })

        } catch {
          case NonFatal(_) =>
        } finally {
          //Commit offsets returned on the last poll for all the subscribed list of topics and partitions
          consumer.commitSync(offsets.asJava)
        }
      }

      Thread.sleep(delay.toMillis)
    } catch {
      case ex @ (_: AuthorizationException | _: InvalidOffsetException) =>
        error("UnAuthorize Kafka Consumer", ex)
        this.wasCancelled.set(true)
      case NonFatal(throwable) => error("Kafka poll error", throwable)
    }

    // close consumer before exit
    consumer.close()

    this.isRunning.set(false)
  })

  def startConsumer(): Boolean =
    locker.synchronized {
      if (this.isRunning.get()) return false
      this.isRunning.set(true)
      this.wasCancelled.set(false)

      thread.start()

      true
    }

  def stop(): Boolean = {
    if (this.isRunning.get()) {
      this.wasCancelled.set(true)
      true
    } else false
  }

  def status: Boolean = this.isRunning.get()

  //  protected def forceStop(): Unit = {
  //    this.wasCancelled.set(true)
  //    this.thread.interrupt()
  //  }

  protected def delay: Duration = Duration(100, TimeUnit.MILLISECONDS)

  protected def pollTimeout: Duration = Duration(5, TimeUnit.SECONDS)

  protected def stopWhenError: Boolean = true

  protected def mapConfig: java.util.Map[String, AnyRef]

  protected def keyDeserializer: Deserializer[K]

  protected def valueDeserializer: Deserializer[V]

  protected def topics: List[String]

  protected def consume(record: ConsumerRecord[K, V]): Unit
}

abstract class StringKafkaConsumer() extends KafkaConsumer[String, String] {
  override protected def keyDeserializer: Deserializer[String] = new StringDeserializer()

  override protected def valueDeserializer: Deserializer[String] = new StringDeserializer()
}

abstract class JsonObjectKafkaConsumer[A: Manifest] extends KafkaConsumer[String, A] with Jsoning {

  override protected def keyDeserializer: Deserializer[String] = new StringDeserializer()

  override protected def valueDeserializer: Deserializer[A] = (_: String, data: Array[Byte]) => data.asJsonObject[A]
}

trait KafkaProducer[K, V] {
  private val producer = new JKafkaProducer[K, V](mapConfig, keySerializer, valueSerializer)

  def send(
      topic: String,
      key: K,
      value: V,
      partition: Option[Int] = None,
      timestamp: Option[Long] = None
  ): Future[RecordMetadata] = {
    val promise = new Promise[RecordMetadata]()

    val record =
      new ProducerRecord[K, V](topic, partition.map(int2Integer).orNull, timestamp.map(long2Long).orNull, key, value)
    producer.send(
      record,
      (metadata: RecordMetadata, exception: Exception) => {
        if (exception == null) promise.setValue(metadata)
        else promise.setException(exception)
      }
    )

    promise
  }

  def flush(): Unit = producer.flush()

  def close(): Unit = producer.close()

  def partitionsFor(topic: String): List[PartitionInfo] = producer.partitionsFor(topic).asScala.toList

  def commitTransaction(): Unit = producer.commitTransaction()

  def abortTransaction(): Unit = producer.abortTransaction()

  protected def mapConfig: java.util.Map[String, AnyRef]

  protected def keySerializer: Serializer[K]

  protected def valueSerializer: Serializer[V]
}

abstract class StringKafkaProducer() extends KafkaProducer[String, String] {

  override protected def keySerializer: Serializer[String] = new StringSerializer()

  override protected def valueSerializer: Serializer[String] = new StringSerializer()
}

object StringKafkaProducer extends Converter {
  def producerWithConfig(config: Config): StringKafkaProducer =
    new StringKafkaProducer() {
      override protected def mapConfig: java.util.Map[String, AnyRef] = config.asPropertyMap
    }
}

trait Converter {

  implicit class ConfigLike(config: Config) {
    def asPropertyMap: java.util.Map[String, AnyRef] = {
      val map = mutable.Map[String, AnyRef]()
      config.entrySet().forEach(entry => map.put(entry.getKey, entry.getValue.unwrapped().toString))
      map.asJava
    }
  }

}

trait Jsoning {
  protected val mapper = new ObjectMapper() with ScalaObjectMapper
  mapper.registerModule(DefaultScalaModule)
  mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
  mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
  mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
  mapper.setSerializationInclusion(JsonInclude.Include.NON_ABSENT)

  private[this] def typeReference[T: Manifest]: TypeReference[T] =
    new TypeReference[T] {
      override def getType: Type = typeFromManifest(manifest[T])
    }

  private[this] def typeFromManifest(m: Manifest[_]): Type = {
    if (m.typeArguments.isEmpty) {
      m.runtimeClass
    } else
      new ParameterizedType {
        def getRawType: Class[_] = m.runtimeClass

        def getActualTypeArguments: Array[Type] = m.typeArguments.map(typeFromManifest).toArray

        def getOwnerType: Null = null

      }
  }

  implicit class DataArrayLike(bytes: Array[Byte]) {
    def asJsonObject[A: Manifest]: A = mapper.readValue(bytes, typeReference[A])
  }

  implicit class JsonObject[A <: AnyRef](a: A) {
    def toJsonString: String = mapper.writeValueAsString(a)

    def toPrettyJsonString: String = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(a)
  }

}
