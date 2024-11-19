package co.datainsider.bi.service

import co.datainsider.bi.client.BIClientService
import co.datainsider.bi.domain.Ids.OrganizationId
import co.datainsider.bi.domain.{Connection, TunnelConnection}
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.{EngineFactory, EngineFactoryProvider}
import co.datainsider.bi.util.Using
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.common.client.exception.DbExecuteError
import com.google.common.cache.{Cache, CacheBuilder, RemovalNotification}
import com.twitter.util.logging.Logging
import com.twitter.util.{Duration, Future}

import java.util.concurrent.TimeUnit
import scala.reflect.ClassTag

trait EngineService {
  @throws[InternalError]("if not found connection")
  def get(orgId: Long): Future[Engine]

  def remove(orgId: Long): Future[Unit]

  @throws[DbExecuteError]("if connection error")
  def test(orgId: Long, connection: Connection): Future[Boolean]
}

class EngineServiceImpl(
    biClientService: BIClientService,
    tunnelService: TunnelService,
    factoryProvider: EngineFactoryProvider,
    maxEngineSize: Int = 200,
    expiredAfterAccessMs: Long = Duration.fromMinutes(180).inMillis // 3 hours
) extends EngineService
    with Logging {

  private val clazz = getClass.getSimpleName

  private val engineMap: Cache[OrganizationId, Engine] = CacheBuilder
    .newBuilder()
    .asInstanceOf[CacheBuilder[OrganizationId, Engine]]
    .maximumSize(maxEngineSize)
    .expireAfterAccess(expiredAfterAccessMs, TimeUnit.MILLISECONDS)
    .removalListener((notification: RemovalNotification[Long, Engine]) =>
      try {
        logger.debug(s"close client of org-${notification.getKey}")
        notification.getValue.close()
      } catch {
        case ex: Exception =>
          logger.error(s"Error when close client of org-${notification.getKey}, exception: ${ex.getMessage}", ex)
      }
    )
    .build[Long, Engine]()

  override def get(orgId: Long): Future[Engine] = {
    Profiler(s"[Service] $clazz::get") {
      getConnection(orgId).map(connection => {
        if (isConnectionChanged(connection)) {
          engineMap.invalidate(orgId)
        }
        engineMap.get(connection.orgId, () => resolveEngine(connection, isTestMode = false))
      })
    }
  }

  private def getConnection(orgId: Long): Future[Connection] = Profiler(s"[Service] $clazz::getConnection") {
    for {
      originConnection: Connection <- biClientService.get(orgId)
      tunnelConnection: Option[TunnelConnection] <- openTunnelConnection(originConnection)
    } yield tunnelConnection.getOrElse(originConnection)
  }

  private def openTunnelConnection(connection: Connection): Future[Option[TunnelConnection]] = Profiler(s"[Service] $clazz::openTunnelConnection") {
    connection match {
      case tunnelConnection: TunnelConnection => tunnelService.openConnection(tunnelConnection)
      case _                                  => Future.None
    }
  }

  private def isConnectionChanged(connection: Connection): Boolean = Profiler(s"[Service] $clazz::isConnectionChanged"){
    val previousEngine: Engine = engineMap.getIfPresent(connection.orgId)
    if (previousEngine == null) {
      true
    } else {
      previousEngine.connection.isDifferent(connection)
    }
  }

  private def resolveEngine(connection: Connection, isTestMode: Boolean): Engine = {
    val factory: EngineFactory[Connection] = factoryProvider.get(ClassTag(connection.getClass))
    val engine = isTestMode match {
      case true  => factory.createTestEngine(connection)
      case false => factory.create(connection)
    }
    engine.setCloseListener(() => handleOnEngineClose(connection))
    engine
  }

  private def handleOnEngineClose(connection: Connection): Unit = {
    connection match {
      case tunnelConnection: TunnelConnection => tunnelService.closeConnection(tunnelConnection)
      case _                                  =>
    }
  }

  override def test(orgId: OrganizationId, connection: Connection): Future[Boolean] = Profiler(s"[Service] $clazz::test"){
    for {
      originConnection: Connection <- Future.value(connection.customCopy(orgId = orgId))
      tunnelConnection: Option[TunnelConnection] <- openTunnelConnection(originConnection)
      engine <- Future.value(resolveEngine(tunnelConnection.getOrElse(originConnection), isTestMode = true))
      isSuccess <- Using(engine)(_.testConnection())
    } yield isSuccess
  }

  override def remove(orgId: OrganizationId): Future[Unit] = Future {
    engineMap.invalidate(orgId)
  }
}

case class MockEngineService(engine: Engine) extends EngineService {
  override def get(orgId: Long): Future[Engine] = Future.value(engine)

  override def test(orgId: OrganizationId, connection: Connection): Future[Boolean] = Future.True

  override def remove(orgId: OrganizationId): Future[Unit] = Future.Unit
}
