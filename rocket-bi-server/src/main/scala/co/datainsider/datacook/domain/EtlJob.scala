package co.datainsider.datacook.domain

import co.datainsider.bi.util.ZConfig
import co.datainsider.datacook.domain.ETLStatus.ETLStatus
import co.datainsider.datacook.domain.Ids.{EtlJobId, JobHistoryId, OrganizationId}
import co.datainsider.datacook.domain.operator._
import co.datainsider.datacook.domain.persist._
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.{Operator, OperatorService, RootOperator}
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.client.util.JsonParser

import java.sql.ResultSet
import scala.collection.mutable
import scala.util.Try

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 2:40 PM
  */

/**
  * Info of etl job
  * @param id etl id
  * @param organizationId of etl
  * @param displayName display name of etl
  * @param operators root operator of etl
  * @param ownerId username of owner
  * @param scheduleTime schedule info of job
  * @param createdTime time create etl
  * @param updatedTime time update etl
  * @param lastHistoryId last history id of job
  */
case class EtlJob(
    id: EtlJobId,
    organizationId: OrganizationId,
    displayName: String,
    @deprecated("use operatorInfo instead of")
    operators: Array[OldOperator],
    ownerId: String,
    scheduleTime: ScheduleTime,
    nextExecuteTime: Long,
    @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: ETLStatus,
    lastExecuteTime: Option[Long] = None,
    createdTime: Option[Long] = None,
    updatedTime: Option[Long] = None,
    lastHistoryId: Option[JobHistoryId] = None,
    extraData: Option[JsonNode] = None,
    @JsonIgnore
    operatorInfo: OperatorInfo,
    // key is destination table name
    config: EtlConfig
)

case class EtlConfig(
    mapIncrementalConfig: mutable.Map[String, IncrementalConfig] = mutable.Map.empty
) {

  @JsonIgnore
  def getIncrementalConfig(destinationConfig: DestTableConfig): Option[IncrementalConfig] = {
    mapIncrementalConfig.get(destinationConfig.tblName)
  }

  def updateIncrementalConfig(destinationConfig: DestTableConfig, newValue: IncrementalConfig): Unit = {
    mapIncrementalConfig.put(destinationConfig.tblName, newValue)
  }
}

case class IncrementalConfig(
    columnName: String,
    value: String
)

case class OperatorInfo(
    mapOperators: Map[OperatorId, Operator],
    connections: Array[(OperatorId, OperatorId)]
)

object OperatorInfo {
  def default(): OperatorInfo = {
    OperatorInfo(Map.empty, Array.empty)
  }
}

object EtlJob {
  private val prefixDbName = ZConfig.getString("data_cook.prefix_db_name", "etl")
  private val previewPrefixDbName = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")

  /**
    * convert production to review job
    */
  def toPreviewJob(job: EtlJob): EtlJob = {

    val previewDbName: String = OperatorService.getDbName(job.organizationId, job.id, previewPrefixDbName)
    val prodDbName: String = OperatorService.getDbName(job.organizationId, job.id, prefixDbName)

    val jsonJob: String = JsonParser.toJson(job, false)
    val previewJob: String = s"\\b$prodDbName\\b".r.replaceAllIn(jsonJob, previewDbName)
    JsonParser.fromJson[EtlJob](previewJob)
  }

  /**
    * convert preview job to production job
    */
  def toProdJob(job: EtlJob): EtlJob = {

    val previewDbName: String = OperatorService.getDbName(job.organizationId, job.id, previewPrefixDbName)
    val prodDbName: String = OperatorService.getDbName(job.organizationId, job.id, prefixDbName)

    val jsonJob: String = JsonParser.toJson(job, false)
    val prodJob: String = s"\\b$previewDbName\\b".r.replaceAllIn(jsonJob, prodDbName)
    JsonParser.fromJson[EtlJob](prodJob)
  }

