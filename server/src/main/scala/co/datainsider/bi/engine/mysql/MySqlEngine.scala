package co.datainsider.bi.engine.mysql

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.engine._
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.repository.FileStorage
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.Implicits.async
import co.datainsider.common.client.exception.DbExecuteError
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.util.Future

import java.sql.{ResultSet, ResultSetMetaData}
import scala.collection.mutable.ArrayBuffer

/**
  * created 2023-06-27 2:13 PM
  *
  * @author tvc12 - Thien Vi
  */
class MySqlEngine(
    val client: JdbcClient,
    val connection: MysqlConnection,
    testConnTimeoutMs: Int = 30000,
    insertBatchSize: Int = 100000
) extends Engine {

  private val clazz = getClass.getSimpleName

  override def execute(sql: String, doFormatValues: Boolean): Future[DataTable] =
    Profiler(s"[Engine] $clazz::execute") {
      Future {
        client
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

  override def executeHistogramQuery(histogramSql: String): Future[DataTable] =
    Profiler(s"[Engine] $clazz::executeHistogramQuery") {
      execute(histogramSql)
    }

  override def executeAsDataStream[T](query: String)(fn: DataStream => T): T = {
    Profiler(s"[Engine] $clazz::executeAsDataStream") {
      client.executeQuery(query)(rs => {
        val stream = toStream(rs)
        fn(stream)
      })
    }
  }

  override def getDDLExecutor(): DDLExecutor = {
    new MysqlDDLExecutor(client)
  }

  override def exportToFile(
      sql: String,
      destPath: String,
      fileType: FileType
  ): Future[String] =
    Profiler(s"[Engine] $clazz::exportToFile") {
      async {
        executeAsDataStream(sql)((stream: DataStream) => {
          FileStorage.exportToFile(stream, fileType, destPath)
        })
      }
    }

  override def testConnection(): Future[Boolean] =
    Profiler(s"[Engine] $clazz::testConnection") {
      Future {
        client.testConnection(testConnTimeoutMs)
      }
    }

  override def getSqlParser(): SqlParser = MySqlParser

  override def detectExpressionColumn(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] =
    Profiler(s"[Engine] $clazz::detectExpressionColumn") {
      val query =
        s"""SELECT $newExpr
         |FROM `$dbName`.`$tblName`""".stripMargin

      getDDLExecutor()
        .detectColumns(query)
        .map(columns => {
          columns.headOption match {
            case Some(column) => column
            case None         => throw DbExecuteError(s"fail to detect column for expression: $newExpr")
          }
        })
    }

  override def detectAggregateExpressionColumn(
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

      getDDLExecutor()
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

  override def write(tableSchema: TableSchema, records: Seq[Record]): Future[Int] =
    Profiler(s"[Engine] $clazz::write") {
      Future {
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

  override def beforeClosing(): Unit = {
    client.close()
  }
}
