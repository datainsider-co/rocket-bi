package co.datainsider.schema.service

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.Ids.OrganizationId
import co.datainsider.bi.service.ConnectionService
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_caas.domain.Page
import co.datainsider.caas.user_profile.client.OrgClientService
import co.datainsider.caas.user_profile.domain.Implicits.{FutureEnhanceLike, async}
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.schema.domain.RefreshSchemaHistory
import co.datainsider.schema.repository.RefreshSchemaHistoryRepository
import co.datainsider.schema.service.StageName.Completed
import co.datainsider.schema.service.StageStatus.StageStatus
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.NotFoundError

import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.mutable
import scala.jdk.CollectionConverters.collectionAsScalaIterableConverter

/**
  * created 2023-05-31 9:54 PM
  *
  * @author tvc12 - Thien Vi
  */
trait RefreshSchemaService {

  /**
    * Schedule refresh schema for all organization
    * if there is a refresh schema is running, then skip
    */
  def start(): Unit

  /**
    * Stop all refresh schema
    * if there refresh schema is not running, then skip
    */
  def stop(): Unit

  /**
    * get refresh schema status for organization
    * @param organizationId organization id want to get refresh schema status
    * @return refresh schema status
    */
  def getRefreshHistory(organizationId: OrganizationId): Future[RefreshSchemaHistory]

  def getWorkerStatus(): Future[Map[String, Any]]

  /**
    * force refresh schema for organization, if there is a schema is refreshing, then skip this request
    * @param organizationId organization id want to refresh schema
    * @return true if refresh schema is scheduled, otherwise false
    */
  def forceRefreshSchema(organizationId: OrganizationId, username: String): Future[Boolean]

  /**
    * force stop refresh schema by organization id
    * @param organizationId organization id want to stop refresh schema
    * @return true if refresh schema is stopped, otherwise false
    */
  def syncStopRefreshSchema(organizationId: OrganizationId): Future[Boolean]
}

