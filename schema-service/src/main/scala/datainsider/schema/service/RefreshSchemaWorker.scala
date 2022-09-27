package datainsider.schema.service

import com.google.inject.Inject
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.{JdbcClient, NativeJdbcClient}
import datainsider.schema.domain.RefreshBy.RefreshBy
import datainsider.schema.domain.RefreshStatus.RefreshStatus
import datainsider.schema.domain.{RefreshBy, RefreshStatus, SystemInfo}
import datainsider.schema.repository.{ClickhouseMetaDataHandler, ClickhouseMetaDataHandlerImpl, SchemaMetadataStorage}
import datainsider.schema.util.ClickHouseUtils

import java.util.concurrent.atomic.AtomicBoolean

/**
  * created 2022-07-20 11:21 AM
  *
  * @author tvc12 - Thien Vi
  */
trait RefreshSchemaWorker {

  /**
    * start refresh schema, neu dang start thi se khong co gi xay ra
    */
  def start(): Unit

  /**
    * stop refresh schema, neu dang stop thi khong co gi xay ra
    */
  def stop(): Unit

  /**
    * Force refresh schema of source
    */
  def refreshSchema(orgId: Long, refreshBy: RefreshBy): Future[Boolean]
}

class RefreshSchemaWorkerImpl @Inject() (
    systemService: SystemService,
    storage: SchemaMetadataStorage,
    refreshSleepTimeMs: Long
) extends RefreshSchemaWorker
    with Logging {
  private val isRunning = new AtomicBoolean(false)
  private val refreshSchemaThread = new Thread(new Runnable {
    override def run(): Unit = {
      while (isRunning.get()) {
        try {
          val systemInfo: SystemInfo = systemService.getSystemInfo(ClickHouseUtils.SINGLE_TENANT_ID).syncGet()
          val setRefreshStatus = (status: RefreshStatus, errorMsg: Option[String]) =>
            systemService.updateSystemInfo(systemInfo.orgId, status, errorMsg, RefreshBy.System)
          refreshSchema(systemInfo, setRefreshStatus)
          Thread.sleep(refreshSleepTimeMs)
        } catch {
          case ex: InterruptedException =>
            isRunning.set(false)
          case ex: Throwable =>
            logger.error("Refresh schema error", ex)
            Thread.sleep(refreshSleepTimeMs)
        }
      }
    }
  })

  override def start(): Unit = {
    if (isRunning.get() == false) {
      isRunning.set(true)
      refreshSchemaThread.start()
    }
  }

  override def stop(): Unit = {
    if (isRunning.get()) {
      isRunning.set(false)
    }
  }

  /**
    * Force refresh schema of source
    */
  def refreshSchema(orgId: Long, refreshBy: RefreshBy): Future[Boolean] = {
    systemService
      .getSystemInfo(orgId)
      .map(systemInfo => {
        println(s"system info ${systemInfo}")
        if (isRefreshSchema(systemInfo, refreshBy)) {
          val thread = new Thread(() => {
            logger.info(s"Thread ${Thread.currentThread().getName} start refresh schema")
            val setRefreshStatus = (status: RefreshStatus, errorMsg: Option[String]) =>
              systemService.updateSystemInfo(systemInfo.orgId, status, errorMsg, refreshBy)
            refreshSchema(systemInfo, setRefreshStatus)
            logger.info(s"Thread ${Thread.currentThread().getName} start refresh completed")
          })
          thread.start()
          true
        } else {
          false
        }
      })
  }

  private def refreshSchema(
      systemInfo: SystemInfo,
      setRefreshStatus: (RefreshStatus, Option[String]) => Future[Unit]
  ): Unit = {
    try {
      logger.info("Refresh schema of orgId: " + systemInfo.orgId)
      val client: JdbcClient = NativeJdbcClient(
        systemInfo.sources.head.jdbcUrl,
        systemInfo.sources.head.username,
        systemInfo.sources.head.password
      )
      val clickhouseMetaDataHandler: ClickhouseMetaDataHandler = new ClickhouseMetaDataHandlerImpl(client)
      val clickhouse2DISchema = new Clickhouse2DISchema(
        ClickHouseUtils.SINGLE_TENANT_ID,
        clickhouseMetaDataHandler,
        storage,
        systemInfo.refreshConfig,
        setRefreshStatus
      )
      clickhouse2DISchema.run()
      logger.info(s"Refresh schema of orgId: ${systemInfo.orgId} success")
    } catch {
      case ex: Throwable => logger.error(ex.getMessage, ex)
    }
  }

  private def isRefreshSchema(systemInfo: SystemInfo, refreshBy: RefreshBy): Boolean = {
    systemInfo.sources.nonEmpty && (refreshBy == RefreshBy.System || systemInfo.currentRefreshStatus != RefreshStatus.Running)
  }
}

class MockRefreshSchemaWorker extends RefreshSchemaWorker {
  override def start(): Unit = {}

  override def stop(): Unit = {}

  override def refreshSchema(orgId: Long, refreshBy: RefreshBy): Future[Boolean] = Future.value(true)
}
