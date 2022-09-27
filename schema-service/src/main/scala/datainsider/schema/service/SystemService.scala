package datainsider.schema.service

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{InternalError, NotFoundError}
import datainsider.client.util.NativeJdbcClient
import datainsider.schema.controller.http.responses.TestConnectionResponse
import datainsider.schema.domain.RefreshBy.RefreshBy
import datainsider.schema.domain.RefreshStatus.RefreshStatus
import datainsider.schema.domain.SystemStatus.SystemStatus
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.repository.SystemRepository
import datainsider.schema.util.Using

/**
  * created 2022-07-19 4:04 PM
  *
  * @author tvc12 - Thien Vi
  */
trait SystemService {

  /**
    * List all source of system
    * @forceGetStatus: true if test connection it take a long time, false will get system status from cache but faster
    */
  @throws[InternalError]("if create source error")
  def getSystemInfo(orgId: Long, forceGetStatus: Boolean = false): Future[SystemInfo]

  /**
    * Edit source of system
    */
  @throws[NotFoundError]("if source not found")
  @throws[InternalError]("if edit source error")
  def updateSystemInfo(
      orgId: Long,
      sources: Seq[ClickhouseSource],
      refreshConfig: Option[RefreshConfig]
  ): Future[SystemInfo]

  def updateSystemInfo(
      orgId: Long,
      refreshStatus: RefreshStatus,
      errorMsg: Option[String],
      refreshBy: RefreshBy
  ): Future[Unit]

  /**
    * @return test connection response, if success, return true, else return false and errorMsg
    */
  def testConnection(orgId: Long, sourceConfig: ClickhouseSource): Future[TestConnectionResponse]
}

class SystemServiceImpl(systemRepository: SystemRepository, timeoutMs: Int = 30000) extends SystemService with Logging {
  override def updateSystemInfo(
      orgId: Long,
      sources: Seq[ClickhouseSource],
      refreshConfig: Option[RefreshConfig]
  ): Future[SystemInfo] = {
    for {
      systemInfo <- getSystemInfo(orgId)
      newSystemInfo = systemInfo.copy(
        sources = sources,
        refreshConfig = refreshConfig.getOrElse(systemInfo.refreshConfig)
      )
      _ <- systemRepository.setSystemInfo(orgId, newSystemInfo)
    } yield newSystemInfo
  }

  override def getSystemInfo(orgId: Long, forceGetStatus: Boolean = false): Future[SystemInfo] = {
    for {
      systemInfo <- systemRepository.getSystemInfo(orgId)
      status <- getSystemStatus(systemInfo, forceGetStatus)
    } yield systemInfo.copy(status = status)
  }

  private def getSystemStatus(systemInfo: SystemInfo, forceGetStatus: Boolean): Future[SystemStatus] = {
    (forceGetStatus, systemInfo.sources.nonEmpty) match {
      case (true, true) =>
        testConnection(systemInfo.orgId, systemInfo.sources.head).map(testConnectionResponse => {
          if (testConnectionResponse.isSuccess) {
            SystemStatus.Healthy
          } else {
            SystemStatus.Unhealthy
          }
        })
      case (true, false) => Future.value(SystemStatus.Unhealthy)
      case (false, _)    => Future.value(systemInfo.status)
    }
  }

  override def testConnection(orgId: Long, sourceConfig: ClickhouseSource): Future[TestConnectionResponse] = {
    try {
      val client = NativeJdbcClient(sourceConfig.jdbcUrl, sourceConfig.username, sourceConfig.password)
      Using(client.getConnection()) { conn =>
        conn.isValid(timeoutMs)
      }
      Future.value(TestConnectionResponse(true, None))
    } catch {
      case ex: Throwable =>
        logger.error(ex.getMessage, ex)
        Future.value(TestConnectionResponse(false, Some(ex.getMessage)))
    }
  }

  override def updateSystemInfo(
      orgId: Long,
      refreshStatus: RefreshStatus,
      errorMsg: Option[String],
      refreshBy: RefreshBy
  ): Future[Unit] = {
    for {
      systemInfo <- systemRepository.getSystemInfo(orgId)
      newSystemInfo = systemInfo.copy(
        currentRefreshStatus = RefreshStatus.Init,
        lastRefreshStatus = Some(refreshStatus),
        lastRefreshBy = Some(refreshBy),
        lastRefreshErrorMsg = errorMsg,
        lastRefreshTime = Some(System.currentTimeMillis())
      )
      result <- systemRepository.setSystemInfo(orgId, newSystemInfo)
    } yield result
  }
}

class MockSystemService extends SystemService {
  override def getSystemInfo(orgId: Long, forceGetStatus: Boolean = false): Future[SystemInfo] = {
    Future.value(
      SystemInfo(
        orgId = orgId,
        sources = Seq.empty,
        refreshConfig = RefreshConfig(Seq.empty),
        status = SystemStatus.Healthy,
        currentRefreshStatus = RefreshStatus.Init,
        lastRefreshStatus = None,
        lastRefreshBy = None,
        lastRefreshErrorMsg = None,
        lastRefreshTime = None
      )
    )
  }

  override def updateSystemInfo(
      orgId: Long,
      sources: Seq[ClickhouseSource],
      refreshConfig: Option[RefreshConfig]
  ): Future[SystemInfo] = {
    Future.value(
      SystemInfo(
        orgId = orgId,
        sources = sources,
        refreshConfig = refreshConfig.getOrElse(RefreshConfig(Seq.empty)),
        status = SystemStatus.Healthy,
        currentRefreshStatus = RefreshStatus.Init,
        lastRefreshStatus = None,
        lastRefreshBy = None,
        lastRefreshErrorMsg = None,
        lastRefreshTime = None
      )
    )
  }

  override def testConnection(orgId: Long, sourceConfig: ClickhouseSource): Future[TestConnectionResponse] = {
    Future.value(TestConnectionResponse(true, None))
  }

  override def updateSystemInfo(
      orgId: Long,
      refreshStatus: RefreshStatus,
      errorMsg: Option[String],
      refreshBy: RefreshBy
  ): Future[Unit] = {
    Future.Unit
  }
}
