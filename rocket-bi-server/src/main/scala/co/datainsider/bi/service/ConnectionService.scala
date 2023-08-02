package co.datainsider.bi.service

import co.datainsider.bi.domain.{Connection, SshKeyPair, TunnelConnection}
import co.datainsider.bi.engine.{ClientManager, Engine}
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.repository.ConnectionRepository
import co.datainsider.bi.util.Using
import co.datainsider.bi.util.profiler.Profiler
import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.exception.NotFoundError

import scala.util.Try

trait ConnectionService {
  def getOriginConnection(orgId: Long): Future[Connection]

  /**
    * get connection from repository and enhance connection with ssh tunnel
    * if connection don't have ssh tunnel config then return connection
    * @return tunnel connection with mapped ports
    */
  def getTunnelConnection(orgId: Long): Future[Connection]

  /**
    * multi get connection from repository and enhance connection with ssh tunnel
    * @return map of tunnel connection with mapped ports
    */
  def mgetTunnelConnection(orgIds: Seq[Long]): Future[Map[Long, Connection]]

  def exist(orgId: Long): Future[Boolean]

  def set(orgId: Long, connection: Connection): Future[Connection]

  def delete(orgId: Long): Future[Connection]

  def test(orgId: Long, connection: Connection): Future[Boolean]
}

class ConnectionServiceImpl @Inject() (
    connectionRepository: ConnectionRepository,
    engineResolver: EngineResolver,
    sshKeyService: SshKeyService,
    clientManager: ClientManager
) extends ConnectionService {
  private val clazz = getClass.getSimpleName
  override def getOriginConnection(orgId: Long): Future[Connection] =
    Profiler(s"[Service] $clazz::get") {
      connectionRepository.get(orgId).map {
        case Some(conn) => conn
        case None       => throw NotFoundError(s"not found connection for org $orgId")
      }
    }

  override def mgetTunnelConnection(orgIds: Seq[Long]): Future[Map[Long, Connection]] =
    Profiler(s"[Service] $clazz::mgetTunnelConnection") {
      connectionRepository
        .mget(orgIds)
        .flatMap(connections => {
          val connectionMap: Map[Long, Future[Connection]] = connections.mapValues(enhanceConnection)
          Future.collect(connectionMap)
        })
    }

  override def getTunnelConnection(orgId: Long): Future[Connection] = {
    for {
      connection <- getOriginConnection(orgId)
      enhancedConnection <- enhanceConnection(connection)
    } yield enhancedConnection
  }

  private def enhanceConnection(connection: Connection): Future[Connection] = {
    connection match {
      case sshConnection: TunnelConnection if (sshConnection.isUseTunnel()) => {
        sshKeyService
          .getKeyPair(connection.orgId)
          .map((keyPair: SshKeyPair) => {
            val session: SshSession = SshSessionManager.getSession(keyPair, sshConnection.tunnelConfig.get)
            val newPorts = session.forwardLocalPorts(sshConnection.getRemotePorts())
            sshConnection.copyHostPorts(
              host = session.getLocalHost(),
              ports = newPorts
            )
          })
      }
      case _ => Future.value(connection)
    }
  }

  override def set(orgId: Long, connection: Connection): Future[Connection] =
    Profiler(s"[Service] $clazz::set") {
      for {
        oldConnection: Option[Connection] <- connectionRepository.get(orgId)
        _ <- connectionRepository.set(orgId, connection.customCopy(orgId = orgId))
        newConnection <- getOriginConnection(orgId)
      } yield {
        if (oldConnection.isDefined) {
          closeOpenConnection(oldConnection.get)
        }
        newConnection
      }
    }

  private def closeOpenConnection(oldConnection: Connection): Unit = {
    Try(clientManager.removeClient(oldConnection))
    Try(closeTunnel(oldConnection))
  }

  private def closeTunnel(connection: Connection): Unit = {
    connection match {
      case tunnelConnection: TunnelConnection =>
        tunnelConnection.tunnelConfig.foreach { sshTunnelConfig =>
          SshSessionManager.closeSession(connection.orgId, sshTunnelConfig)
        }
      case _ =>
    }
  }

  override def exist(orgId: Long): Future[Boolean] =
    Profiler(s"[Service] $clazz::exists") {
      connectionRepository.exist(orgId)
    }

  override def test(orgId: Long, connection: Connection): Future[Boolean] =
    Profiler(s"[Service] $clazz::test") {
      val newConn: Connection = connection.customCopy(orgId = orgId)
      newConn match {
        case tunnelConn: TunnelConnection if (tunnelConn.isUseTunnel()) => {
          testTunnelConnection(tunnelConn)
        }
        case _ => testConnection(newConn)
      }
    }

  private def testTunnelConnection(connection: TunnelConnection): Future[Boolean] =
    Future {
      require(connection.tunnelConfig.isDefined, "ssh tunnel config must be defined")
      sshKeyService
        .getKeyPair(connection.orgId)
        .flatMap((keyPair: SshKeyPair) => {
          Using(SshSessionManager.createSession(keyPair, connection.tunnelConfig.get))((sshSession: SshSession) => {
            val newPorts = sshSession.forwardLocalPorts(connection.getRemoteHost(), connection.getRemotePorts())
            val tunnelConnection: Connection = connection.copyHostPorts(
              host = sshSession.getLocalHost(),
              ports = newPorts
            )
            testConnection(tunnelConnection)
          })
        })
    }.flatten

  private def testConnection(connection: Connection): Future[Boolean] = {
    val engine: Engine[Connection] = engineResolver.resolve(connection.getClass).asInstanceOf[Engine[Connection]]
    engine.testConnection(connection)
  }

  override def delete(orgId: Long): Future[Connection] =
    Profiler(s"[Service] $clazz::delete") {
      for {
        conn <- getOriginConnection(orgId)
        _ <- connectionRepository.delete(orgId)
      } yield {
        closeOpenConnection(conn)
        conn
      }
    }
}

case class MockConnectionService(source: Connection) extends ConnectionService {
  override def getOriginConnection(orgId: Long): Future[Connection] = Future.value(source.customCopy(orgId = orgId))

  override def mgetTunnelConnection(orgIds: Seq[Long]): Future[Map[Long, Connection]] =
    Future {
      orgIds.map(orgId => orgId -> source.customCopy(orgId = orgId)).toMap
    }

  override def set(orgId: Long, connection: Connection): Future[Connection] =
    Future.value(connection.customCopy(orgId = orgId))

  override def exist(orgId: Long): Future[Boolean] = Future.True

  override def test(orgId: Long, connection: Connection): Future[Boolean] = Future.True

  override def delete(orgId: Long): Future[Connection] = Future.value(source.customCopy(orgId = orgId))

  override def getTunnelConnection(orgId: Long): Future[Connection] = Future.value(source.customCopy(orgId = orgId))
}
