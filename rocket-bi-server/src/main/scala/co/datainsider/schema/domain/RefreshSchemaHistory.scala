package co.datainsider.schema.domain

import co.datainsider.schema.service.StageStatus.StageStatus
import co.datainsider.schema.service.{RefreshSchemaStage, StageStatus}

/**
  * created 2023-06-01 2:49 PM
  *
  * @author tvc12 - Thien Vi
  */

case class RefreshSchemaHistory(
    orgId: Long,
    id: Long = -1,
    isFirstRun: Boolean,
    status: StageStatus = StageStatus.Running,
    stages: Seq[RefreshSchemaStage] = Seq.empty[RefreshSchemaStage],
    createdBy: Option[String] = None,
    updatedBy: Option[String] = None,
    createdTime: Long = System.currentTimeMillis(),
    updatedTime: Long = System.currentTimeMillis()
)
