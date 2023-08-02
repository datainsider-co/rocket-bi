package co.datainsider.datacook.domain.response

import co.datainsider.caas.user_profile.domain.user.UserProfile
import co.datainsider.datacook.domain.ETLStatus.ETLStatus
import co.datainsider.datacook.domain.Ids.{EtlJobId, JobHistoryId}
import co.datainsider.datacook.domain.operator.OldOperator
import co.datainsider.datacook.domain.{EtlConfig, EtlJobStatusRef}
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.ScheduleTime

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 4:07 PM
  */

/**
  * Full info of etl contain owner profile
  * @param id etl id
  * @param displayName display name of etl
  * @param operators operators of etl
  * @param ownerId user name of user
  * @param scheduleTime schedule info of job
  * @param createdTime time create etl
  * @param updatedTime time update etl
  * @param owner short user info of owner
  * @param lastHistoryId last history id of job
  * @param extraData used by front-end
  */
case class EtlJobResponse(
    id: EtlJobId,
    displayName: String,
    operators: Array[OldOperator] = Array.empty,
    ownerId: String,
    scheduleTime: ScheduleTime,
    createdTime: Option[Long] = None,
    updatedTime: Option[Long] = None,
    owner: Option[UserProfile] = None,
    lastHistoryId: Option[JobHistoryId] = None,
    extraData: Option[JsonNode] = None,
    @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: Option[ETLStatus] = None,
    nextExecuteTime: Option[Long] = None,
    lastExecuteTime: Option[Long] = None,
    config: EtlConfig
)
