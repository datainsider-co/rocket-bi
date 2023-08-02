package co.datainsider.caas.user_profile.repository

import com.twitter.util.Future
import co.datainsider.caas.user_profile.domain.Implicits._
import org.nutz.ssdb4j.spi.SSDB

/**
  * @author sonpn
  */
trait KeyValueRepository[K, V] {
  def put(k: K, v: V, ttl: Option[Int] = None): Unit

  def get(k: K): Option[V]

  def expire(k: K, ttl: Int): Unit

  def incr(k: K, num: Int = 1): V

  def exists(k: K): Boolean

  def delete(k: K): Unit

  def gets(k: Seq[K]): Map[K, V]

  def timeLeft(l: K): Option[Int]
}

object SSDBKeyValueRepository {

  implicit class KeyValueRepositoryAsync[K, V](repository: KeyValueRepository[K, V]) {

    def asyncPut(k: K, v: V, ttl: Option[Int] = None): Future[Unit] =
      async {
        repository.put(k, v, ttl)
      }

    def asyncExpire(k: K, ttl: Int): Future[Unit] =
      async {
        repository.expire(k, ttl)
      }

    def asyncExists(k: K): Future[Boolean] =
      async {
        repository.exists(k)
      }

    def asyncDelete(k: K): Future[Unit] =
      async {
        repository.delete(k)
      }

    def asyncIncr(k: K, num: Int): Future[V] =
      async {
        repository.incr(k, num)
      }

    def asyncGet(k: K): Future[Option[V]] =
      async {
        repository.get(k)
      }

    def asyncGets(k: Seq[K]): Future[Map[K, V]] =
      async {
        repository.gets(k)
      }

    def asyncTimeLeft(k: K): Future[Option[Int]] =
      async {
        repository.timeLeft(k)
      }
  }

}

abstract class SSDBKeyValueRepository[K, V](ssdb: SSDB) extends KeyValueRepository[K, V] {

  override def put(k: K, v: V, ttl: Option[Int] = None): Unit = {
    val resp = ssdb.set(k, v)
    resp.ok() match {
      case true =>
        ttl match {
          case Some(ttl) =>
            ssdb.expire(k, ttl) match {
              case r if r.asInt() > 0 =>
              case _ =>
                ssdb.del(k)
                throw new Exception("SSDB Client failed to put.")
            }
          case None =>
        }
      case false => throw new Exception("SSDB Client failed to put.")
    }
  }

  override def expire(k: K, ttl: Int): Unit = {
    val resp = ssdb.expire(k, ttl)
    resp.ok() match {
      case true  =>
      case false => throw new Exception("SSDBClient failed to expire.")
    }
  }

  override def exists(k: K): Boolean = {
    val resp = ssdb.exists(k)
    (resp.ok(), resp.asInt()) match {
      case (true, 1) => true
      case (true, 0) => false
      case _         => throw new Exception("SSDBClient failed to exists.")
    }
  }

  override def delete(k: K): Unit = {
    val resp = ssdb.del(k)
    resp.ok() match {
      case true  =>
      case false => throw new Exception("SSDBClient failed to delete.")
    }
  }

  override def timeLeft(k: K): Option[Int] = {
    val resp = ssdb.ttl(k)
    resp.ok() match {
      case true  => resp.asInt()
      case false => -1
    }
  }

  override def incr(k: K, num: Int): V = throw new UnsupportedOperationException("Unsupported method")

  override def get(k: K): Option[V] = throw new UnsupportedOperationException("Unsupported method")

  override def gets(k: Seq[K]): Map[K, V] = throw new UnsupportedOperationException("Unsupported method")
}
