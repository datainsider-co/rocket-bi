package co.datainsider.bi.engine

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.util.ZConfig
import com.google.common.cache.{CacheBuilder, RemovalNotification}
import com.twitter.util.logging.Logging

import java.util.concurrent.TimeUnit

/**
  * created 2023-06-27 11:41 AM
  *
  * @author tvc12 - Thien Vi
  */
class ClientManager(maxClientSize: Int = 200) extends Logging {


  /**
    * key: orgId
    * value: (source, jdbcClient)
    */
  private val clientsCache = CacheBuilder
    .newBuilder()
    .maximumSize(maxClientSize)
    .removalListener((notification: RemovalNotification[Connection, Client]) =>
      try {
        logger.debug(s"close client of org-${notification.getKey.orgId}")
        notification.getValue.close()
      } catch {
        case ex: Exception =>
          logger.error(s"Error when close client of org-${notification.getKey.orgId}, exception: ${ex.getMessage}", ex)
      }
    )
    .build[Connection, Client]

  def get[S <: Connection, C <: Client](source: S)(createClientFn: () => C): C = {
    val client: Client = clientsCache.get(source, () => createClientFn())
    client.asInstanceOf[C]
  }

  def removeClient(oldSource: Connection): Unit = {
    clientsCache.invalidate(oldSource)
  }

  def getClientSize(): Long = {
    clientsCache.size()
  }
}