  implicit class ImplicitEtlOperator2Operator(val operators: Array[OldOperator]) extends AnyVal {

    def toOperatorInfo(): OperatorInfo = {
      val rootId: OperatorId = 0

      val oldId2IdMap = mutable.HashMap.empty[Ids.OperatorId, OperatorId]
      val operatorMap = mutable.HashMap[OperatorId, Operator]((rootId, RootOperator(rootId)))
      val connections = mutable.ArrayBuffer.empty[(OperatorId, OperatorId)]

      var currentId: OperatorId = 0

      val nextOperatorId: () => OperatorId = () => {
        currentId += 1
        currentId
      }

      val getOperatorId = (oldId: Ids.OperatorId) => {
        if (!oldId2IdMap.contains(oldId)) {
          oldId2IdMap.put(oldId, nextOperatorId())
        }
        oldId2IdMap(oldId)
      }

      val setConnections = (fromId: OperatorId, toId: OperatorId) => {
        connections.append((fromId, toId))
      }

      operators
        .flatMap(_.getNestedOperators())
        .foreach(oldOperator => {
          val operator: Operator = oldOperator.toOperator(getOperatorId)
          operatorMap.put(operator.id, operator)
          setParentConnections(oldOperator, rootId, getOperatorId, setConnections)
          val operators: Array[Operator] = toOperators(oldOperator.getActionConfigurations(), nextOperatorId)
          operators.foreach(childOperator => {
            operatorMap.put(childOperator.id, childOperator)
            setConnections(operator.id, childOperator.id)
          })
        })
      OperatorInfo(operatorMap.toMap, connections.toArray)
    }

    private def setParentConnections(
        oldOperator: OldOperator,
        rootId: OperatorId,
        getOperatorId: (Ids.OperatorId) => OperatorId,
        setConnections: (OperatorId, OperatorId) => Unit
    ): Unit = {
      val parentOperators: Array[OldOperator] = oldOperator.getParentOperators()
      parentOperators.foreach(parentOperator => {
        val fromId: OperatorId = getOperatorId(parentOperator.id)
        val toId: OperatorId = getOperatorId(oldOperator.id)
        setConnections(fromId, toId)
      })
      if (oldOperator.isInstanceOf[OldGetDataOperator]) {
        setConnections(rootId, getOperatorId(oldOperator.id))
      }
    }

    private def toOperators(actions: Array[ActionConfiguration], nextId: () => OperatorId): Array[Operator] = {
      val operators: Array[Operator] = actions.map(_.toOperator(nextId()))
      operators
    }
  }

  implicit class EnhanceImplicitResultSet(val rs: ResultSet) extends AnyVal {
    def toEtlJob: EtlJob = {
      val lastHistoryId = Option(rs.getObject("last_history_id")).map(id => id.toString.toLong)
      val extraData: Option[JsonNode] = Option(rs.getString("extra_data"))
        .map((extraData: String) => JsonParser.fromJson[Map[String, Any]](extraData))
        .map((data: Map[String, Any]) => JsonParser.toNode[JsonNode](data))
      val operators: Array[OldOperator] = JsonParser.fromJson[Seq[OldOperator]](rs.getString("operators")).toArray
      EtlJob(
        id = rs.getInt("id"),
        organizationId = rs.getLong("organization_id"),
        displayName = rs.getString("display_name"),
        operators = operators,
        ownerId = rs.getString("owner_id"),
        scheduleTime = JsonParser.fromJson[ScheduleTime](rs.getString("schedule_time")),
        createdTime = Option(rs.getLong("created_time")),
        updatedTime = Option(rs.getLong("updated_time")),
        nextExecuteTime = rs.getLong("next_execute_time"),
        lastExecuteTime = Option(rs.getLong("last_execute_time")),
        status = ETLStatus.withName(rs.getString("job_status")),
        lastHistoryId = lastHistoryId,
        extraData = extraData,
        operatorInfo =
          Try(JsonParser.fromJson[OperatorInfo](rs.getString("operator_info"))).getOrElse(operators.toOperatorInfo()),
        config = Try(JsonParser.fromJson[EtlConfig](rs.getString("config"))).getOrElse(EtlConfig())
      )
    }
  }
}
