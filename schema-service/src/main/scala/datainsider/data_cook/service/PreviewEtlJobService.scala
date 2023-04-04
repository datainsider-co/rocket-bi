package datainsider.data_cook.service

import com.google.common.cache.{Cache, CacheBuilder}
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, async}
import datainsider.client.domain.query.{ObjectQuery, Query, QueryParser}
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.EtlJob.ImplicitEtlOperator2Operator
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.domain.operator.{EtlOperator, ExpressionFieldConfiguration, FieldConfiguration, NormalFieldConfiguration}
import datainsider.data_cook.domain.request.EtlRequest.PreviewEtlRequest
import datainsider.data_cook.domain.response.{ErrorPreviewETLData, PreviewETLResponse}
import datainsider.data_cook.domain.{EtlInPreviewData, EtlJob, EtlJobStatus, OperatorInfo}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator.{Operator, TableResultOperator}
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain.TableSchema
import datainsider.profiler.Profiler

import java.util.concurrent.TimeUnit
import javax.inject.Named
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.jdk.CollectionConverters.mapAsScalaConcurrentMapConverter

/**
  * @author tvc12 - Thien Vi
  * @created 10/11/2021 - 8:22 PM
  */
trait PreviewEtlJobService {

  def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[PreviewETLResponse]

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

  override def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[PreviewETLResponse] =
    Future.value(PreviewETLResponse(1, EtlJobStatus.Done, None, Array.empty))

  override def listEtlInPreview(): Future[Array[EtlInPreviewData]] = Future.value(Array.empty[EtlInPreviewData])
}

class PreviewEtlJobServiceImpl @Inject() (
    @Named("preview_table_service") tableService: EtlTableService,
    parser: QueryParser,
    @Named("preview_executor_resolver")
    implicit val resolver: ExecutorResolver
) extends PreviewEtlJobService
    with Logging {

  private val expireTime = ZConfig.getLong("data_cook.engine_cache.expire_time_in_second", 1800) // 30m
  private val maxSize = ZConfig.getLong("data_cook.engine_cache.max_size", 500)

  private val previewETLCache: Cache[EtlInPreviewData, EtlInPreviewData] = CacheBuilder
    .newBuilder()
    .expireAfterAccess(expireTime, TimeUnit.SECONDS)
    .maximumSize(maxSize)
    .build[EtlInPreviewData, EtlInPreviewData]()

  /**
    * End session preview
    */
  override def endPreview(organizationId: OrganizationId, id: EtlJobId): Future[Boolean] = {
    previewETLCache.invalidate(id)
    tableService.removeAllTables(organizationId, id)
  }

  override def getDatabaseName(organizationId: OrganizationId, id: EtlJobId): Future[String] = {
    Future.value(tableService.getDbName(organizationId, id))
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

  override def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[PreviewETLResponse] = async {
    if (request.force) {
      clearPreviewData(organizationId, request.id, operators = request.operators).syncGet()
    }
    val result: PreviewETLResponse = executePreview(organizationId, request.toPreviewJob())
    result
  }

  private def clearPreviewData(organizationId: OrganizationId, id: EtlJobId, operators: Array[EtlOperator]): Future[Unit] =
    Profiler(s"[${getClass.getSimpleName}]::clearPreviewData") {
      previewETLCache.invalidate(id)
      val tables: Array[String] = operators.flatMap(EtlOperator.getDestTables)
      tableService
        .removeTables(organizationId, id, tables)
        .rescue {
          case ex: Throwable =>
            logger.error("clearPreviewData::dropEtlDatabase failure", ex)
            Future.False
        }
        .unit
    }

  private def executePreview(organizationId: OrganizationId, job: EtlJob): PreviewETLResponse =  Profiler(s"[${getClass.getSimpleName}]::executePreview") {
      val previewData = EtlInPreviewData(organizationId, job.id)
      previewETLCache.put(previewData, previewData)
      val pipelines: Seq[Pipeline] = job.operators.map(operator => buildPipeline(organizationId, job.id, operator))
      val pipelineResults: Seq[PipelineResult] = pipelines.map(_.execute())
      val previewResponse: PreviewETLResponse = toPreviewETLResponse(previewData, pipelineResults)
      previewResponse
  }

  /**
   * build pipeline from a operator
   */
  private def buildPipeline(organizationId: OrganizationId, id: EtlJobId, operator: EtlOperator): Pipeline = {
    val pipelineBuilder = Pipeline
      .builder()
      .setOrganizationId(organizationId)
      .setJobId(id)

    val operatorInfo: OperatorInfo = Array(operator).toOperatorInfo()

    operatorInfo.connections.foreach {
      case (from: OperatorId, to: OperatorId) => {
        val fromOperator: Operator = operatorInfo.mapOperators(from)
        val toOperator: Operator = operatorInfo.mapOperators(to)
        pipelineBuilder.add(fromOperator, toOperator)
      }
    }

    pipelineBuilder.build()
  }

  private def toPreviewETLResponse(previewData: EtlInPreviewData, pipelineResults: Seq[PipelineResult]): PreviewETLResponse = {
    val tableSchemasMap = mutable.Map.empty[String, TableSchema]
    val errorDataList = ArrayBuffer.empty[ErrorPreviewETLData]
    pipelineResults.foreach(result => {
      tableSchemasMap ++= (getTableSchemaMap(result))

      val errorData: Option[ErrorPreviewETLData] = getErrorPreviewETLData(result)
      if (errorData.isDefined) {
        errorDataList.append(errorData.get)
      }
    })

    if (errorDataList.isEmpty) {
      PreviewETLResponse.success(previewData.etlJobId, tableSchemasMap.values.toArray)
    } else {
      PreviewETLResponse.failure(previewData.etlJobId, tableSchemasMap.values.toArray, errorDataList.toArray)
    }
  }

  private def getTableSchemaMap(pipelineResult: PipelineResult): Map[String, TableSchema] = {
    val tableSchemas: Map[String, TableSchema] = pipelineResult.mapResult.values
      .map(_.getData[TableSchema]())
      .filter(_.isDefined)
      .map(_.get)
      .map(tableSchema => (tableSchema.name, tableSchema))
      .toMap
    tableSchemas
  }

  private def getErrorPreviewETLData(pipelineResult: PipelineResult): Option[ErrorPreviewETLData] = {
    if (pipelineResult.isSucceed) {
      None
    } else {
      val errorTblName: String = pipelineResult.errorOperator match {
        case operator: Option[TableResultOperator] => operator.get.destTableConfiguration.tblName
        case _ => ""
      }
      Some(ErrorPreviewETLData(pipelineResult.exception.get.getMessage, errorTblName))
    }
  }

  override def listEtlInPreview(): Future[Array[EtlInPreviewData]] = {
    val previewEtlData: Array[EtlInPreviewData] = previewETLCache.asMap().asScala.keys.toArray
    Future.value(previewEtlData)
  }
}
