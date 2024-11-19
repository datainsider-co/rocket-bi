package co.datainsider.bi.service

import co.datainsider.bi.client.BIClientService
import co.datainsider.bi.domain.{SshKeyPair, TunnelConnection}
import co.datainsider.bi.util.Implicits.{async, FutureEnhance}
import co.datainsider.common.client.exception.InternalError
import com.google.common.cache.{Cache, CacheBuilder, RemovalNotification}
import com.twitter.util.Future
import com.twitter.util.logging.Logging

trait TunnelService {

  /**
    * open connection to tunnel
    * @return tunnel connection with mapped ports
    *         None if connection don't have ssh tunnel config
    */
  @throws[InternalError]("if connect to tunnel is failed")
  def openConnection(connection: TunnelConnection): Future[Option[TunnelConnection]]

  def closeConnection(connection: TunnelConnection): Future[Unit]
}

class TunnelServiceImpl(biClientService: BIClientService, maxSessionSize: Int = 200) extends TunnelService with Logging {

  private val tunnelSessionMap: Cache[Long, TunnelSession] = CacheBuilder
    .newBuilder()
    .asInstanceOf[CacheBuilder[Long, TunnelSession]]
    .maximumSize(maxSessionSize)
    .removalListener((notification: RemovalNotification[Long, TunnelSession]) =>
      try {
        logger.debug(s"close client of org: ${notification.getKey}")
        notification.getValue.close()
      } catch {
        case ex: Exception => {
          logger.error(s"Error when remove tunnel of ${notification.getKey} cause ${ex.getMessage}", ex)
        }
      }
    )
    .build[Long, TunnelSession]()

  override def openConnection(connection: TunnelConnection): Future[Option[TunnelConnection]] = async {
    if (connection.tunnelConfig.isDefined) {
      val session: TunnelSession = tunnelSessionMap.get(connection.orgId, () => createTunnelSession(connection))
      session.open()
      val newConnection = connection.copyHostPorts(
        host = session.getMappedHost(),
        oldToNewPortMap = session.getMappedPortAsMap()
      )
      Some(newConnection)
    } else {
      None
    }
  }

  private def createTunnelSession(connection: TunnelConnection): TunnelSession = {
    val keyPair: SshKeyPair = biClientService.getKeyPair(connection.orgId).syncGet()
    TunnelSession
      .newBuilder()
      .setKeyPair(keyPair)
      .setTunnelConnection(connection)
      .build()
  }

  override def closeConnection(connection: TunnelConnection): Future[Unit] = Future {
    tunnelSessionMap.invalidate(connection.orgId)
  }
}
