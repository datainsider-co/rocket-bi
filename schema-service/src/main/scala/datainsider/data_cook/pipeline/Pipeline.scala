package datainsider.data_cook.pipeline

import datainsider.data_cook.domain.EtlConfig
import datainsider.data_cook.pipeline.exception.PipelineException
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator.{Operator, OperatorResult}

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
    exception: Option[PipelineException],
    operatorError: Option[Operator]
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
