package datainsider.user_caas.repository

import datainsider.user_caas.repository.SessionRepository.RichSessionLike
import education.x.util.Using
import org.apache.commons.lang3.SerializationUtils
import org.apache.shiro.session.mgt.SimpleSession
import org.apache.shiro.session.mgt.eis.AbstractSessionDAO
import org.apache.shiro.session.{Session, UnknownSessionException}
import org.nutz.ssdb4j.spi.SSDB
import redis.clients.jedis.JedisPool

import java.io.Serializable
import java.util
import java.util.Collections
import scala.jdk.CollectionConverters.iterableAsScalaIterableConverter

/**
  * @author andy
  * @since 5/22/20
  * */
object SessionRepository {

  implicit class RichSessionLike(val session: Session) extends AnyVal {
    def toSimpleSession(): SimpleSession = {
      if (session.isInstanceOf[SimpleSession]) {
        session.asInstanceOf[SimpleSession]
      } else {
        val ss = new SimpleSession()
        ss.setId(session.getId)
        ss.setHost(session.getHost)
        ss.setStartTimestamp(session.getStartTimestamp)
        ss.setLastAccessTime(session.getLastAccessTime)
        ss.setTimeout(session.getTimeout)

        session.getAttributeKeys.toArray.foreach(k => {
          val v = session.getAttribute(k)
          ss.setAttribute(k, v)
        })

        ss
      }
    }
  }

}

trait SessionRepository extends AbstractSessionDAO {
  def getSessionIds(num: Int): Seq[String]

  def multiDelete(sessionIds: Seq[String]): Boolean
}

case class RedisSessionRepository(
    clientPool: JedisPool,
    deserializer: Array[Byte] => Session,
    serializer: SimpleSession => Array[Byte]
) extends AbstractSessionDAO {

  private def dbKey(sessionId: Serializable): Array[Byte] = SerializationUtils.serialize(s"user_sessions.$sessionId")

  override protected def doCreate(session: Session): Serializable = {
    val sessionId = generateSessionId(session)
    assignSessionId(session, sessionId)
    storeSession(sessionId, session)
    sessionId
  }

  protected def storeSession(sessionId: Serializable, session: Session): Session = {
    if (sessionId == null) throw new NullPointerException("id argument cannot be null.")
    Using(clientPool.getResource) { client =>
      {
        val simpleSession = session.toSimpleSession()
        client.set(dbKey(sessionId), serializer(simpleSession))
        if (simpleSession.getTimeout >= 0) {
          client.pexpire(dbKey(sessionId), simpleSession.getTimeout)
        }

        session
      }
    }
  }

  override protected def doReadSession(sessionId: Serializable): Session = {
    Using(clientPool.getResource) { client =>
      {
        val data = client.get(dbKey(sessionId))
        if (data != null) {
          deserializer(data)
        } else {
          throw new UnknownSessionException(s"$sessionId was not found or expired.")
        }

      }
    }
  }

  override def update(session: Session): Unit = {
    val simpleSession = session.toSimpleSession()
    Using(clientPool.getResource) { client =>
      {
        client.set(dbKey(simpleSession.getId), serializer(simpleSession))
        if (simpleSession.getTimeout >= 0) {
          client.pexpire(dbKey(simpleSession.getId), simpleSession.getTimeout)
        }
      }
    }

  }

  override def delete(session: Session): Unit = {
    if (session == null) throw new NullPointerException("session argument cannot be null.")
    val id = session.getId
    if (id != null) {
      Using(clientPool.getResource) { client =>
        {
          client.del(dbKey(id))
        }
      }
    }
  }

  override def getActiveSessions: util.Collection[Session] = {
    Collections.emptySet[Session]
  }

}

case class SSDBSessionRepository(
    client: SSDB,
    deserializer: Array[Byte] => Session,
    serializer: Session => Array[Byte]
) extends SessionRepository {

  private def dbKey(sessionId: Serializable): String = s"user_sessions.$sessionId"

  override protected def doCreate(session: Session): Serializable = {
    val sessionId = generateSessionId(session)
    assignSessionId(session, sessionId)
    storeSession(sessionId, session)
    sessionId
  }

  override protected def doReadSession(sessionId: Serializable): Session = {
    val response = client.get(dbKey(sessionId))
    if (response.ok()) {
      deserializer(response.datas.get(0))
    } else {
      throw new UnknownSessionException(s"$sessionId was not found or expired.")
    }

  }

  override def update(session: Session): Unit = {
    val sessionId = session.getId.toString

    if (session.getTimeout >= 0) {
      client.setx(
        dbKey(sessionId),
        serializer(session),
        (session.getTimeout / 1000).toInt
      )
    } else {
      client.set(dbKey(sessionId), serializer(session))
    }
  }

  override def delete(session: Session): Unit = {
    if (session == null) throw new NullPointerException("session argument cannot be null.")
    val id = session.getId
    if (id != null) {
      client.del(dbKey(id))
    }
  }

  override def getActiveSessions: util.Collection[Session] = Collections.emptySet[Session]

  override def getSessionIds(num: Int): Seq[String] = {
    val response = client.keys("user_sessions", "", num)
    response.listString().asScala.toSeq
  }

  override def multiDelete(sessionIds: Seq[String]): Boolean = {
    val response = client.multi_del(sessionIds: _*)
    response.ok()
  }

  private def storeSession(sessionId: Serializable, session: Session): Session = {
    if (sessionId == null) {
      throw new NullPointerException("id argument cannot be null.")
    }

    if (session.getTimeout >= 0) {
      client.setx(
        dbKey(sessionId),
        serializer(session),
        (session.getTimeout / 1000).toInt
      )
    } else {
      client.set(dbKey(sessionId), serializer(session))
    }

    session
  }
}
