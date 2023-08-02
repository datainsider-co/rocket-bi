package co.datainsider.datacook.pipeline

import co.datainsider.datacook.domain.EtlConfig
import co.datainsider.datacook.pipeline.exception.PipelineException
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.{Operator, OperatorResult}

import scala.collection.mutable

trait Pipeline {
  def execute(): PipelineResult
}

object Pipeline {
  def builder(): DagPipelineBuilder = {
    new DagPipelineBuilder()
  }
}

case class PipelineResult(
    isSucceed: Boolean,
    mapResult: Map[OperatorId, OperatorResult],
    // updated config, if isSucceed is true always is Some(EtlConfig)
    config: Option[EtlConfig] = None,
    /**
      * If isSucceed is false, this field is Some(PipelineException)
      */
    exception: Option[PipelineException],
    /**
      * If isSucceed is false, this field can be empty
      */
    errorOperator: Option[Operator]
)

object PipelineResult {

  def success(mapResult: mutable.HashMap[OperatorId, OperatorResult], newConfig: EtlConfig): PipelineResult = {
    PipelineResult(true, mapResult.toMap, Some(newConfig), None, None)
  }

  def failure(
      mapResult: mutable.HashMap[OperatorId, OperatorResult],
      ex: PipelineException,
      operatorError: Option[Operator]
  ): PipelineResult = {
    PipelineResult(false, mapResult.toMap, None, Some(ex), operatorError)
  }

}
