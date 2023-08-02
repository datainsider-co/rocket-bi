package co.datainsider.bi.engine.mysql

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.engine._
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.repository.FileStorage
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.Using
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.util.Future
import datainsider.client.domain.Implicits.async
import datainsider.client.exception.DbExecuteError

import java.sql.{ResultSet, ResultSetMetaData}
import java.util.Properties
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.mapAsJavaMapConverter

/**
  * created 2023-06-27 2:13 PM
  *
  * @author tvc12 - Thien Vi
  */
class MySqlEngine(
    clientManager: ClientManager,
    maxQueryRows: Int = 10000,
    poolSize: Int = 10,
    timeoutMs: Int = 30000,
    insertBatchSize: Int = 100000
) extends Engine[MysqlConnection] {

  private val clazz = getClass.getSimpleName

  def createClient(source: MysqlConnection, poolSize: Int = 10): JdbcClient = {
    val properties = new Properties()
    properties.putAll(source.properties.asJava)
    val client = HikariClient(source.jdbcUrl, source.username, source.password, Some(poolSize), Some(properties))
    client
  }

  def getClient(source: MysqlConnection): JdbcClient = {
    clientManager.get(source)(() => createClient(source, poolSize))
  }

  override def execute(source: MysqlConnection, sql: String, doFormatValues: Boolean): Future[DataTable] =
    Profiler(s"[Engine] $clazz::execute") {
      Future {
        getClient(source)
          .executeQuery(sql)(rs => {
            val (colNames, colTypes) = getColMetaData(rs)
            val records = ArrayBuffer[Array[Object]]()

            while (rs.next()) {
              val record = ArrayBuffer[Object]()
              colNames.foreach(colName => record += rs.getObject(colName))
              records += record.toArray
            }

            DataTable(colNames, colTypes, records.toArray)
          })
      }
    }

  override def executeHistogramQuery(source: MysqlConnection, histogramSql: String): Future[DataTable] =
    Profiler(s"[Engine] $clazz::executeHistogramQuery") {
      execute(source, histogramSql)
    }

  override def getDDLExecutor(source: MysqlConnection): DDLExecutor = {
    val client: JdbcClient = getClient(source)
    new MysqlDDLExecutor(client)
  }

  override def exportToFile(
      source: MysqlConnection,
      sql: String,
      destPath: String,
      fileType: FileType
  ): Future[String] =
    Profiler(s"[Engine] $clazz::exportToFile") {
      async {
        val client: JdbcClient = getClient(source)
        client.executeQuery(sql)(rs => {
          val stream = toStream(rs)
          FileStorage.exportToFile(stream, fileType, destPath)
        })
      }
    }

  override def testConnection(source: MysqlConnection): Future[Boolean] =
    Profiler(s"[Engine] $clazz::testConnection") {
      Future {
        val clientSize = 1
        Using(createClient(source, clientSize))({ client =>
          client.testConnection(timeoutMs)
        })
      }
    }

  override def getSqlParser(): SqlParser = MySqlParser

  override def detectExpressionColumn(
      source: MysqlConnection,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] =
    Profiler(s"[Engine] $clazz::detectExpressionColumn") {
      val query =
        s"""SELECT $newExpr
         |FROM `$dbName`.`$tblName`""".stripMargin

      getDDLExecutor(source)
        .detectColumns(query)
        .map(columns => {
          columns.headOption match {
            case Some(column) => column
            case None         => throw DbExecuteError(s"fail to detect column for expression: $newExpr")
          }
        })
    }

  override def detectAggregateExpressionColumn(
      source: MysqlConnection,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] =
    Profiler(s"[Engine] $clazz::detectAggregateExpressionColumn") {
      val mainExpression: String = getFinalExpr(newExpr)

      val query =
        s"""
         |SELECT '', $mainExpression
         |FROM (
         |  SELECT *
         |  FROM `$dbName`.`$tblName`
         |  WHERE 0 = 1
         |) as T
         |GROUP BY 1
         |""".stripMargin

      getDDLExecutor(source)
        .detectColumns(query)
        .map(columns => {
          columns.lift(1) match {
            case Some(column) => column
            case None         => throw DbExecuteError(s"fail to detect column for aggregate expression: $newExpr")
          }
        })
    }

  private def getFinalExpr(expr: String): String = {
    if (ExpressionUtils.isApplyAllExpr(expr)) {
      ExpressionUtils.getMainExpression(expr)
    } else expr
  }

  private def getColMetaData(rs: ResultSet): (Array[String], Array[String]) = {
    val metadata: ResultSetMetaData = rs.getMetaData
    val colCount = metadata.getColumnCount
    val colNames = ArrayBuffer[String]()
    val colTypes = ArrayBuffer[String]()

    for (i <- 1 to colCount) {
      colNames += metadata.getColumnLabel(i)
      colTypes += metadata.getColumnTypeName(i)
    }

    (colNames.toArray, colTypes.toArray)
  }

  private def toStream(rs: ResultSet): DataStream = {
    val columns: Seq[Column] = MysqlUtils.parseColumns(rs.getMetaData)
    val stream = new Iterator[Record] {
      override def hasNext: Boolean = rs.next()

      override def next(): Record = toRecord(columns, rs)
    }

    DataStream(columns, stream)
  }

  private def toRecord(columns: Seq[Column], rs: ResultSet): Record = {
    columns
      .map(col => {
        try {
          col match {
            case c: BoolColumn      => rs.getBoolean(c.name)
            case c if isInt(c)      => rs.getInt(c.name)
            case c if isLong(c)     => rs.getLong(c.name)
            case c if isDouble(c)   => rs.getDouble(c.name)
            case c if isDate(c)     => rs.getDate(c.name)
            case c if isDateTime(c) => rs.getTimestamp(c.name)
            case c: StringColumn    => rs.getString(c.name)
            case _ @c               => rs.getString(c.name)
          }
        } catch {
          case e: Throwable => null
        }
      })
      .toArray
  }

  private def isInt(column: Column): Boolean = {
    column.isInstanceOf[Int8Column] || column.isInstanceOf[Int16Column] || column.isInstanceOf[Int32Column] ||
    column.isInstanceOf[UInt8Column] || column.isInstanceOf[UInt16Column] || column.isInstanceOf[UInt32Column]
  }

  private def isLong(column: Column): Boolean = {
    column.isInstanceOf[Int64Column] || column.isInstanceOf[UInt64Column]
  }

  private def isDouble(column: Column): Boolean = {
    column.isInstanceOf[DoubleColumn] || column.isInstanceOf[FloatColumn]
  }

  private def isDate(column: Column): Boolean = {
    column.isInstanceOf[DateColumn]
  }

  private def isDateTime(column: Column): Boolean = {
    column.isInstanceOf[DateTimeColumn] || column.isInstanceOf[DateTime64Column]
  }

  override def write(source: MysqlConnection, tableSchema: TableSchema, records: Seq[Record]): Future[Int] =
    Profiler(s"[Engine] $clazz::write") {
      Future {
        val client: JdbcClient = getClient(source)
        val columnDDLs: Seq[String] = tableSchema.columns.map(col => s"""`${col.name}`""")
        val insertQuery =
          s"""
           |INSERT INTO `${tableSchema.dbName}`.`${tableSchema.name}` (${columnDDLs.mkString(", ")})
           |VALUES (${columnDDLs.map(_ => "?").mkString(", ")})
           |""".stripMargin
        records
          .map(MysqlUtils.normalizeToCorrespondingType(tableSchema.columns, _))
          .grouped(insertBatchSize)
          .map(records => client.executeBatchUpdate(insertQuery, records.toArray))
          .sum
      }
    }
}
