package datainsider.jobworker.repository.reader

import com.google.auth.oauth2.ServiceAccountCredentials
import com.google.cloud.bigquery.{BigQuery, BigQueryOptions, FieldValueList, QueryJobConfiguration}
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{
  BoolColumn,
  Column,
  DateColumn,
  DateTime64Column,
  DoubleColumn,
  Int64Column,
  StringColumn
}
import datainsider.client.exception.DbExecuteError
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.{JdbcJob, JdbcSource}
import datainsider.jobworker.repository.JdbcReader
import datainsider.jobworker.util.{DateTimeUtils, ZConfig}

import java.io.{ByteArrayInputStream, InputStream}
import collection.JavaConverters._
import scala.util.Try

class BigQueryClient(source: JdbcSource) {
  lazy val instance: BigQuery = {
    var credentials: ServiceAccountCredentials = null
    try {
      val serviceAccountStream: InputStream = new ByteArrayInputStream(source.password.getBytes())
      try credentials = ServiceAccountCredentials.fromStream(serviceAccountStream)
      finally if (serviceAccountStream != null) serviceAccountStream.close()
    }

    BigQueryOptions
      .newBuilder()
      .setCredentials(credentials)
      .build()
      .getService
  }

  def executeQuery[T](query: String)(converter: Iterable[FieldValueList] => T): T = {
    try {
      val queryConfig = QueryJobConfiguration.newBuilder(query).setJobTimeoutMs(30000).build
      converter(instance.query(queryConfig).iterateAll().asScala)
    } catch {
      case _: Throwable => throw DbExecuteError(s"error when exec query $query")
    }
  }
}

object BigQueryReader {

  def apply(source: JdbcSource, job: JdbcJob, batchSize: Int): JdbcReader = {
    val bigQuery: BigQuery = new BigQueryClient(source).instance
    job.incrementalColumn match {
      case Some(incrementalCol) =>
        new IncrementalBigQueryReader(
          bigQuery,
          job.databaseName,
          job.tableName,
          incrementalCol,
          job.lastSyncedValue,
          batchSize
        )
      case None =>
        new SimpleBigQueryReader(bigQuery, job.databaseName, job.tableName, job.lastSyncedValue.toInt, batchSize)
    }
  }
}

abstract class AbstractBigQueryReader(bigQuery: BigQuery, dbName: String, tblName: String) extends JdbcReader {

  override def getTableSchema: TableSchema = {
    val nameTypePairs: Seq[(String, String)] = getMetaData
    TableSchema(tblName, dbName, -1L, tblName, toColumns(nameTypePairs))
  }

  protected def toColumns(nameTypePairs: Seq[(String, String)]): Seq[Column] = {
    nameTypePairs.map {
      case (colName, colType) =>
        colType match {
          case t if isLong(t)     => Int64Column(colName, colName, isNullable = true)
          case t if isDouble(t)   => DoubleColumn(colName, colName, isNullable = true)
          case t if isString(t)   => StringColumn(colName, colName, isNullable = true)
          case t if isBoolean(t)  => BoolColumn(colName, colName, isNullable = true)
          case t if isDate(t)     => DateColumn(colName, colName, isNullable = true)
          case t if isDateTime(t) => DateTime64Column(colName, colName, isNullable = true)
          case t if isDecimal(t)  => Int64Column(colName, colName, isNullable = true)
          case _                  => throw new UnsupportedOperationException(s"mysql type not supported: $colType")
        }
    }
  }

  protected def executeQuery[T](query: String)(converter: Iterable[FieldValueList] => T): T = {
    try {
      val queryConfig = QueryJobConfiguration.newBuilder(query).setJobTimeoutMs(30000).build
      converter(bigQuery.query(queryConfig).iterateAll().asScala)
    } catch {
      case e: Throwable => throw DbExecuteError(s"error when exec query $query, reason: $e")
    }
  }

  private def isLong(colType: String): Boolean = colType == "INT64"
  private def isDouble(colType: String): Boolean = colType == "FLOAT64"
  private def isString(colType: String): Boolean = colType == "STRING"
  private def isBoolean(colType: String): Boolean = colType == "BOOL"
  private def isDate(colType: String): Boolean = colType == "DATE"
  private def isDateTime(colType: String): Boolean = colType == "DATETIME"
  private def isDecimal(colType: String): Boolean = colType == "NUMERIC DECIMAL"

  protected def getMetaData: Seq[(String, String)] = {
    val query =
      s"""
         |select * from $dbName.INFORMATION_SCHEMA.COLUMNS
         |where table_schema="$dbName" and table_name = "$tblName";
         |""".stripMargin

    executeQuery(query)(rows =>
      {
        rows.map(row => {
          val colName = row.get("column_name").getStringValue
          val colType = row.get("data_type").getStringValue
          (colName, colType)
        })
      }.toSeq
    )
  }

