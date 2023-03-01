package datainsider.jobworker.repository.reader.sqlserver

import datainsider.client.domain.schema.TableSchema
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.repository.JdbcReader

import java.sql.{Connection, ResultSet, Statement}
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * created 2022-11-22 10:28 AM
  *
  * @author tvc12 - Thien Vi
  */
class SqlServerReaderImpl(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val offset: Int,
    val batchSize: Int,
    val queryStatement: Option[String],
    val fetchSize: Int = 1000
) extends BaseSqlServerReader(client = client, dbName = dbName, tblName = tblName)
    with JdbcReader {

  private val SELECT_ALL_SQL = s"""SELECT * FROM "$dbName"."$tblName" """
  private val SELECT_SAMPLE_SQL = s"""SELECT * FROM "$dbName"."$tblName" WHERE 1 != 1"""
  private val SELECT_TOTAL_SQL = s"""SELECT count(1) FROM "$dbName"."$tblName" """

  logger.info(s"${this.getClass.getSimpleName}:: SELECT_ALL_SQL: $SELECT_ALL_SQL")
  logger.info(s"${this.getClass.getSimpleName}:: SELECT_SAMPLE_SQL: $SELECT_SAMPLE_SQL")
  logger.info(s"${this.getClass.getSimpleName}:: SELECT_TOTAL_SQL: $SELECT_TOTAL_SQL")

  private val conn: Connection = client.getConnection()
  conn.setAutoCommit(false)
  conn.setReadOnly(true)

  private val stmt: Statement = conn.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)
  stmt.setFetchSize(fetchSize)

  lazy private val rs: ResultSet = stmt.executeQuery(SELECT_ALL_SQL)

  private var numReadRows: Long = 0
  lazy private val totalRows: Long = getTotal()
  lazy private val (colNames, colTypes) = getColNamesAndTypes()

  override def getTableSchema: TableSchema = {
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTableSchema") {
      client.executeQuery(SELECT_SAMPLE_SQL)(toTableSchema)
    }
  }

  override def next: Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {
      var rowCount: Int = 0
      val rows = ArrayBuffer.empty[Record]

      while (rowCount < batchSize) {
        if (rs.next()) {
          val row: Record = toRecord(rs, colNames, colTypes)
          rows += row
        }

        rowCount += 1
        numReadRows += 1
      }

      rows
    }

  override def hasNext: Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      numReadRows < totalRows
    }

  override def getLastSyncedValue: String =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getLastSyncedValue") {
      numReadRows.toString
    }

  override def closeConnection(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::closeConnection") {
      rs.close()
      stmt.close()
      conn.close()
    }

  private def getTotal(): Long =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTotal") {
      client.executeQuery(SELECT_TOTAL_SQL)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else {
          0
        }
      })
    }

  private def getColNamesAndTypes(): (Array[String], Array[String]) =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getColNamesAndTypes") {
      client.executeQuery(SELECT_SAMPLE_SQL)(getMetaData)
    }
}
