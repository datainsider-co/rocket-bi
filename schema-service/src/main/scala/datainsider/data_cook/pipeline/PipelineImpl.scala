package datainsider.data_cook.pipeline

import com.twitter.util.logging.Logging
import datainsider.data_cook.dag.DAG
import datainsider.data_cook.domain.{EtlConfig, IncrementalConfig}
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.pipeline.exception.{OperatorException, PipelineException, TerminatedPipelineException, UnknownPipelineException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator.{Executor, ExecutorContext, Operator, OperatorResult}

import java.util
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

class PipelineImpl private[pipeline] (
   organizationId: OrganizationId,
   jobId: EtlJobId,
   operatorIdStack: util.Stack[OperatorId],
   operatorsMap: Map[OperatorId, Operator],
   isRunning: () => Boolean,
   reportResult: (Operator, OperatorResult) => Unit,
   config: EtlConfig,
)(resolver: ExecutorResolver)
    extends Pipeline
    with Logging {


  override def execute(): PipelineResult = {
    val resultsMap = mutable.HashMap.empty[OperatorId, OperatorResult]
    val newConfig: EtlConfig = config.copy()
    try {
      while (!operatorIdStack.empty()) {
        val operatorId: Int = operatorIdStack.pop()
        val operator: Operator = operatorsMap(operatorId)
        info(s"execute:: operator ${operatorId}")
        try {
          if (isRunning()) {
            val executor: Executor[Operator] = resolver.getExecutor(operator)
            val context = ExecutorContext(organizationId, jobId, resultsMap, newConfig)
            val operatorResult: OperatorResult = executor.process(operator, context)
            resultsMap.put(operatorResult.id, operatorResult)
            reportResult(operator, operatorResult)
          } else {
            return PipelineResult.failure(resultsMap, TerminatedPipelineException("terminate pipeline"), Some(operator))
          }
        } catch {
          case ex: OperatorException => {
            logger.error(s"execute: ${operator} failed, cause ${ex.getMessage}", ex)
            return PipelineResult.failure(resultsMap, ex, Some(operator))
          }
        }
      }
      return PipelineResult.success(resultsMap, newConfig)
    } catch {
      case ex: Throwable =>
        logger.error(ex.getMessage, ex)
        return PipelineResult.failure(resultsMap, UnknownPipelineException(ex.getMessage), None)
    }
  }
}

class DagPipelineBuilder() {

  private val edges = ArrayBuffer.empty[(OperatorId, OperatorId)]
  private val operatorsMap = mutable.HashMap.empty[OperatorId, Operator]
  private var organizationId: Option[OrganizationId] = None
  private var jobId: Option[EtlJobId] = None
  private var isRunning: () => Boolean = () => true
  private var reportResult: (Operator, OperatorResult) => Unit = (Operator, OperatorResult) => Unit
  private var config: EtlConfig = EtlConfig()

  def add(fromOperator: Operator, toOperator: Operator): DagPipelineBuilder = {
    operatorsMap.put(fromOperator.id, fromOperator)
    operatorsMap.put(toOperator.id, toOperator)
    toOperator.addParents(fromOperator)
    edges.append((fromOperator.id, toOperator.id))
    this
  }

  def add(fromOperators: Array[Operator], toOperator: Operator): DagPipelineBuilder = {
    toOperator.addParents(fromOperators: _*)
    fromOperators.foreach(fromOperator => edges.append((fromOperator.id, toOperator.id)))
    this
  }

  def setOrganizationId(orgId: OrganizationId): DagPipelineBuilder = {
    organizationId = Option(orgId)
    this
  }

  def setJobId(jobId: EtlJobId): DagPipelineBuilder = {
    this.jobId = Option(jobId)
    this
  }

  def setIsRunning(isRunning: () => Boolean): DagPipelineBuilder = {
    this.isRunning = isRunning
    this
  }

  def setReportResult(reportResult: (Operator, OperatorResult) => Unit): DagPipelineBuilder = {
    this.reportResult = reportResult
    this
  }

  def setConfig(config: EtlConfig): DagPipelineBuilder = {
    this.config = config
    this
  }

  @throws[PipelineException]
  def build()(implicit resolver: ExecutorResolver): Pipeline = {
    val dag: DAG = new DAG(operatorsMap.size)
    edges.foreach {
      case (from: OperatorId, to: OperatorId) =>
        dag.addEdge(from, to)
    }
    if (dag.isCyclic) {
      throw new PipelineException("pipeline has a cycle")
    }

    if (organizationId.isEmpty) {
      throw new PipelineException("organization id is required")
    }

    if (jobId.isEmpty) {
      throw new PipelineException("job id is required")
    }

    new PipelineImpl(
      organizationId.get,
      jobId.get,
      dag.topoSort(),
      operatorsMap.toMap,
      isRunning,
      reportResult,
      config
    )(resolver)
  }
}