  protected def toRecords(rows: Iterable[FieldValueList]): Seq[Record] = {
    val nameTypePairs: Seq[(String, String)] = getMetaData
    rows
      .map(row => {
        nameTypePairs.map {
          case (colName, colType) =>
            colType match {
              case t if isLong(t)    => Try(row.get(colName).getLongValue).getOrElse(null)
              case t if isDouble(t)  => Try(row.get(colName).getDoubleValue).getOrElse(null)
              case t if isString(t)  => Try(row.get(colName).getStringValue).getOrElse(null)
              case t if isBoolean(t) => Try(row.get(colName).getBooleanValue).getOrElse(null)
              case t if isDate(t) =>
                val dateStr: String = row.get(colName).getStringValue
                Try(DateTimeUtils.toSqlDate(dateStr)).getOrElse(null)
              case t if isDateTime(t) =>
                val dateTimeStr: String = row.get(colName).getStringValue
                Try(DateTimeUtils.toSqlTimestamp(dateTimeStr)).getOrElse(null)
              case _ => throw new UnsupportedOperationException(s"mysql data type not supported: $colType")
            }
        }
      })
      .toSeq
  }
}

class SimpleBigQueryReader(bigQuery: BigQuery, dbName: String, tblName: String, lowerBound: Int, batchSize: Int)
    extends AbstractBigQueryReader(bigQuery, dbName, tblName) {

  lazy private val total: Int = getTotal

  private var curRow: Int = lowerBound
  private var isBatchEmpty: Boolean = false

  private def getTotal: Int = {
    val query: String =
      s"""
         |select count(*)
         |from $dbName.$tblName;
         |""".stripMargin

    executeQuery(query)(_.head.get(0).getLongValue.toInt)
  }

  override def next: Seq[Record] = {
    val query: String =
      s"""
         |select *
         |from $dbName.$tblName
         |limit $batchSize
         |offset $curRow;
         |""".stripMargin

    val records: Seq[Record] = executeQuery(query)(toRecords)
    if (records.isEmpty) isBatchEmpty = true
    else curRow += records.length
    records
  }

  override def hasNext: Boolean = (curRow < total) && !isBatchEmpty

  override def getLastSyncedValue: String = curRow.toString

  /**
    * close client connection if
    */
  override def closeConnection(): Unit = Unit
}

class IncrementalBigQueryReader(
    bigQuery: BigQuery,
    dbName: String,
    tblName: String,
    incrementalCol: String,
    lowerBound: String,
    batchSize: Int
) extends AbstractBigQueryReader(
      bigQuery = bigQuery,
      dbName = dbName,
      tblName = tblName
    ) {

  lazy private val upperBound: String = getUpperBound
  lazy private val total: Int = getTotal
  lazy private val incIndex: Int = getTableSchema.columns.indexWhere(_.name == incrementalCol)

  private var curRow: Int = 0
  private var lastSyncedValue: String = lowerBound
  private var isBatchEmpty: Boolean = false

  override def next: Seq[Record] = {
    val query =
      s"""
         |select *
         |from $dbName.$tblName
         |where $incrementalCol > ${toValue(lastSyncedValue)} and $incrementalCol <= ${toValue(upperBound)}
         |order by $incrementalCol asc
         |limit $batchSize;
         |""".stripMargin

    val records: Seq[Record] = executeQuery(query)(toRecords)
    if (records.nonEmpty) lastSyncedValue = records.last(incIndex).toString
    else isBatchEmpty = true
    curRow += records.length
    records
  }

  override def hasNext: Boolean = (curRow < total) && !isBatchEmpty

  override def getLastSyncedValue: String = lastSyncedValue

  /**
    *
    * @return return total number of row in range (lowerBound, upperBound]
    */
  private def getTotal: Int = {
    val query =
      s"""
         |select count(*)
         |from $dbName.$tblName
         |where $incrementalCol > ${toValue(lowerBound)} and $incrementalCol <= ${toValue(upperBound)};
         |""".stripMargin

    executeQuery(query)(_.head.get(0).getLongValue.toInt)
  }

  /***
    * return last value >= lowerBound
    * @return
    */
  private def getUpperBound: String = {
    val query =
      s"""
         |select $incrementalCol
         |from $dbName.$tblName
         |where $incrementalCol >= ${toValue(lowerBound)}
         |order by $incrementalCol desc
         |limit 1;
         |""".stripMargin

    executeQuery(query)(_.head.get(0).getStringValue)
  }

  /***
    * check str if str is a number -> don't add quote
    * else (str is string or date) -> add quotes
    * @param str condition value in string
    * @return
    */
  private def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+)?([eE]\d+)?$"""
    if (str.matches(numberRegex)) str
    else s"'$str'"
  }

  /**
    * close client connection if
    */
  override def closeConnection(): Unit = Unit
}
