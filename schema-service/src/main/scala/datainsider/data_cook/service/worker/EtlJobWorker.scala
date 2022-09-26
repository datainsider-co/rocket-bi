package datainsider.data_cook.service.worker

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import datainsider.data_cook.domain.EtlJob.ImplicitEtlOperator2Operator
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain._
import datainsider.data_cook.domain.operator.EtlOperator
import datainsider.data_cook.pipeline.operator.{Operator, OperatorResult}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain.TableSchema
import datainsider.profiler.Profiler
import education.x.commons.KVS

import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

class EtlJobWorker(
    jobInfo: JobInfo[EtlJob],
    tableService: EtlTableService,
    reportProgress: (EtlJobProgress) => Future[Unit],
    runningJobMap: KVS[EtlJobId, Boolean],
    implicit val resolver: ExecutorResolver
) extends Runnable
    with Logging {

  protected var startTime: Long = System.currentTimeMillis()
  protected var tableSchemas: ArrayBuffer[TableSchema] = new ArrayBuffer[TableSchema]()
  protected val logMsg = new StringBuffer()

  override def run(): Unit =
    Profiler(s"[EtlWorker] ${getClass.getSimpleName}:run") {
      try {
        logMsg.append(s"execute ELT ${jobInfo.job.displayName} \n")
        startTime = System.currentTimeMillis()
        updateProgress(jobInfo, EtlJobStatus.Running, logMsg.toString).syncGet()
        tableService.dropEtlDatabase(jobInfo.job.organizationId, jobInfo.job.id).syncGet()
        val isRunning = () => runningJobMap.get(jobInfo.job.id).asTwitter.syncGet().getOrElse(false)
        val pipeline: Pipeline = buildPipeline(EtlJob.toProdJob(jobInfo.job), isRunning, reportResult)
        val pipelineResult: PipelineResult = pipeline.execute()
        if (pipelineResult.isSucceed) {
          logMsg.append("execute completed!")
          updateProgress(jobInfo, EtlJobStatus.Done, logMsg.toString, config = pipelineResult.config).syncGet()
        } else {
          logMsg.append(s"execute failure, ${pipelineResult.exception.get.getMessage}")
          updateProgress(jobInfo, EtlJobStatus.Error, logMsg.toString, pipelineResult.operatorError).syncGet()
        }
      } catch {
        case ex: Throwable => {
          error(s"execute job: ${jobInfo.job.id} failure, cause: ${ex.getMessage}", ex)
          logMsg.append(s"execute failure, ${ex.getMessage}")
          updateProgress(jobInfo, EtlJobStatus.Error, logMsg.toString).syncGet()
        }
      } finally {
        try {
          runningJobMap.remove(jobInfo.job.id).asTwitter.syncGet()
          tableService.dropEtlDatabase(jobInfo.job.organizationId, jobInfo.job.id).syncGet()
        } catch {
          case ex: Throwable =>
            // ignore exception
            error(s"remove old data of ${jobInfo.job.id} failure, cause: ${ex.getMessage}", ex)
        }
      }
    }

  def reportResult(operator: Operator, operatorResult: OperatorResult): Unit = {
    val tableSchema = operatorResult.getData[TableSchema]()
    if (tableSchema.isDefined) {
      tableSchemas.append(tableSchema.get)
    }
    logMsg.append(s"+ process ${operator.debugName} success, result ${operatorResult} \n")
    updateProgress(jobInfo, EtlJobStatus.Running, logMsg.toString).syncGet()
  }

  private def updateProgress(
      jobInfo: JobInfo[EtlJob],
      status: EtlJobStatus.Value,
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
