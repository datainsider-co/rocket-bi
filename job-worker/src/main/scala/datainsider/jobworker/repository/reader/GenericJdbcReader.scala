package datainsider.jobworker.repository.reader

import datainsider.client.domain.schema.TableSchema
import datainsider.jobworker.client.JdbcClient
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.GenericJdbcJob
import datainsider.jobworker.repository.{IncrementalColumnReader, JdbcReader, SimpleReader}
import datainsider.jobworker.util.StringUtils.getOriginTblName
import datainsider.jobworker.util.{JdbcUtils, StringUtils}

import java.sql.{JDBCType, ResultSet}
import scala.collection.mutable.ArrayBuffer

/**
 * Read data from tmp table of clickhouse, data was inserted by clickhouse-jdbc-bridge before
 */
object GenericJdbcReader {
  def apply(client: JdbcClient, job: GenericJdbcJob, batchSize: Int = 1000): JdbcReader = {
    job.incrementalColumn match {
      case Some(incrementalCol) =>
        new IncrementalClickhouseJdbcBridgeReader(
          client,
          job.destDatabaseName,
          job.tableName,
          incrementalCol,
          job.lastSyncedValue,
          batchSize,
          job.query
        )
      case None =>
        new SimpleGenericJdbcReader(
          client,
          job.destDatabaseName,
          job.tableName,
          job.lastSyncedValue.toInt,
          batchSize,
          job.query
        )
    }
  }
}

class BaseGenericJdbcReader(client: JdbcClient, dbName: String, tblName: String) {
  protected def toTableSchema(rs: ResultSet): TableSchema = {
    TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = -1L,
      displayName = getOriginTblName(tblName),
      columns = JdbcUtils.getColumnsFromResultSet(rs)
    )
  }

  protected def toRecords(rs: ResultSet): Seq[Record] = {
    val rows = ArrayBuffer.empty[Record]
    val meta = rs.getMetaData
    while (rs.next()) {
      val row = ArrayBuffer.empty[Any]
      for (i <- 1 to meta.getColumnCount) {
        val columnType: Int = meta.getColumnType(i)
        val item = JDBCType.valueOf(columnType) match {
          case JDBCType.BIT                     => rs.getInt(i)
          case JDBCType.TINYINT                 => rs.getInt(i)
          case JDBCType.SMALLINT                => rs.getInt(i)
          case JDBCType.INTEGER                 => rs.getLong(i)
          case JDBCType.BIGINT                  => rs.getLong(i)
          case JDBCType.FLOAT                   => rs.getFloat(i)
          case JDBCType.REAL                    => rs.getFloat(i)
          case JDBCType.DOUBLE                  => rs.getDouble(i)
          case JDBCType.NUMERIC                 => rs.getLong(i)
          case JDBCType.DECIMAL                 => rs.getLong(i)
          case JDBCType.CHAR                    => rs.getString(i)
          case JDBCType.VARCHAR                 => rs.getString(i)
          case JDBCType.LONGVARCHAR             => rs.getString(i)
          case JDBCType.DATE                    => rs.getDate(i)
          case JDBCType.TIME                    => rs.getTimestamp(i)
          case JDBCType.TIMESTAMP               => rs.getTimestamp(i)
          case JDBCType.BINARY                  => rs.getString(i)
          case JDBCType.VARBINARY               => rs.getString(i)
          case JDBCType.LONGVARBINARY           => rs.getString(i)
          case JDBCType.NULL                    => rs.getString(i)
          case JDBCType.OTHER                   => rs.getString(i)
          case JDBCType.JAVA_OBJECT             => rs.getString(i)
          case JDBCType.DISTINCT                => rs.getString(i)
          case JDBCType.STRUCT                  => rs.getString(i)
          case JDBCType.ARRAY                   => rs.getString(i)
          case JDBCType.BLOB                    => rs.getString(i)
          case JDBCType.CLOB                    => rs.getString(i)
          case JDBCType.REF                     => rs.getString(i)
          case JDBCType.DATALINK                => rs.getString(i)
          case JDBCType.BOOLEAN                 => rs.getBoolean(i)
          case JDBCType.ROWID                   => rs.getString(i)
          case JDBCType.NCHAR                   => rs.getString(i)
          case JDBCType.NVARCHAR                => rs.getString(i)
          case JDBCType.LONGNVARCHAR            => rs.getString(i)
          case JDBCType.NCLOB                   => rs.getString(i)
          case JDBCType.SQLXML                  => rs.getString(i)
          case JDBCType.REF_CURSOR              => rs.getString(i)
          case JDBCType.TIME_WITH_TIMEZONE      => rs.getTimestamp(i)
          case JDBCType.TIMESTAMP_WITH_TIMEZONE => rs.getTimestamp(i)
        }
        row += item
      }
      rows += row
    }
    rows
  }
}

/**
  * simply get data by using sql limit, offset
  * @param client clickhouse client
  * @param dbName name of db
  * @param tblName name of table
  * @param offset last synced offset
  * @param batchSize fetch size
  * @param queryStatement support optional query
  */
class SimpleGenericJdbcReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val offset: Int,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseGenericJdbcReader(client = client, dbName = dbName, tblName = tblName)
    with SimpleReader {

  override def buildGetTotalQuery: String = {
    s"""
       |select count(*) from $dbName.$tblName
       |""".stripMargin
  }

  override def buildNextBatchQuery(curRow: Int): String = {
    s"""
       |select * from $dbName.$tblName limit $batchSize offset $curRow
       |""".stripMargin
  }
}

/**
  * get data incremental
  * @param client mysql client
  * @param dbName name of db
  * @param tblName name of table
  * @param incrementalColName column which always increase or decrease when new record inserted
  * @param lowerBound last synced value of incremental col
  * @param batchSize fetch size
  */
class IncrementalClickhouseJdbcBridgeReader(
    val client: JdbcClient,
    val dbName: String,
    val tblName: String,
    val incrementalColName: String,
    val lowerBound: String,
    val batchSize: Int,
    val queryStatement: Option[String]
) extends BaseGenericJdbcReader(
      client = client,
      dbName = dbName,
      tblName = tblName
    )
    with IncrementalColumnReader {

  override def buildUpperBoundQuery(): String = {
      s"""
         |select $incrementalColName
         |from $dbName.$tblName
         |where $incrementalColName >= ${toValue(lowerBound)}
         |order by $incrementalColName desc
         |limit 1;
         |""".stripMargin
  }

  override def buildQueryByRange(lowerBound: String, upperBound: String): String = {
      s"""
         |select *
         |from $dbName.$tblName
         |where $incrementalColName > ${toValue(lowerBound)} && $incrementalColName <= ${toValue(upperBound)}
         |order by $incrementalColName asc
         |limit $batchSize;
         |""".stripMargin
  }

  override def buildQueryByValue(currentValue: String, offset: Int): String = {
      s"""
           |select *
           |from $dbName.$tblName
           |where $incrementalColName = ${toValue(currentValue)}
           |limit $batchSize
           |offset $offset;
           |""".stripMargin
  }

  private def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+)?([eE]\d+)?$"""
    if (numberRegex matches str) str
    else s"'$str'"
  }
}
