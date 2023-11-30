package co.datainsider.jobworker.repository.reader.mixpanel

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.Using
import co.datainsider.jobworker.client.mixpanel.{ExportRequest, MixpanelClient}
import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.MixpanelJob
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.util.DateTimeUtils
import co.datainsider.jobworker.util.JsonUtils.ImplicitJsonNode
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{Column, Int8Column, StringColumn}
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.util.JsonParser
import kong.unirest.json.JSONObject

import java.nio.file.{Files, Path, Paths}
import scala.collection.mutable.ArrayBuffer
import scala.io.Source
import scala.util.Try

class ExportReader(client: MixpanelClient, projectId: String, job: MixpanelJob, batchSize: Int = 1000) extends Reader {
  private val SAMPLE_SIZE = 50
  private val EVENT_COLUMN_NAME = "event"

  private var lastSyncValue: Option[String] = job.lastSyncedValue
  private var rawRecords: Iterator[String] = _
  private var reader: Source = _
  private var exportPath: Path = _

  init()

  private def init() {
    val request: ExportRequest = buildRequest(projectId, job)
    exportPath = client.`export`(request)
    reader = Source.fromFile(exportPath.toFile)
    rawRecords = reader.getLines()
    lastSyncValue = Some(DateTimeUtils.formatDate(request.toDate))
  }

  private def buildRequest(projectId: String, job: MixpanelJob): ExportRequest = {
    if (isIncrementalMode() && lastSyncValue.isDefined) {
      return ExportRequest(
        projectId = projectId,
        fromDate = DateTimeUtils.parseToDate(lastSyncValue.get).getOrElse(job.dateRange.calculateFromDate()),
        toDate = job.dateRange.calculateToDate()
      )
    } else {
      ExportRequest(
        projectId = projectId,
        fromDate = job.dateRange.calculateFromDate(),
        toDate = job.dateRange.calculateToDate()
      )
    }
  }


  override def hasNext(): Boolean = rawRecords.hasNext

  override def next(columns: Seq[Column]): Seq[Record] = {
    val records = ArrayBuffer.empty[Record]
    while (rawRecords.hasNext && records.size < batchSize) {
      try {
        val line: String = rawRecords.next()
        val jsonNode: JsonNode = JsonParser.fromJson[JsonNode](line)
        records += toRecord(jsonNode, columns)
      } catch {
        case ex: Throwable => // ignore error
      }
    }

    records
  }

  private def toRecord(jsonNode: JsonNode, columns: Seq[Column]): Record = {
    columns.map(column => {
      val rawNode: JsonNode = getRawNode(jsonNode, column.name)
      MixpanelUtil.parseValue(column, rawNode)
    }).toArray
  }

  private def getRawNode(jsonNode: JsonNode, name: String): JsonNode = {
    if (name == EVENT_COLUMN_NAME) {
      jsonNode.at("/event")
    } else {
      jsonNode.at(s"/properties/$name")
    }
  }

  override def detectTableSchema(): TableSchema = {
    val columns = ArrayBuffer.empty[Column]
    columns += StringColumn(EVENT_COLUMN_NAME, EVENT_COLUMN_NAME)
    Using(Source.fromFile(exportPath.toFile))(reader => {
      val sampleRawRecords: Seq[String] = reader.getLines().take(SAMPLE_SIZE).toSeq
      columns.appendAll(getPropertyColumns(sampleRawRecords))
      TableSchema(
        organizationId = job.orgId,
        name = job.destTableName,
        dbName = job.destDatabaseName,
        displayName = job.destTableName,
        columns = columns
      )
    })
  }

  private def getPropertyColumns(sampleRawRecords: Seq[String]): Seq[Column] = {
    val sampleRecords: Seq[JsonNode] = sampleRawRecords.map(line => Try(JsonParser.fromJson[JsonNode](line))).filter(_.isSuccess).map(_.get)
    val groupColumns: Seq[Seq[Column]] = sampleRecords.map(record => {
      val propertyNode: JsonNode = record.at("/properties")
       MixpanelUtil.detectColumns(propertyNode)
    })
    MixpanelUtil.mergeColumns(groupColumns)
  }


  override def close(): Unit = {
    Try(Option(reader).foreach(_.close()))
    Try(Option(exportPath).foreach(path => Files.deleteIfExists(path)))
  }

  /**
   * Get mode of reader, if reader is incremental mode, method getLasSyncValue() will be called
   *
   * @return true if reader is incremental mode, false if reader is full mode
   */
  override def isIncrementalMode(): Boolean = job.syncMode == SyncMode.IncrementalSync

  override def getLastSyncValue(): Option[String] = lastSyncValue
}


