package co.datainsider.common.client.domain.kvs

import org.nutz.ssdb4j.spi.SSDB

/**
  * created 2024-01-05 11:10 PM
  *
  * @author tvc12 - Thien Vi
  */
trait Cache[K, V] {
  def put(key: K, value: V): Unit

  def get(key: K): Option[V]

  def remove(key: K): Unit

  def clear(): Unit
}

case class SSDBCache[K, V](ssdb: SSDB, dbName: String)(implicit
    keySerializer: Serializer[K],
    valueSerializer: Serializer[V]
) extends Cache[K, V] {

  private def buildKey(key: K): String = s"${dbName}.${keySerializer.serialize(key)}"

  override def put(key: K, value: V): Unit = {
    ssdb.hset(dbName, keySerializer.serialize(key), valueSerializer.serialize(value))
  }

  override def get(key: K): Option[V] = {
    val response = ssdb.hget(dbName, keySerializer.serialize(key))
    if (response.ok() && response.datas.size() == 1) {
      Some(valueSerializer.deserialize(response.asString()))
    } else {
      None
    }
  }

  override def remove(key: K): Unit = {
    ssdb.hdel(dbName, keySerializer.serialize(key))
  }

  override def clear(): Unit = {
    ssdb.hclear(dbName)
  }
}
