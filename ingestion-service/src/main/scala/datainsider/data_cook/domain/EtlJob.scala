package datainsider.data_cook.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.client.util.{JsonParser, ZConfig}
import datainsider.data_cook.domain.EtlJobStatus.EtlJobStatus
import datainsider.data_cook.domain.Ids.{EtlJobId, JobHistoryId, OrganizationId}
import datainsider.data_cook.domain.operator._
import datainsider.data_cook.domain.persist._
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator.{GetOperator, JoinConfiguration, Operator, RootOperator}
import datainsider.data_cook.pipeline.{operator => pipeline}
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain.Column

import java.sql.ResultSet
import scala.collection.immutable
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
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
    operators: Array[EtlOperator],
    ownerId: String,
    scheduleTime: ScheduleTime,
    nextExecuteTime: Long,
    @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: EtlJobStatus,
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
  def getIncrementalConfig(destinationConfig: TableConfiguration): Option[IncrementalConfig] = {
    mapIncrementalConfig.get(destinationConfig.tblName)
  }

  def updateIncrementalConfig(destinationConfig: TableConfiguration, newValue: IncrementalConfig): Unit = {
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

    val previewDbName: String = EtlTableService.getDbName(job.organizationId, job.id, previewPrefixDbName)
    val prodDbName: String = EtlTableService.getDbName(job.organizationId, job.id, prefixDbName)

    val jsonJob: String = JsonParser.toJson(job, false)
    val previewJob: String = s"\\b$prodDbName\\b".r.replaceAllIn(jsonJob, previewDbName)
    JsonParser.fromJson[EtlJob](previewJob)
  }

  /**
    * convert preview job to production job
    */
  def toProdJob(job: EtlJob): EtlJob = {

    val previewDbName: String = EtlTableService.getDbName(job.organizationId, job.id, previewPrefixDbName)
    val prodDbName: String = EtlTableService.getDbName(job.organizationId, job.id, prefixDbName)

    val jsonJob: String = JsonParser.toJson(job, false)
    val prodJob: String = s"\\b$previewDbName\\b".r.replaceAllIn(jsonJob, prodDbName)
    JsonParser.fromJson[EtlJob](prodJob)
  }

  implicit class ImplicitEtlOperator2Operator(val etlOperators: Array[EtlOperator]) extends AnyVal {

    def toOperatorInfo(): OperatorInfo = {
      val rootId: OperatorId = 0

      val mapId2Index = mutable.HashMap.empty[Ids.OperatorId, OperatorId]
      val operatorsMap = mutable.HashMap[OperatorId, Operator]((rootId, RootOperator(rootId)))
      val connections = mutable.ArrayBuffer.empty[(OperatorId, OperatorId)]

      var currentIndex = 0

      val getNextId = () => {
        currentIndex += 1
        currentIndex
      }

      val toOperatorId = (id: Ids.OperatorId) => {
        if (!mapId2Index.contains(id)) {
          mapId2Index.put(id, getNextId())
        }
        mapId2Index(id)
      }

      val setConnections: (OperatorId, OperatorId) => Unit = (from: OperatorId, to: OperatorId) => {
        connections.append((from, to))
      }

      etlOperators
        .flatMap(flatten)
        .foreach(etlOperator => {
          val operator: Operator = toOperator(etlOperator, rootId, toOperatorId, setConnections)
          operatorsMap.put(operator.id, operator)
          val operators: Array[Operator] = toOperators(etlOperator.getActionConfigurations(), getNextId)
          operators.foreach(childOperator => {
            operatorsMap.put(childOperator.id, childOperator)
            setConnections(operator.id, childOperator.id)
          })
        })
      OperatorInfo(operatorsMap.toMap, connections.toArray)
    }

    private def flatten(operator: EtlOperator): Array[EtlOperator] = {
      operator match {
        case value: GetDataOperator     => Array(value)
        case value: SQLQueryOperator    => flatten(value.operator) ++ Array(value)
        case value: TransformOperator   => flatten(value.operator) ++ Array(value)
        case value: PivotTableOperator  => flatten(value.operator) ++ Array(value)
        case value: ManageFieldOperator => flatten(value.operator) ++ Array(value)
        case value: JoinOperator => {
          val operators = ArrayBuffer.empty[EtlOperator]
          value.joinConfigs.foreach(join => {
            operators ++= flatten(join.leftOperator)
            operators ++= flatten(join.rightOperator)
          })
          operators += value
          operators.toArray
        }
        case value: SendToGroupEmailOperator => {
          val operators: Array[EtlOperator] = value.operators.flatMap(operator => flatten(operator)).toArray
          operators ++ Array(value)
        }
      }
    }

    private def toOperator(
        etlOperator: EtlOperator,
        rootOperatorId: OperatorId,
        toOperatorId: (Ids.OperatorId) => OperatorId,
        setConnections: (OperatorId, OperatorId) => Unit
    ): Operator = {
      val id: OperatorId = toOperatorId(etlOperator.id)
      etlOperator match {
        case value: GetDataOperator => {
          setConnections(rootOperatorId, id)
          pipeline.GetOperator(id, value.tableSchema, value.destTableConfiguration())
        }
        case value: SQLQueryOperator => {
          val parentId: OperatorId = toOperatorId(value.operator.id)
          setConnections(parentId, id)
          pipeline.SQLOperator(id, value.query, value.destTableConfiguration)
        }
        case value: TransformOperator => {
          val parentId: OperatorId = toOperatorId(value.operator.id)
          setConnections(parentId, id)
          pipeline.TransformOperator(id, value.query, value.destTableConfiguration)
        }
        case value: PivotTableOperator => {
          val parentId: OperatorId = toOperatorId(value.operator.id)
          setConnections(parentId, id)
          pipeline.PivotOperator(id, value.query, value.destTableConfiguration)
        }
        case value: ManageFieldOperator => {
          val parentId: OperatorId = toOperatorId(value.operator.id)
          setConnections(parentId, id)
          pipeline.ManageFieldOperator(id, value.fields, value.destTableConfiguration, value.extraFields)
        }
        case value: JoinOperator => {
          val joinConfigs: Array[JoinConfiguration] = value.joinConfigs.map(config => {
            val leftId: OperatorId = toOperatorId(config.leftOperator.id)
            setConnections(leftId, id)

            val rightId: OperatorId = toOperatorId(config.rightOperator.id)
            setConnections(rightId, id)

            JoinConfiguration(leftId, rightId, config.conditions, config.joinType)
          })
          pipeline.JoinOperator(id, joinConfigs, value.destTableConfiguration)
        }
        case value: SendToGroupEmailOperator => {
          value.operators.foreach(operator => {
            val parentIds: OperatorId = toOperatorId(operator.id)
            setConnections(parentIds, id)
          })
          pipeline.SendGroupEmailOperator(
            id,
            value.receivers,
            value.cc,
            value.bcc,
            value.subject,
            value.fileNames,
            value.content,
            value.displayName,
            value.isZip
          )
        }
      }
    }

    private def toOperators(actions: Array[ActionConfiguration], nextId: () => OperatorId): Array[Operator] = {
      val operators: Array[Operator] = actions.map(_.toOperator(nextId())).toArray
      operators
    }

  }

  implicit class ActionConfiguration2Operator(action: ActionConfiguration) {
    def toOperator(id: OperatorId): Operator =
      action match {
        case action: DwhPersistConfiguration =>
          pipeline.SaveDwhOperator(id, action.dbName, action.tblName, action.`type`, action.displayName)
        case EmailConfiguration(receivers, cc, bcc, subject, fileName, content, displayName) =>
          pipeline.SendEmailOperator(id, receivers, cc, bcc, subject, fileName, content, displayName)
        case action: OracleJdbcPersistConfiguration =>
          pipeline.persist.OraclePersistOperator(
            id,
            action.host,
            action.port,
            action.serviceName,
            action.username,
            action.password,
            action.databaseName,
            action.tableName,
            action.persistType,
            action.sslConfiguration,
            action.sslServerCertDn,
            action.retryCount,
            action.retryDelay
          )
        case action: MySQLJdbcPersistConfiguration =>
          pipeline.persist.MySQLPersistOperator(
            id,
            action.host,
            action.port,
            action.username,
            action.password,
            action.databaseName,
            action.tableName,
            action.persistType
          )
        case action: MsSQLJdbcPersistConfiguration =>
          pipeline.persist.MsSQLPersistOperator(
            id,
            action.host,
            action.port,
            action.username,
            action.password,
            action.catalogName,
            action.databaseName,
            action.tableName,
            action.persistType
          )
        case action: PostgresJdbcPersistConfiguration =>
          pipeline.persist.PostgresPersistOperator(
            id,
            action.host,
            action.port,
            action.username,
            action.password,
            action.catalogName,
            action.databaseName,
            action.tableName,
            action.persistType
          )
        case action: VerticaPersistConfiguration =>
          pipeline.persist.VerticaPersistOperator(
            id = id,
            host = action.host,
            port = action.port,
            username = action.username,
            password = action.password,
            catalog = action.catalog,
            databaseName = action.databaseName,
            tableName = action.tableName,
            persistType = action.persistType,
            sslConfiguration = action.sslConfiguration,
            isLoadBalance = action.isLoadBalance
          )
      }
  }

  implicit class EnhanceImplicitResultSet(val rs: ResultSet) extends AnyVal {
    def toEtlJob: EtlJob = {
      val lastHistoryId = Option(rs.getObject("last_history_id")).map(id => id.toString.toLong)
      val extraData: Option[JsonNode] = Option(rs.getString("extra_data"))
        .map((extraData: String) => JsonParser.fromJson[Map[String, Any]](extraData))
        .map((data: Map[String, Any]) => JsonParser.toNode[JsonNode](data))
      val operators: Array[EtlOperator] = JsonParser.fromJson[Seq[EtlOperator]](rs.getString("operators")).toArray
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
        status = EtlJobStatus.withName(rs.getString("job_status")),
        lastHistoryId = lastHistoryId,
        extraData = extraData,
        operatorInfo =
          Try(JsonParser.fromJson[OperatorInfo](rs.getString("operator_info"))).getOrElse(operators.toOperatorInfo()),
        config = Try(JsonParser.fromJson[EtlConfig](rs.getString("config"))).getOrElse(EtlConfig())
      )
    }
  }
}
