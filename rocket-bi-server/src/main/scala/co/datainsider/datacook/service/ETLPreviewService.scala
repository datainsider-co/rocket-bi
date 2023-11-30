package co.datainsider.datacook.service

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.query.{ObjectQuery, Query}
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.service.{ConnectionService, QueryExecutor}
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.EtlJob.ImplicitEtlOperator2Operator
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.operator.{ExpressionFieldConfiguration, FieldConfiguration, NormalFieldConfiguration, OldOperator}
import co.datainsider.datacook.domain.request.etl.PreviewEtlRequest
import co.datainsider.datacook.domain.response.{ErrorPreviewETLData, PreviewETLResponse}
import co.datainsider.datacook.domain.{ETLStatus, EtlInPreviewData, EtlJob, OperatorInfo}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.{Operator, OperatorService, TableResultOperator}
import co.datainsider.datacook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema
import com.google.common.cache.{Cache, CacheBuilder}
import com.google.inject.name.Named
import com.twitter.inject.{Injector, Logging}
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, async}
import datainsider.client.util.ZConfig

import java.util.concurrent.TimeUnit
import javax.inject.Inject
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.mapAsScalaConcurrentMapConverter

/**
  * @author tvc12 - Thien Vi
  * @created 10/11/2021 - 8:22 PM
  */
trait ETLPreviewService {

  def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[PreviewETLResponse]

  /**
    * End session preview
    */
  @deprecated("will remove in next release")
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

class ETLPreviewServiceImpl @Inject()(
    @Named("preview_operator_service")
    operatorService: OperatorService,
    @Named("preview_executor_resolver")
    executorResolver: ExecutorResolver,
    queryExecutor: QueryExecutor,
) extends ETLPreviewService
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
    operatorService.removeAllTables(organizationId, id)
  }

  override def getDatabaseName(organizationId: OrganizationId, id: EtlJobId): Future[String] = {
    Future.value(operatorService.getDbName(organizationId, id))
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
    val activeFields: Seq[FieldConfiguration] = (fields ++ extraFields).filterNot(field => field.isHidden)
    val objectQuery: Query = ObjectQuery(functions = activeFields.map(_.toSelectFunction))
    queryExecutor.parseQuery(organizationId, objectQuery)
  }

  override def previewSync(organizationId: OrganizationId, request: PreviewEtlRequest): Future[PreviewETLResponse] =
    async {
      if (request.force) {
        clearPreviewData(organizationId, request.id, operators = request.operators).syncGet()
      }
      val result: PreviewETLResponse = executePreview(organizationId, request.toPreviewJob(), executorResolver)
      result
    }

  private def clearPreviewData(
      organizationId: OrganizationId,
      id: EtlJobId,
      operators: Array[OldOperator]
  ): Future[Unit] =
    Profiler(s"${getClass.getSimpleName}::clearPreviewData") {
      previewETLCache.invalidate(id)
      val tables: Array[String] = operators.flatMap(_.getDestTableNames())
      operatorService
        .removeTables(organizationId, id, tables)
        .rescue {
          case ex: Throwable =>
            logger.error("clearPreviewData::dropEtlDatabase failure", ex)
            Future.False
        }
        .unit
    }

  private def executePreview(
      organizationId: OrganizationId,
      job: EtlJob,
      resolver: ExecutorResolver
  ): PreviewETLResponse =
    Profiler(s"${getClass.getSimpleName}::executePreview") {
      val previewData = EtlInPreviewData(organizationId, job.id)
      previewETLCache.put(previewData, previewData)
      val pipelines: Seq[Pipeline] =
        job.operators.map(operator => buildPipeline(organizationId, job.id, operator)(resolver))
      val pipelineResults: Seq[PipelineResult] = pipelines.map(_.execute())
      val previewResponse: PreviewETLResponse = toPreviewETLResponse(previewData, pipelineResults)
      previewResponse
    }

  /**
    * build pipeline from a operator
    */
  private def buildPipeline(organizationId: OrganizationId, id: EtlJobId, operator: OldOperator)(
      resolver: ExecutorResolver
  ): Pipeline = {
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

    pipelineBuilder.build()(resolver)
  }

  private def toPreviewETLResponse(
      previewData: EtlInPreviewData,
      pipelineResults: Seq[PipelineResult]
  ): PreviewETLResponse = {
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
        case _                                     => ""
      }
      Some(ErrorPreviewETLData(pipelineResult.exception.get.getMessage, errorTblName))
    }
  }

  override def listEtlInPreview(): Future[Array[EtlInPreviewData]] = {
    val previewEtlData: Array[EtlInPreviewData] = previewETLCache.asMap().asScala.keys.toArray
    Future.value(previewEtlData)
  }
}