class RefreshSchemaServiceImpl(
    refreshSchemaWorker: RefreshSchemaWorker,
    orgClientService: OrgClientService,
    connectionService: ConnectionService,
    historyRepository: RefreshSchemaHistoryRepository,
    batchSize: Int = 100,
    refreshIntervalMs: Int = 1800000, // 30 minutes,
    waitStopTimeoutMs: Int = 30000 // 30 seconds
) extends RefreshSchemaService
    with Logging {
  private val clazz = getClass.getSimpleName
  private val isRefreshRunning = new AtomicBoolean(false)
  private val refreshingIdSet = mutable.Set.empty[Long]
  private val currentHistoryMap = new java.util.HashMap[Long, RefreshSchemaHistory]()

  private val refreshSchemaThread = new Thread(new Runnable {
    override def run(): Unit = {
      while (isRefreshRunning.get()) {
        try {
          processRefreshSchema()
          Thread.sleep(refreshIntervalMs)
        } catch {
          case ex: InterruptedException => isRefreshRunning.set(false)
          case ex: Throwable =>
            logger.error("Refresh schema error", ex)
            Thread.sleep(refreshIntervalMs)
        }
      }
    }
  })

  private def processRefreshSchema(): Unit =
    Profiler(s"$clazz:processRefreshSchema") {
      var isRefreshCompleted = false
      var from = 0
      while (isRefreshRunning.get() && !isRefreshCompleted) {
        val page: Page[Organization] = orgClientService.getAllOrganizations(from, batchSize).syncGet()
        page.data.foreach((organization: Organization) => {
          try {
            refreshSchema(
              organization.organizationId,
              createdBy = None,
              (orgId: Long) => {
                connectionService.getTunnelConnection(orgId)
              }
            )
          } catch {
            case ex: NotFoundError =>
              logger.debug(s"Organization: ${organization.organizationId} does not have source", ex)
            case ex: Throwable =>
              logger.error(s"Refresh schema for org: ${organization.organizationId} error", ex)
          }
        })
        from += batchSize
        isRefreshCompleted = from >= page.total
      }
    }

  private def refreshSchema(
      orgId: Long,
      createdBy: Option[String] = None,
      getConnection: (Long) => Future[Connection]
  ): Unit =
    Profiler(s"$clazz:refreshSchema") {
      if (!refreshingIdSet.contains(orgId)) {
        try {
          refreshingIdSet.add(orgId)
          val history: RefreshSchemaHistory = createNewHistory(orgId, createdBy = None)
          currentHistoryMap.put(orgId, history)
          refreshSchemaWorker.run(orgId, getConnection, handleOnReportStage)
        } catch {
          case ex: Throwable =>
            logger.debug(s"Refresh schema for org: ${orgId} error", ex)
            val stage = RefreshSchemaStage(
              orgId,
              StageName.Completed,
              status = StageStatus.Error,
              message = ex.getMessage
            )
            handleOnReportStage(stage)
        } finally {
          refreshingIdSet.remove(orgId)
        }
      }
    }

  private def createNewHistory(orgId: Long, createdBy: Option[String]): RefreshSchemaHistory = {
    val latestHistory: Option[RefreshSchemaHistory] = historyRepository.getLatestHistory(orgId).syncGet()
    val isFirstRun: Boolean = latestHistory match {
      case Some(history) => false
      case None          => true
    }
    val history = RefreshSchemaHistory(
      orgId = orgId,
      isFirstRun = isFirstRun,
      status = StageStatus.Running,
      stages = Seq.empty,
      createdBy = createdBy,
      updatedBy = createdBy,
      createdTime = System.currentTimeMillis(),
      updatedTime = System.currentTimeMillis()
    )
    historyRepository.insert(orgId, history).syncGet()
  }

  private def handleOnReportStage(stage: RefreshSchemaStage): Unit = {
    if (currentHistoryMap.containsKey(stage.orgId)) {
      val currentHistory: RefreshSchemaHistory = currentHistoryMap.get(stage.orgId)
      val newStages: Seq[RefreshSchemaStage] = currentHistory.stages.filterNot(_.name == stage.name)
      val newStatus: StageStatus = toHistoryStatus(stage)
      val newHistory: RefreshSchemaHistory = currentHistory.copy(
        stages = newStages :+ stage,
        status = newStatus,
        updatedTime = System.currentTimeMillis()
      )
      currentHistoryMap.put(stage.orgId, newHistory)
      historyRepository.update(stage.orgId, newHistory).syncGet()
    }
  }

  private def toHistoryStatus(stage: RefreshSchemaStage): StageStatus = {
    if (stage.name == Completed) {
      stage.status
    } else {
      StageStatus.Running
    }
  }

  override def start(): Unit = {
    if (!isRefreshRunning.get()) {
      isRefreshRunning.set(true)
      refreshSchemaThread.start()
    }
  }

  override def stop(): Unit = {
    if (isRefreshRunning.get()) {
      isRefreshRunning.set(false)
    }
  }

  override def getRefreshHistory(organizationId: OrganizationId): Future[RefreshSchemaHistory] = {
    if (currentHistoryMap.containsKey(organizationId)) {
      Future.value(currentHistoryMap.get(organizationId))
    } else {
      historyRepository.getLatestHistory(organizationId).map {
        case Some(history) => history
        case _             => RefreshSchemaHistory(organizationId, isFirstRun = true, status = StageStatus.NotStarted)
      }
    }
  }

  override def forceRefreshSchema(organizationId: OrganizationId, username: String): Future[Boolean] = {
    if (refreshingIdSet.contains(organizationId) || refreshSchemaWorker.isRunning(organizationId)) {
      Future.False
    } else {
      async {
        refreshSchema(
          organizationId,
          createdBy = Some(username),
          (orgId: Long) => {
            connectionService.getTunnelConnection(orgId)
          }
        )
      }
      Future.True
    }
  }

  override def syncStopRefreshSchema(organizationId: OrganizationId): Future[Boolean] =
    Future {
      if (refreshingIdSet.contains(organizationId)) {
        refreshSchemaWorker.waitStop(organizationId, waitStopTimeoutMs)
      }
      true
    }

  override def getWorkerStatus(): Future[Map[String, Any]] =
    Future {
      Map(
        "is_running" -> isRefreshRunning.get(),
        "refreshing_org_ids" -> refreshingIdSet.toSeq,
        "current_histories" -> currentHistoryMap.values().asScala
      )
    }
}

class MockRefreshSchemaService extends RefreshSchemaService {
  override def start(): Unit = {}

  override def stop(): Unit = {}

  override def getRefreshHistory(organizationId: OrganizationId): Future[RefreshSchemaHistory] = {
    Future.value(RefreshSchemaHistory(organizationId, isFirstRun = true, status = StageStatus.NotStarted))
  }

  override def getWorkerStatus(): Future[Map[String, Any]] = {
    Map(
      "is_running" -> true
    )
  }

  override def forceRefreshSchema(organizationId: OrganizationId, username: String): Future[Boolean] = Future.True

  override def syncStopRefreshSchema(organizationId: OrganizationId): Future[Boolean] = Future.True
}
