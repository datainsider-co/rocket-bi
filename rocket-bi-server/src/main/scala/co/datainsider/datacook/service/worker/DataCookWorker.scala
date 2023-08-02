package co.datainsider.datacook.service.worker

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.EtlJob.ImplicitEtlOperator2Operator
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain._
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.{Operator, OperatorResult, OperatorService}
import co.datainsider.datacook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import education.x.commons.KVS

import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

class DataCookWorker(
    jobInfo: JobInfo[EtlJob],
    tableService: OperatorService,
    reportProgress: (EtlJobProgress) => Future[Unit],
    runningJobMap: KVS[EtlJobId, Boolean],
    implicit val resolver: ExecutorResolver
) extends Runnable
    with Logging {

  protected var startTime: Long = System.currentTimeMillis()
  protected var tableSchemas: ArrayBuffer[TableSchema] = new ArrayBuffer[TableSchema]()
  protected val msg = new StringBuffer()

  override def run(): Unit =
    Profiler(s"[EtlWorker] ${getClass.getSimpleName}:run") {
      try {
        msg.append(s"execute ELT ${jobInfo.job.displayName} \n")
        startTime = System.currentTimeMillis()
        updateProgress(jobInfo, ETLStatus.Running, msg.toString).syncGet()
        clearEtlData(jobInfo.job.organizationId, jobInfo.job.id)
        val isRunning = () => runningJobMap.get(jobInfo.job.id).asTwitter.syncGet().getOrElse(false)
        val pipeline: Pipeline = buildPipeline(EtlJob.toProdJob(jobInfo.job), isRunning, reportResult)
        val pipelineResult: PipelineResult = pipeline.execute()
        if (pipelineResult.isSucceed) {
          msg.append("execute completed!")
          updateProgress(jobInfo, ETLStatus.Done, msg.toString, config = pipelineResult.config).syncGet()
        } else {
          msg.append(s"execute failure, ${pipelineResult.exception.get.getMessage}")
          updateProgress(jobInfo, ETLStatus.Error, msg.toString, pipelineResult.errorOperator).syncGet()
        }
      } catch {
        case ex: Throwable => {
          error(s"execute job: ${jobInfo.job.id} failure, cause: ${ex.getMessage}", ex)
          msg.append(s"execute failure, ${ex.getMessage}")
          updateProgress(jobInfo, ETLStatus.Error, msg.toString).syncGet()
        }
      } finally {
        try {
          runningJobMap.remove(jobInfo.job.id).asTwitter.syncGet()
          clearEtlData(jobInfo.job.organizationId, jobInfo.job.id)
        } catch {
          case ex: Throwable =>
            // ignore exception
            error(s"remove old data of ${jobInfo.job.id} failure, cause: ${ex.getMessage}", ex)
        }
      }
    }

  private def clearEtlData(organizationId: OrganizationId, jobId: Long): Unit = {
    try {
      tableService.dropETLDatabase(organizationId, jobId).syncGet()
    } catch {
      case ex: Throwable =>
        error(s"drop etl database of ${jobInfo.job.id} failure, cause: ${ex.getMessage}", ex)
    }
  }

  def reportResult(operator: Operator, operatorResult: OperatorResult): Unit = {
    val tableSchema = operatorResult.getData[TableSchema]()
    if (tableSchema.isDefined) {
      tableSchemas.append(tableSchema.get)
    }
    msg.append(s"+ process ${operator.debugName} success, result ${operatorResult} \n")
    updateProgress(jobInfo, ETLStatus.Running, msg.toString).syncGet()
  }

  private def updateProgress(
      jobInfo: JobInfo[EtlJob],
      status: ETLStatus.Value,
      message: String,
      operatorError: Option[Operator] = None,
      config: Option[EtlConfig] = None
  ): Future[Unit] = {
    val jobProgress: EtlJobProgress = EtlJobProgress(
      organizationId = jobInfo.job.organizationId,
      historyId = jobInfo.historyId,
      jobId = jobInfo.job.id,
      startTime = startTime,
      totalExecutionTime = System.currentTimeMillis() - startTime,
      status = status,
      message = Some(message),
      operatorError = operatorError,
      tableSchemas = tableSchemas.toSet.toArray,
      config = config
    )
    reportProgress(jobProgress)
  }

  private def buildPipeline(
      job: EtlJob,
      isRunning: () => Boolean,
      reportResult: (Operator, OperatorResult) => Unit
  ): Pipeline = {
    val pipelineBuilder = Pipeline
      .builder()
      .setOrganizationId(job.organizationId)
      .setJobId(job.id)
      .setIsRunning(isRunning)
      .setConfig(job.config)
      .setReportResult(reportResult)

    // fixme: use job.operatorInfo instead of job.operators
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
}
