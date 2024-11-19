package co.datainsider.common.client.domain.queue

import co.datainsider.common.client.domain.kvs.Serializer
import org.nutz.ssdb4j.spi.SSDB

import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.asScalaBufferConverter

/**
  * created 2023-12-12 4:26 PM
  *
  * @author tvc12 - Thien Vi
  */
class SsdbBlockingQueue[T](db: SSDB, dbName: String)(implicit serializer: Serializer[T]) extends BlockingQueue[T] {

  def put(value: T): Unit = {
    db.qpush(dbName, serializer.serialize(value))
  }

  def take(): Option[T] = {
    val response = db.qpop(dbName)
    if (response.ok() && response.datas.size() == 1) {
      Some(serializer.deserialize(response.asString()))
    } else {
      None
    }
  }

  def size(): Int = {
    val response = db.qsize(dbName)
    if (response.ok()) {
      response.asInt()
    } else {
      0
    }
  }

  def getAll(): Seq[T] = {
    val response = db.qrange(dbName, 0, -1)
    if (response.ok()) {
      response
        .listString()
        .asScala
        .map(serializer.deserialize)
    } else {
      Seq.empty
    }
  }
}
