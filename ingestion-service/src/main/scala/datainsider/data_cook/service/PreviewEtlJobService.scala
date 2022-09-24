package datainsider.data_cook.service

import com.google.common.cache.{Cache, CacheBuilder}
import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.query.{ObjectQuery, Query, QueryParser}
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.EtlJob.ImplicitEtlOperator2Operator
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.domain.operator.{
  EtlOperator,
  ExpressionFieldConfiguration,
  FieldConfiguration,
  NormalFieldConfiguration
}
import datainsider.data_cook.domain.request.EtlRequest.PreviewEtlRequest
import datainsider.data_cook.domain.response.EtlJobStatusResponse
import datainsider.data_cook.domain.{EtlJobStatus, EtlInPreviewData, EtlJob, OperatorInfo}
import datainsider.data_cook.pipeline.operator.Operator
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.service.table.EtlTableService
import datainsider.data_cook.service.table.EtlTableService.getDbName
import datainsider.ingestion.domain.TableSchema
import datainsider.ingestion.domain.Types.TblName
import datainsider.profiler.Profiler

import java.util.concurrent.TimeUnit
import javax.inject.Named
import scala.concurrent.ExecutionContext.Implicits.global
import scala.jdk.CollectionConverters.mapAsScalaConcurrentMapConverter

/**
  * @author tvc12 - Thien Vi
  * @created 10/11/2021 - 8:22 PM
  */
trait PreviewEtlJobService {

  def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[EtlJobStatusResponse]

  /**
    * End session preview
    */
  def endPreview(organizationId: OrganizationId, id: EtlJobId): Future[Boolean]

  /**
    * Get database for preview etl job
    */
  def getDatabaseName(organizationId: OrganizationId, id: EtlJobId): Future[String]

  /**
    * Parse list fields and extra fields to query
    * If failed throw Exception
    */
  def toQuery(
      organizationId: OrganizationId,
      id: EtlJobId,
      fields: Array[NormalFieldConfiguration],
      extraFields: Array[ExpressionFieldConfiguration]
  ): Future[String]

  def listEtlInPreview(): Future[Array[EtlInPreviewData]]
}

class MockPreviewEtlJobService extends PreviewEtlJobService {

  /**
    * End session preview
    */
  override def endPreview(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = Future.True

  override def getDatabaseName(organizationId: OrganizationId, id: EtlJobId): Future[String] = Future.value("123")

  /**
    * Parse list fields and extra fields to query
    * If failed throw Exception
    */
  override def toQuery(
      organizationId: OrganizationId,
      id: EtlJobId,
      fields: Array[NormalFieldConfiguration],
      extraFields: Array[ExpressionFieldConfiguration]
  ): Future[String] = {
    Future.value("select * from analytics.docs")
  }

  override def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[EtlJobStatusResponse] =
    Future.value(EtlJobStatusResponse(1, EtlJobStatus.Done, None, None))

  override def listEtlInPreview(): Future[Array[EtlInPreviewData]] = Future.value(Array.empty[EtlInPreviewData])
}

class PreviewEtlJobServiceImpl @Inject() (
    @Named("preview_table_service") tableService: EtlTableService,
    parser: QueryParser,
    @Named("preview_executor_resolver")
    implicit val resolver: ExecutorResolver
) extends PreviewEtlJobService {

  private lazy val DATABASE_PREFIX = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")
  private val expireTime = ZConfig.getLong("data_cook.engine_cache.expire_time_in_second", 1800) // 30m
  private val maxSize = ZConfig.getLong("data_cook.engine_cache.max_size", 500)

  private val previewEtlCache: Cache[EtlInPreviewData, EtlInPreviewData] = CacheBuilder
    .newBuilder()
    .expireAfterAccess(expireTime, TimeUnit.SECONDS)
    .maximumSize(maxSize)
    .build[EtlInPreviewData, EtlInPreviewData]()

  /**
    * End session preview
    */
  override def endPreview(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = {
    previewEtlCache.invalidate(id)
    tableService.removeAllTables(organizationId, id)
  }

  override def getDatabaseName(organizationId: OrganizationId, id: EtlJobId): Future[String] = {
    Future.value(getDbName(organizationId, id, DATABASE_PREFIX))
  }

  /**
    * Parse list fields and extra fields to query
    * If failed throw Exception
    */
  override def toQuery(
      organizationId: OrganizationId,
      id: EtlJobId,
      fields: Array[NormalFieldConfiguration],
      extraFields: Array[ExpressionFieldConfiguration]
  ): Future[String] = {
    val activeFields: Array[FieldConfiguration] =
      (fields ++: extraFields).filterNot(field => field.isHidden).toArray[FieldConfiguration]
    val objectQuery: Query = ObjectQuery(functions = activeFields.map(_.toSelectFunction))
    val query: String = parser.parse(objectQuery).trim
    Future.value(query)
  }

  private def clearPreviewData(organizationId: OrganizationId, id: EtlJobId, operators: Array[EtlOperator]): Unit =
    Profiler("[PreviewEtlJobServiceImpl]::clearPreviewData") {
      previewEtlCache.invalidate(id)
      val tables: Array[TblName] = operators.flatMap(EtlOperator.getDestTables)
      tableService
        .removeTables(organizationId, id, tables)
        .rescue {
          case ex: Throwable => Future.False
        }
        .syncGet()
    }

  private def buildPipeline(request: PreviewEtlRequest): Pipeline = {
    val job: EtlJob = request.toPreviewJob()

    val pipelineBuilder = Pipeline
      .builder()
      .setOrganizationId(job.organizationId)
      .setJobId(job.id)

    val operatorInfo: OperatorInfo = job.operators.toOperatorInfo()

    operatorInfo.connections.foreach {
      case (from: OperatorId, to: OperatorId) => {
        val fromOperator: Operator = operatorInfo.mapOperators(from)
        val toOperator: Operator = operatorInfo.mapOperators(to)
        pipelineBuilder.add(fromOperator, toOperator)
      }
    }

    pipelineBuilder.build()
  }

  override def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[EtlJobStatusResponse] = {
    try {
      if (request.force) {
        clearPreviewData(organizationId, request.id, request.operators)
      }
      val etlPreviewData = EtlInPreviewData(organizationId, request.id)
      previewEtlCache.put(etlPreviewData, etlPreviewData)
      val pipeline = buildPipeline(request)
      val result: PipelineResult = pipeline.execute()
      val tableSchemas: Array[TableSchema] = result.mapResult.values
        .map(_.getData[TableSchema]())
        .filter(_.isDefined)
        .map(_.get)
        .toArray
      if (result.isSucceed) {
        Future(EtlJobStatusResponse.success(request.id, tableSchemas))
      } else {
        Future(EtlJobStatusResponse.failure(request.id, tableSchemas, result.exception.get, result.operatorError))
      }
    } catch {
      case ex: Throwable => Future(EtlJobStatusResponse.failure(request.id, Array.empty, ex, None))
    }
  }

  override def listEtlInPreview(): Future[Array[EtlInPreviewData]] = {
    val previewEtlData: Array[EtlInPreviewData] = previewEtlCache.asMap().asScala.keys.toArray
    Future.value(previewEtlData)
  }
}
