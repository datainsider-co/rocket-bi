package co.datainsider.bi.engine.vertica

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.client.{HikariClient, JdbcClient, NativeJdbcClientWithProperties}
import co.datainsider.bi.engine.{ClientManager, _}
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.repository.FileStorage
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.{Implicits, Using}
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column.getCustomClassName
import co.datainsider.schema.domain.column._
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.util.Future
import datainsider.client.exception.DbExecuteError

import java.sql.ResultSet
import java.util.Properties
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.mapAsJavaMapConverter

/**
  * created 2023-07-18 4:11 PM
  *
  * @author tvc12 - Thien Vi
  */
class VerticaEngine(
    clientManager: ClientManager,
    clientSize: Int = 10,
    timeoutMs: Int = 30000,
    insertBatchSize: Int = 100000
) extends Engine[VerticaConnection] {
  private val clazz = getClass.getSimpleName
  def createClient(source: VerticaConnection, clientSize: Int = 10): JdbcClient = {
    val properties = new Properties()
    properties.put("Label", s"jdbc-from-rocket-bi")
    properties.putAll(source.properties.asJava)
    HikariClient(source.jdbcUrl, source.username, source.password, Some(clientSize), Some(properties))
  }

  private def getClient(source: VerticaConnection): JdbcClient =
    clientManager.get(source)(() => createClient(source, clientSize))

  override def execute(source: VerticaConnection, sql: String, doFormatValues: Boolean): Future[DataTable] =
    Profiler(s"[Engine] $clazz::execute") {
      Future {
        getClient(source)
          .executeQuery(sql)(rs => {
            val columns: Array[Column] = VerticaUtils.parseColumns(rs.getMetaData).toArray
            val records = ArrayBuffer[Array[Object]]()

            while (rs.next()) {
              val record = ArrayBuffer[Object]()
              columns.foreach(column => record += rs.getObject(column.name))
              records += record.toArray
            }

            DataTable(columns.map(_.name), columns.map(getCustomClassName), records.toArray)
          })
      }
    }

  override def executeHistogramQuery(source: VerticaConnection, histogramSql: String): Future[DataTable] =
    execute(source, histogramSql)

  override def getDDLExecutor(source: VerticaConnection): DDLExecutor = {
    val client: JdbcClient = getClient(source)
    new VerticaDDLExecutor(client, source.catalog)
  }

  override def exportToFile(
      source: VerticaConnection,
      sql: String,
      destPath: String,
      fileType: FileType
  ): Future[String] =
    Implicits.async {
      Profiler(s"[Engine] $clazz::exportToFile") {
        getClient(source).executeQuery(sql)((rs: ResultSet) => {
          val stream = toStream(rs)
          FileStorage.exportToFile(stream, fileType, destPath)
        })
      }
    }

  private def toStream(rs: ResultSet): DataStream = {
    val columns: Seq[Column] = VerticaUtils.parseColumns(rs.getMetaData)
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
            case c: BoolColumn       => rs.getBoolean(c.name)
            case c: Int8Column       => rs.getLong(c.name)
            case c: Int16Column      => rs.getLong(c.name)
            case c: Int32Column      => rs.getLong(c.name)
            case c: Int64Column      => rs.getLong(c.name)
            case c: UInt8Column      => rs.getLong(c.name)
            case c: UInt16Column     => rs.getLong(c.name)
            case c: UInt32Column     => rs.getLong(c.name)
            case c: UInt64Column     => rs.getLong(c.name)
            case c: FloatColumn      => rs.getDouble(c.name)
            case c: DoubleColumn     => rs.getDouble(c.name)
            case c: DateColumn       => rs.getDate(c.name)
            case c: DateTimeColumn   => rs.getTimestamp(c.name)
            case c: DateTime64Column => rs.getTimestamp(c.name)
            case c: StringColumn     => rs.getString(c.name)
            case _ @c                => rs.getString(c.name)
          }
        } catch {
          case e: Throwable => null
        }
      })
      .toArray
  }

  override def testConnection(source: VerticaConnection): Future[Boolean] =
    Profiler(s"[Engine] $clazz::testConnection") {
      Future {
        Using(createClient(source, 1)) { client =>
          client.testConnection(timeoutMs)
        }
      }
    }

  override def getSqlParser(): SqlParser = VerticaParser

  override def detectExpressionColumn(
      source: VerticaConnection,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] =
    Profiler(s"[Engine] $clazz::detectExpressionColumn") {

      val query =
        s"""SELECT $newExpr
         |FROM "$dbName"."$tblName"""".stripMargin

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
      source: VerticaConnection,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] = {
    val mainExpression: String = getFinalExpr(newExpr)

    val query =
      s"""
         |SELECT '', $mainExpression
         |FROM (
         |  SELECT *
         |  FROM "$dbName"."$tblName"
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

  override def write(source: VerticaConnection, tableSchema: TableSchema, records: Seq[Record]): Future[Int] =
    Profiler(s"[Engine] $clazz::write") {
      Future {
        val client: JdbcClient = getClient(source)
        val columnDDLs: Seq[String] = tableSchema.columns.map(col => s""""${col.name}"""")
        val insertQuery =
          s"""
           |INSERT INTO "${tableSchema.dbName}"."${tableSchema.name}" (${columnDDLs.mkString(", ")})
           |VALUES (${columnDDLs.map(_ => "?").mkString(", ")})
           |""".stripMargin
        records
          .map(VerticaUtils.normalizeToCorrespondingType(tableSchema.columns, _))
          .grouped(insertBatchSize)
          .map(records => client.executeBatchUpdate(insertQuery, records.toArray))
          .sum
      }
    }
}
