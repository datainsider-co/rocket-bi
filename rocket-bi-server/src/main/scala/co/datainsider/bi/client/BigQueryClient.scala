package co.datainsider.bi.client

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.engine.Client
import co.datainsider.bi.engine.bigquery.BigQueryUtils
import co.datainsider.bi.util.Using
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import com.google.cloud.bigquery.JobInfo.WriteDisposition
import com.google.cloud.bigquery.JobStatistics.{LoadStatistics, QueryStatistics}
import com.google.cloud.bigquery.{Option => _, _}
import datainsider.client.exception.InternalError

import java.nio.channels.Channels
import scala.io.Source

class BigQueryClient(val bigquery: BigQuery, maxQueryRows: Int = 10000, defaultTimeoutMs: Long) extends Client {
  def query[T](sql: String, executeTimeoutMs: Option[Long] = None)(converter: TableResult => T): T = {
    try {
      val timeoutMs = executeTimeoutMs.getOrElse(defaultTimeoutMs)
      val queryConfig = QueryJobConfiguration
        .newBuilder(sql)
        .setDryRun(false)
        .setMaxResults(maxQueryRows)
        .setUseQueryCache(true)
        .setAllowLargeResults(true)
        .setJobTimeoutMs(timeoutMs)
        .build()
      val tableResult: TableResult = bigquery.query(queryConfig)
      converter(tableResult)
    } catch {
      case e: Throwable =>
        throw InternalError(s"execute query error, message: ${e.getMessage}, sql: $sql", e)
    }
  }

  /**
    * Run a query in dry run mode and return the schema of the query result.
    * @throws InternalError if detect columns error
    */
  def detectColumns(sql: String, executeTimeoutMs: Option[Long] = None): Seq[Column] = {
    try {
      val timeoutMs = executeTimeoutMs.getOrElse(defaultTimeoutMs)
      val queryConfig = QueryJobConfiguration
        .newBuilder(sql)
        .setDryRun(true)
        .setJobTimeoutMs(timeoutMs)
        .build()
      val job: Job = bigquery.create(JobInfo.of(queryConfig))
      job.getStatistics[JobStatistics] match {
        case queryStatic: QueryStatistics => BigQueryUtils.parseColumns(queryStatic.getSchema)
        case _                            => throw InternalError("Unsupported detect columns result")
      }
    } catch {
      case ex: InternalError => throw ex
      case ex: Throwable     => throw InternalError(s"detect columns error, message: ${ex.getMessage}", ex)
    }
  }

  /**
    * Load a json file to bigquery table. Table must be exists.
    * write data from file path to stream and skip n lines
    * The location must be specified; other fields can be auto-detected.
    * @return the number of rows loaded
    */
  def loadJsonFile(path: String, destDbName: String, destTblName: String, skipNRow: Int = 0): Long = {
    val tableId = TableId.of(destDbName, destTblName)
    val channelConfiguration: WriteChannelConfiguration = WriteChannelConfiguration
      .newBuilder(tableId)
      .setFormatOptions(FormatOptions.json())
      .setWriteDisposition(WriteDisposition.WRITE_APPEND)
      .build
    val jobId = JobId.newBuilder.build
    Using(bigquery.writer(jobId, channelConfiguration))((writer) => {
      Using(Channels.newOutputStream(writer))((stream) => {
        Using(Source.fromFile(path))((source) => {
          source
            .getLines()
            .drop(skipNRow)
            .foreach(line => {
              stream.write((line + "\n").getBytes("UTF-8"))
            })
        })
      })
      // Get load job
      val job: Job = writer.getJob
      val finalJob: Job = job.waitFor()
      val stats: LoadStatistics = finalJob.getStatistics[LoadStatistics]
      stats.getOutputRows
    })
  }

  def write(schema: TableSchema, records: Seq[Record]): Long = {
    val tableId = TableId.of(schema.dbName, schema.name)
    val channelConfiguration: WriteChannelConfiguration = WriteChannelConfiguration
      .newBuilder(tableId)
      .setFormatOptions(FormatOptions.json())
      .setWriteDisposition(WriteDisposition.WRITE_APPEND)
      .build
    val jobId = JobId.newBuilder.build
    Using(bigquery.writer(jobId, channelConfiguration))((writer) => {
      Using(Channels.newOutputStream(writer))(outputStream => {
        val lines = BigQueryUtils.toLines(records, schema)
        lines.foreach(line => {
          outputStream.write((line + "\n").getBytes("UTF-8"))
        })
      })
      // Get load job
      val job: Job = writer.getJob
      val finalJob: Job = job.waitFor()
      val stats: LoadStatistics = finalJob.getStatistics[LoadStatistics]
      stats.getOutputRows
    })
  }

  override def close(): Unit = {}
}
