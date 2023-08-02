package co.datainsider.jobworker.repository.reader.sqlserver

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.repository.JdbcReader
import co.datainsider.schema.domain.TableSchema

import java.sql.{Connection, ResultSet, Statement}
import scala.collection.mutable.ArrayBuffer

/**
  * created 2022-11-22 11:02 AM
  *
  * @author tvc12 - Thien Vi
  */
class IncrementalSqlServerReader2(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val incrementalColName: String,
    val lowerBound: String,
    val batchSize: Int,
    val queryStatement: Option[String],
    val fetchSize: Int = 1000
) extends BaseSqlServerReader(client = client, dbName = dbName, tblName = tblName)
    with JdbcReader {

  private val SELECT_INCREMENTAL_SQL =
    s"""
       |SELECT * FROM "$dbName"."$tblName"
       |WHERE "$incrementalColName" > ${toValue(lowerBound)}
       |ORDER BY "$incrementalColName"
       |""".stripMargin

  private val SELECT_SAMPLE_SQL = s"""SELECT * FROM "$dbName"."$tblName" WHERE 1 != 1"""
  private val SELECT_TOTAL_SQL =
    s"""
       |SELECT count(1) FROM "$dbName"."$tblName"
       |WHERE "$incrementalColName" > ${toValue(lowerBound)}
       |""".stripMargin

  private val conn: Connection = client.getConnection()
  conn.setAutoCommit(false)
  conn.setReadOnly(true)

  private val stmt: Statement = conn.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)
  stmt.setFetchSize(fetchSize)

  lazy private val rs: ResultSet = stmt.executeQuery(SELECT_INCREMENTAL_SQL)

  private var numReadRows: Long = 0
  private var lastReadValue: String = lowerBound
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
        lastReadValue = rs.getString(incrementalColName)
      }

      rows
    }

  override def hasNext: Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      numReadRows < totalRows
    }

  override def getLastSyncedValue: String =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getLastSyncedValue") {
      lastReadValue
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

  /** *
    * check str if str is a number -> don't add quote
    * else (str is string or date) -> add quotes
    *
    * @param str condition value in string
    * @return
    */
  private def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+)?([eE]\d+)?$"""
    if (numberRegex matches str) str
    else s"'$str'"
  }
}
