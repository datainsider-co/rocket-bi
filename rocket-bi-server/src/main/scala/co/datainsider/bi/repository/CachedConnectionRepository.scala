package co.datainsider.bi.repository

import co.datainsider.bi.domain.Connection
import com.google.inject.Inject
import com.twitter.util.Future

import java.util.concurrent.ConcurrentHashMap

class CachedConnectionRepository @Inject() (connectionRepository: ConnectionRepository) extends ConnectionRepository {
  private val connectionsMap: java.util.Map[Long, Connection] = new ConcurrentHashMap[Long, Connection]()

  override def get(orgId: Long): Future[Option[Connection]] = {
    if (connectionsMap.containsKey(orgId)) {
      Future(Some(connectionsMap.get(orgId)))
    } else {
      connectionRepository.get(orgId).map {
        case Some(conn) =>
          connectionsMap.put(orgId, conn)
          Some(conn)
        case None => None
      }
    }
  }

  override def mget(orgIds: Seq[Long]): Future[Map[Long, Connection]] = {
    Future.collect(orgIds.map(orgId => get(orgId))).map(connections => connections.flatten.map(c => c.orgId -> c).toMap)
  }

  override def exist(orgId: Long): Future[Boolean] = {
    connectionRepository.exist(orgId)
  }

  override def set(orgId: Long, connection: Connection): Future[Boolean] = {
    for {
      _ <- connectionRepository.set(orgId, connection)
    } yield {
      connectionsMap.put(orgId, connection)
      true
    }
  }

  override def delete(orgId: Long): Future[Boolean] = {
    for {
      _ <- connectionRepository.delete(orgId)
    } yield {
      connectionsMap.remove(orgId)
      true
    }
  }
}
