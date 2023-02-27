package com.ptl.hubspot.deal

import com.fasterxml.jackson.databind.annotation.JsonNaming

/**
 * Created by phuonglam on 2/17/17.
 **/
@JsonNaming
case class DealPipeline(
  displayOrder: Int,
  label: String,
  pipelineId: String = "",
  active: Option[Boolean] = None,
  stages: Seq[DealStage] = Seq()
)

@JsonNaming
case class DealStage(
  displayOrder: Int,
  label: String,
  probability: Double,
  active:Boolean = false,
  closedWon: Boolean = false,
  stageId: String = ""
)
