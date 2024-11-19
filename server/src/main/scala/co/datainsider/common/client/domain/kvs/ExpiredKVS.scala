package co.datainsider.common.client.domain.kvs

import co.datainsider.caas.user_profile.util.JsonParser
import org.nutz.ssdb4j.spi.{Response, SSDB}

import scala.jdk.CollectionConverters.mapAsScalaMapConverter

/**
  * created 2023-12-15 5:34 PM
  *
  * @author tvc12 - Thien Vi
  */
trait ExpiredKVS[K, V] {
  def put(key: K, value: V): Unit

  def put(key: K, value: V, expiredTimeMs: Long): Unit

  def get(key: K): Option[V]

  def remove(key: K): Unit

  def getAll(): Map[K, V]

  def size(): Int
}

case class SsdbExpiredKVS[K, V](ssdb: SSDB, dbName: String, maxItemSize: Int, defaultExpiredTimeMs: Long)(implicit
    keySerializer: Serializer[K],
    valueSerializer: Serializer[V]
) extends ExpiredKVS[K, V] {

  private def buildKey(key: K): String = s"${dbName}.${keySerializer.serialize(key)}"

  override def put(key: K, value: V): Unit = put(key, value, defaultExpiredTimeMs)

  override def put(key: K, value: V, expiredTimeMs: Long): Unit = {
    ssdb.setx(buildKey(key), valueSerializer.serialize(value), (expiredTimeMs / 1000).toInt)
  }

  override def get(key: K): Option[V] = {
    val response: Response = ssdb.get(buildKey(key))
    if (response.ok() && response.datas.size() == 1) {
      Some(valueSerializer.deserialize(response.asString()))
    } else {
      None
    }
  }

  override def remove(key: K): Unit = {
    ssdb.del(buildKey(key))
  }

  private def reverseOriginKey(key: String): K = {
    keySerializer.deserialize(key.replace(s"${dbName}.", ""))
  }

  override def getAll(): Map[K, V] = {
    val response = ssdb.scan(s"$dbName.", s"${dbName}.~", maxItemSize)
    response
      .mapString()
      .asScala
      .map {
        case (key, value) => (reverseOriginKey(key), valueSerializer.deserialize(value))
      }
      .toMap
  }

    override def size(): Int = {
      val response: Response = ssdb.zsize(dbName)
      if (response.ok()) {
        response.asInt()
      } else {
        0
      }
    }
}


