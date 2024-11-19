package co.datainsider.bi.service

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.repository.ConnectionRepository
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.common.client.domain.kvs.Cache
import co.datainsider.common.client.exception.NotFoundError
import com.google.inject.Inject
import com.twitter.util.{Future, Return, Throw}

trait ConnectionService {
  def get(orgId: Long): Future[Connection]

  def exist(orgId: Long): Future[Boolean]

  def set(orgId: Long, connection: Connection): Future[Connection]

  def delete(orgId: Long): Future[Connection]
}

class ConnectionServiceImpl(connectionRepository: ConnectionRepository) extends ConnectionService {
  private val clazz = getClass.getSimpleName
  override def get(orgId: Long): Future[Connection] =
    Profiler(s"[Service] $clazz::get") {
      connectionRepository.get(orgId).map {
        case Some(conn) => conn
        case None       => throw NotFoundError(s"not found connection for org $orgId")
      }
    }

  override def set(orgId: Long, connection: Connection): Future[Connection] =
    Profiler(s"[Service] $clazz::set") {
      for {
        oldConnection: Option[Connection] <- connectionRepository.get(orgId)
        _ <- connectionRepository.set(orgId, connection.customCopy(orgId = orgId))
        newConnection <- get(orgId)
      } yield newConnection
    }

  override def exist(orgId: Long): Future[Boolean] =
    Profiler(s"[Service] $clazz::exists") {
      connectionRepository.exist(orgId)
    }

  override def delete(orgId: Long): Future[Connection] =
    Profiler(s"[Service] $clazz::delete") {
      for {
        conn <- get(orgId)
        _ <- connectionRepository.delete(orgId)
      } yield conn
    }
}

case class CacheConnectionService(
    originService: ConnectionService,
    cache: Cache[Long, Connection]
) extends ConnectionService {
  private val clazz = getClass.getSimpleName
  override def get(orgId: Long): Future[Connection] = Profiler(s"[Service] $clazz::get") {
    Future {
      cache.get(orgId) match {
        case Some(conn) => Future.value(conn)
        case None => {
          originService.get(orgId).map { conn =>
            cache.put(orgId, conn)
            conn
          }
        }
      }
    }.flatten
  }

  override def set(orgId: Long, connection: Connection): Future[Connection] = Profiler(s"[Service] $clazz::set") {
    for {
      _ <- originService.set(orgId, connection)
      conn <- originService.get(orgId)
    } yield {
      cache.put(orgId, conn)
      conn
    }
  }

  override def exist(orgId: Long): Future[Boolean] = Profiler(s"[Service] $clazz::exist") {
    get(orgId).transform {
      case Return(r) => Future.True
      case Throw(e)  => Future.False
    }
  }

  override def delete(orgId: Long): Future[Connection] = Profiler(s"[Service] $clazz::delete") {
    for {
      conn <- originService.delete(orgId)
    } yield {
      cache.remove(orgId)
      conn
    }
  }
}

case class MockConnectionService(source: Connection) extends ConnectionService {
  override def get(orgId: Long): Future[Connection] = Future.value(source.customCopy(orgId = orgId))
  override def set(orgId: Long, connection: Connection): Future[Connection] =
    Future.value(connection.customCopy(orgId = orgId))

  override def exist(orgId: Long): Future[Boolean] = Future.True

  override def delete(orgId: Long): Future[Connection] = Future.value(source.customCopy(orgId = orgId))
}
