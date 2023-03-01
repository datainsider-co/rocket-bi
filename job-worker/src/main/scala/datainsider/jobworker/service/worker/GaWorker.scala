package datainsider.jobworker.service.worker

import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.http.HttpRequestInitializer
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.analyticsreporting.v4.AnalyticsReporting
import com.google.api.services.analyticsreporting.v4.model._
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike, using}
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.Column
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain._
import datainsider.jobworker.domain.job.{GaDateRange, GaDimension, GaJob, GaMetric}
import datainsider.jobworker.service.OAuth2CredentialService
import datainsider.jobworker.util.ZConfig
import education.x.commons.SsdbKVS

import java.util
import java.util.concurrent.atomic.AtomicBoolean
import scala.annotation.tailrec
import scala.collection.JavaConverters._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.control.NonFatal
/**
  * Created by phg on 3/31/21.
 **/
case class GaWorker(schemaService: SchemaClientService, ssdbKVS: SsdbKVS[Long, Boolean], connTimeoutMs: Int, readTimeoutMs: Int, batchSize: Int = 100000)
    extends JobWorker[GaJob]
    with Logging {

  private val APPLICATION_NAME = "Data Insider"
  val isRunning = new AtomicBoolean(true)

  //  private var startTime: Long = 0
  //  private var totalRecords: Long = 0

  override def run(job: GaJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    logger.info(s"${Thread.currentThread().getName}: begin job: $job")
    val startTime = System.currentTimeMillis()
    var totalRecords = 0

    @tailrec
    def sync(assistant: DepotAssistant, pageToken: Option[String] = None): Unit = {
      logger.info(s"sync with pageToken: ${pageToken}")
      // init request with
      //  - viewId
      //  - date ranges
      //  - metrics
      //  - dimensions
      val request: ReportRequest = buildReportRequest(job)

      pageToken.foreach(request.setPageToken)

      // execute batch get with 1 request
      val service = buildGAService(job.accessToken, job.refreshToken)

      val response = service
        .reports()
        .batchGet(
          new GetReportsRequest().setReportRequests(List(request).asJava)
        )
        .execute()

      // expect 1 response report returned, cause we only send 1 request in batch
      response.getReports.asScala.headOption match {
        case Some(report) =>
          // write report using DepotAssistant
          val records: Seq[Record] = extractRecords(report)
          assistant.put(records)

          totalRecords = totalRecords + report.getData.getRowCount

          if (hasNextPage(report) && isRunning.get()) {
            ssdbKVS.get(syncId).map {
              case Some(value) => isRunning.set(value)
              case None =>
            }
            onProgress(
              GaProgress(
                job.orgId,
                syncId,
                job.jobId,
                System.currentTimeMillis(),
                JobStatus.Syncing,
                totalRecords,
                System.currentTimeMillis() - startTime
              )
            )

            // recursive for next page
            sync(assistant, Option(report.getNextPageToken))
          }
        case _ => error("get report fail!")
      }
    }

    try {
      onProgress(
        GaProgress(
          job.orgId,
          syncId,
          job.jobId,
          System.currentTimeMillis(),
          JobStatus.Syncing,
          totalRecords,
          System.currentTimeMillis() - startTime
        )
      )
      val tableSchema: TableSchema = detectTableSchema(job)
      using(MultiDepotAssistant(schemaService, job.destinations, tableSchema)) { depotAssistant =>
        sync(depotAssistant)
      }

      val finalStatus: JobStatus =
        if (isRunning.get()) {
          JobStatus.Synced
        } else {
          JobStatus.Terminated
        }

      GaProgress(
        job.orgId,
        syncId,
        job.jobId,
        System.currentTimeMillis(),
        finalStatus,
        totalRecords,
        System.currentTimeMillis() - startTime
      )
    } catch {
      case NonFatal(ex) =>
        logger.error(s"Sync google analytics error cause ${ex.getLocalizedMessage}", ex)
        GaProgress(
          job.orgId,
          syncId,
          job.jobId,
          System.currentTimeMillis(),
          JobStatus.Error,
          totalRecords,
          System.currentTimeMillis() - startTime,
          message = Some(ex.getMessage)
        )
    } finally {
      ssdbKVS.remove(syncId).asTwitter.syncGet()
    }
  }

  private def hasNextPage(report: Report): Boolean = {
    Option(report.getNextPageToken).isDefined
  }

  private def  buildReportRequest(job: GaJob): ReportRequest = {
    val reportRequest: ReportRequest = new ReportRequest()
      .setViewId(job.viewId)
      .setDateRanges(toDateRanges(job.dateRanges).asJava)
      .setMetrics(toMetrics(job.metrics).asJava)
      .setDimensions(toDimensions(job.dimensions).asJava)
      .setOrderBys(toOrderBys(job.sorts).asJava)
      .setPageSize(batchSize)
    reportRequest
  }

  private def toDateRanges(dateRanges: Array[GaDateRange]): List[DateRange] = {
    dateRanges.map(f => {
        new DateRange()
          .setStartDate(f.startDate)
          .setEndDate(f.endDate)
      })
      .toList
  }

  private def toMetrics(metrics: Array[GaMetric]): List[Metric] = {
    metrics.map(f => {
        new Metric()
          .setExpression(f.expression)
          .setAlias(f.alias)
      })
      .toList
  }

  private def toDimensions(dimensions: Array[GaDimension]): List[Dimension] = {
    dimensions.map(f => {
        new Dimension()
          .setName(f.name)
          .setHistogramBuckets(f.histogramBuckets.map(long2Long).toList.asJava)
      })
      .toList
  }

  private def toOrderBys(sorts: Seq[String]): List[OrderBy] = {
    sorts
      .map(field => {
        if (field.startsWith("-")) {
          new OrderBy()
            .setFieldName(field.substring(1))
            .setSortOrder("DESCENDING")
        } else {
          new OrderBy()
            .setFieldName(field)
            .setSortOrder("ASCENDING")
        }
      })
      .toList
  }

  private def detectTableSchema(job: GaJob): TableSchema = {
    TableSchema(
      dbName = job.destDatabaseName,
      name = job.destTableName,
      organizationId = job.orgId,
      displayName = job.destTableName,
      columns = job.dimensions.map(columnFromDimension) ++ job.metrics.map(columnFromMetric)
    )
  }

  private def columnFromMetric(metric: GaMetric): Column = {
    DepotAssistant
      .ColumnBuilder(metric.alias)
      .setDisplayName(metric.expression)
      .setDataType(metric.dataType)
      .build()
  }

  private def columnFromDimension(dimension: GaDimension): Column = {
    DepotAssistant
      .ColumnBuilder(dimension.name.replaceAll(":", "_")) // convert ga:dimension1 to ga_dimension1
      .setDisplayName(dimension.name)
      .String
      .build()
  }

  private def extractRecords(report: Report): Seq[Record] = {
    //    println(report)
    val rows = report.getData.getRows
    if (null != rows) {
      rows.asScala.map(row => {
        val dimensions: Seq[String] = row.getDimensions.asScala
        val values: Seq[String] = row.getMetrics.asScala.flatMap(_.getValues.asScala)
        dimensions ++ values
      })
    } else Seq()
  }

  private def buildGAService(accessToken: String, refreshToken: String): AnalyticsReporting = {
    val serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
    val credential: Credential = OAuth2CredentialService.buildCredentialFromToken(accessToken, refreshToken, serverEncodedUrl)
    val initializer: HttpRequestInitializer = OAuth2CredentialService.withHttpTimeout(credential, connTimeoutMs, readTimeoutMs)
    new AnalyticsReporting.Builder(
      GoogleNetHttpTransport.newTrustedTransport(),
      JacksonFactory.getDefaultInstance,
      initializer
    ).setApplicationName(APPLICATION_NAME)
      .build()
  }

  def testConnection(job: GaJob): Boolean = {
    val service = this.buildGAService(job.accessToken, job.refreshToken)
    import com.google.api.services.analyticsreporting.v4.model.DateRange
    val dateRange = new DateRange
    dateRange.setStartDate("7DaysAgo")
    dateRange.setEndDate("today");

    val metrics = new Metric().setExpression("ga:sessions").setAlias("sessions")

    val pageTitle = new Dimension().setName("ga:medium")

    val request = new ReportRequest()
      .setViewId(job.viewId)
      .setDateRanges(util.Arrays.asList(dateRange))
      .setMetrics(util.Arrays.asList(metrics))
      .setDimensions(util.Arrays.asList(pageTitle))

    val response = service.reports().batchGet(new GetReportsRequest().setReportRequests(List(request).asJava)).execute()
    response.getReports.asScala.headOption.nonEmpty
  }
}

//name: String,
//dbName: String,
//organizationId: Long,
//displayName: String,
//columns: Seq[Column],
//engine: Option[String] = None,
//primaryKeys: Seq[String] = Seq.empty,
//partitionBy: Seq[String] = Seq.empty,
//orderBys: Seq[String] = Seq.empty
