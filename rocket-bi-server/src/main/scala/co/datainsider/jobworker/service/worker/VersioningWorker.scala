package co.datainsider.jobworker.service.worker

import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_profile.client.OrgClientService
import co.datainsider.jobworker.domain.VersioningWorkerStatus
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo}
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.util.JsonParser
import datainsider.notification.service.NotificationService

import java.util.concurrent.atomic.{AtomicBoolean, AtomicInteger, AtomicLong}
import java.util.concurrent.{Executors, ScheduledExecutorService, TimeUnit}
import scala.util.matching.Regex

/**
  * versioning old table data after sync iterations
  * currently not support any version
  * old table will be delete after certain time amount
  */
trait VersioningWorker {
  def start(): Unit

  def status(): Future[VersioningWorkerStatus]

  def cleanUpTmpTables(): Unit
}

class VersioningWorkerImpl @Inject() (
    schemaService: SchemaClientService,
    orgClientService: OrgClientService,
    notificationService: NotificationService
) extends VersioningWorker
    with Logging {

  private val isRunning = new AtomicBoolean(false)
  private val curDeletedTablesCount = new AtomicInteger(0)
  private val curDeleteErrorsCount = new AtomicInteger(0)

  private val beginTime = new AtomicLong(0)
  private val endTime = new AtomicLong(0)

  private val versioningWorkerScheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1)

  override def start(): Unit = {
    versioningWorkerScheduler.scheduleAtFixedRate(
      () => {
        beginTime.set(System.currentTimeMillis())
        endTime.set(0)

        isRunning.set(true)
        curDeletedTablesCount.set(0)
        curDeleteErrorsCount.set(0)

        cleanUpTmpTables()

        isRunning.set(false)
        endTime.set(System.currentTimeMillis())

        val finalStatus: VersioningWorkerStatus = status().sync()
        val title = s"${this.getClass.getSimpleName}::finalStatus"
        val message = JsonParser.toJson(finalStatus)
        sendNotification(title, message)
      },
      0,
      1,
      TimeUnit.HOURS
    )

    info(s"${this.getClass.getSimpleName}::startVersioningWorker versioning worker started!")
  }

  override def status(): Future[VersioningWorkerStatus] =
    Future {
      VersioningWorkerStatus(
        isRunning = isRunning.get(),
        curDeletedTablesCount = curDeletedTablesCount.get(),
        curDeleteErrorsCount = curDeleteErrorsCount.get(),
        finalTotalTablesNum = -1,
        finalTmpTablesNum = -1,
        executionTime = getExecutionTime()
      )
    }

  override def cleanUpTmpTables(): Unit = {
    try {
      val orgIds = orgClientService.getAllOrganizations(0, 1000).sync().data.map(_.organizationId)
      val databases: Seq[DatabaseShortInfo] = orgIds.flatMap(orgId => {
        schemaService.getDatabases(orgId).sync()
      })

      databases.foreach(db => {
        try {
          val tmpDbSchema: DatabaseSchema = schemaService.getTemporaryTables(db.organizationId, db.name).sync()
          tmpDbSchema.tables.foreach(tblSchema => cleanUpTmpTable(tblSchema.organizationId, db.name, tblSchema.name))
        } catch {
          case e: Throwable =>
            val title = s"${this.getClass.getSimpleName}::deleteTemporaryTables:error"
            val message =
              s"""
                 |get and delete temporary tables of db ${db.name} failed.
                 |exception: $e
                 |""".stripMargin
            sendNotification(title, message)
            error(s"delete tmp tables of ${db.name} fail: ${e.getMessage}", e)
        }
      })
    } catch {
      case e: Throwable => logger.error(s"VersioningWorkerImpl exception: $e")
    }
  }

  private def cleanUpTmpTable(orgId: Long, dbName: String, tblName: String): Unit = {

    if (isExpired(tblName)) {
      try {
        schemaService.deleteTableSchema(orgId, dbName, tblName).sync()
        curDeletedTablesCount.incrementAndGet()
      } catch {
        case e: Throwable =>
          curDeleteErrorsCount.incrementAndGet()
          val title = s"${this.getClass.getSimpleName}::deleteTmpTable:error"
          val message =
            s"""
               |delete table $dbName.$tblName failed.
               |exception: $e
               |""".stripMargin
          sendNotification(title, message)
          logger.error(s"delete table $dbName.$tblName failed with exception: ${e.getMessage}", e)
      }
    }

  }

  def isExpired(tblName: String): Boolean = {
    val oldTableRegex: Regex = """^__di_old_([\w]+)_(\d{13})$""".r
    val tmpTableTtl: Long = ZConfig.getLong("versioning_worker.tmp_table_ttl_ms", TimeUnit.HOURS.toMillis(1))

    tblName match {
      case oldTableRegex(_, tblCreatedTime) =>
        System.currentTimeMillis() > tblCreatedTime.toLong + tmpTableTtl
      case _ => false
    }
  }

  private def addShutdownHook(): Unit = {
    scala.sys.addShutdownHook({
      versioningWorkerScheduler.shutdown()
    })
  }

  private def getExecutionTime(): Long = {
    if (beginTime.get() == 0) {
      0L
    } else if (endTime.get() == 0) {
      System.currentTimeMillis() - beginTime.get()
    } else {
      endTime.get() - beginTime.get()
    }
  }

  private def sendNotification(title: String, message: String): Future[Unit] = {
    notificationService
      .push(
        0L,
        "job-worker",
        title,
        message,
        None
      )
      .rescue {
        case e: Throwable =>
          logger.error(s"send notification error: ${e.getMessage}", e)
          Future.Unit
      }
  }

  addShutdownHook()
  start()
}
