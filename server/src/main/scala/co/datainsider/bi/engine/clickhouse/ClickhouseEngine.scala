package co.datainsider.bi.engine.clickhouse

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine._
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.Implicits.async
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.{DateTimeFormatter, DoubleFormatter, Using}
import co.datainsider.common.client.exception.{DbExecuteError, InternalError}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.schema.misc.ColumnDetector.RawColumnData
import co.datainsider.schema.misc.{ClickHouseDDLConverter, ClickHouseUtils, ColumnDetector}
import co.datainsider.schema.repository._
import com.twitter.inject.Logging
import com.twitter.util.Future
import org.apache.poi.ss.usermodel.{CellStyle, CreationHelper}
import org.apache.poi.xssf.streaming.{SXSSFCell, SXSSFRow, SXSSFSheet, SXSSFWorkbook}

import java.io.FileOutputStream
import java.sql.{ResultSet, ResultSetMetaData, SQLException}
import scala.collection.mutable.ArrayBuffer
import scala.sys.process.{Process, ProcessLogger}

case class DataTable(
    headers: Array[String],
    colTypes: Array[String],
    records: Array[Array[Object]],
    isGroupCols: Array[Boolean] = Array.empty,
    formatterKeys: Array[String] = Array.empty
)

final class ClickhouseEngine(
    val client: JdbcClient,
    val connection: ClickhouseConnection,
    maxQueryRows: Int = 10000,
    testConnTimeoutMs: Int = 30000 // 30s
) extends Engine
    with Logging {

  private val clazz: String = this.getClass.getSimpleName

  /**
    * Return data are 2d array, arranged in row manner (just like result from normal sql execution)
    * First row of matrix (array[0][_]) are column names
    * The rest are row data from sql (array[1][_]...array[n][_])
    */
  override def execute(sql: String, doFormatValues: Boolean = true): Future[DataTable] =
    Profiler(s"[Engine] $clazz::execute") {
      async {
        try {
          client
            .executeQuery(sql)(rs => {
              val (colNames, colTypes) = getColMetaData(rs)
              val rows = ArrayBuffer[Array[Object]]()
              while (rs.next()) {
                require(rows.length <= maxQueryRows, s"result table exceeds $maxQueryRows rows limit")

                val row = ArrayBuffer[Object]()
                colNames.zip(colTypes).foreach {
                  case (colName, colType) =>
                    if (colType.startsWith("Array")) {
                      if (colType.contains("Tuple")) {
                        row += rs.getObject(colName, classOf[java.util.List[String]])
                      } else {
                        row += rs.getString(colName)
                      }
                    } else {
                      val rawValue = rs.getObject(colName)

                      val finalValue = if (doFormatValues) {
                        formatValue(rawValue, colType)
                      } else rawValue

                      row += finalValue
                    }
                  case _ =>
                }
                rows += row.toArray
              }
              DataTable(colNames, colTypes, rows.toArray)
            })
        } catch {
          case e: SQLException => throw DbExecuteError(s"execute sql '$sql' failed with exception: ${e.getMessage}", e)
          case e: Throwable    => throw InternalError(s"engine.execute failed with exception: ${e.getMessage}", e)
        }
      }.rescue {
        case e: Throwable => throw e
      }
    }

  override def executeAsDataStream[T](query: String)(fn: DataStream => T): T =
    Profiler(s"[Engine] $clazz::executeAsDataStream") {
      client.executeQuery(query)(rs => {
        val columns: Seq[Column] = parseColumns(rs.getMetaData)

        val it = new Iterator[Record] {
          override def hasNext: Boolean = rs.next()

          override def next(): Record = {
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
        }
        fn(DataStream(columns, it))
      })
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

  private def parseColumns(metaData: ResultSetMetaData): Seq[Column] = {
    val columns = ArrayBuffer[Column]()
    val columnCount: Int = metaData.getColumnCount
    for (i <- 1 to columnCount) {
      val columnName: String = metaData.getColumnName(i)
      val isNullable: Boolean = metaData.isNullable(i) == ResultSetMetaData.columnNullable
      val columnData = RawColumnData(
        name = columnName,
        displayName = columnName,
        idType = metaData.getColumnType(i),
        isNullable = isNullable
      )
      columns += ColumnDetector.createColumn(columnData);
    }
    columns
  }

  override def executeHistogramQuery(histogramSql: String): Future[DataTable] =
    Profiler(s"[Engine] $clazz::executeHistogramQuery") {
      async {
        try {
          client
            .executeQuery(histogramSql)(rs => {
              val colNames = Array("lower_bound", "upper_bound", "value")
              val colTypes = Array("Float64", "Float64", "Float64")
              val rows = ArrayBuffer[Array[Object]]()
              while (rs.next()) {
                val histogramArr = rs.getArray(1).getArray.asInstanceOf[Array[Object]]

                histogramArr.foreach(arr => {
                  val javaList = arr.asInstanceOf[java.util.ArrayList[Double]]

                  val lower = javaList.get(0).asInstanceOf[Object]
                  val upper = javaList.get(1).asInstanceOf[Object]
                  val value = javaList.get(2).asInstanceOf[Object]

                  rows += Array(lower, upper, value)
                })
              }
              DataTable(colNames, colTypes, rows.toArray)
            })
        } catch {
          case _: DbExecuteError => throw DbExecuteError(s"fail to execute histogram query")
        }
      }.rescue {
        case e: Throwable => throw e
      }
    }

  override def getDDLExecutor(): DDLExecutor = {
    val handler: ClickhouseMetaDataHandler = new ClickhouseMetaDataHandlerImpl(client)
    if (connection.clusterName.isEmpty || connection.clusterName.get.isEmpty) {
      NonClusteredDDLExecutor(client, handler)
    } else {
      ClusteredDDLExecutor(client, connection.clusterName.get, handler)
    }
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

  /**
    * pre format data, useful for making additional where condition (i.e: compare values for group query)
    */
  private def formatValue(value: Object, colType: String): Object = {
    if (value != null) {
      colType.toLowerCase match {
        case t if isDateTime(t)   => DateTimeFormatter.format(value)
        case t if isDoubleType(t) => DoubleFormatter.format(value)
        case _                    => value
      }
    } else null
  }

  private def isDoubleType(colType: String): Boolean = {
    colType.toLowerCase.contains("float")
  }

  private def isDateTime(colType: String): Boolean = {
    colType.toLowerCase.contains("datetime")
  }

  private def isArray(colType: String): Boolean = {
    """Array\(\w*\)""".r.findFirstMatchIn(colType).isDefined
  }

  private def isNumber(colType: String): Boolean = {
    colType.toLowerCase.contains("float") || colType.toLowerCase.contains("int")
  }

  override def exportToFile(
      sql: String,
      destPath: String,
      fileType: FileType
  ): Future[String] = {
    fileType match {
      case FileType.Csv   => exportToCsv(sql, destPath)
      case FileType.Excel => exportToExcel(sql, destPath)
    }
  }

  private def exportToCsv(sql: String, filePath: String): Future[String] =
    async {
      val exportQuery = s"$sql into outfile '$filePath' format CSVWithNames"

      val cmd = ArrayBuffer(
        "clickhouse-client",
        s"--host=${connection.host}",
        s"--port=${connection.tcpPort}",
        s"--user=${connection.username}",
        s"--query=$exportQuery"
      )

      if (connection.password.nonEmpty) cmd += s"--password=${connection.password}"

      var processLog = ""
      val processLogger = ProcessLogger(log => {
        processLog += s"\n$log"
      })

      val exitValue: Int = Process(cmd).run(processLogger).exitValue()
      if (exitValue == 0) {
        info(s"csv file written to $filePath")
        filePath
      } else {
        throw DbExecuteError(s"got error when export data to csv, log: $processLog")
      }

    }

  private def exportToExcel(sql: String, destPath: String): Future[String] =
    async {
      client
        .executeQuery(sql)(converter = rs => {
          val (colNames, colTypes) = getColMetaData(rs)
          Using(new SXSSFWorkbook()) { workbook =>
            {
              val sheet: SXSSFSheet = workbook.createSheet()
              val header: SXSSFRow = sheet.createRow(0)
              val creationHelper: CreationHelper = workbook.getCreationHelper
              val dateTimeStyle: CellStyle = workbook.createCellStyle
              dateTimeStyle.setDataFormat(creationHelper.createDataFormat().getFormat("m/d/yy h:mm"))

              for (i <- colNames.indices) {
                val headerCell = header.createCell(i)
                headerCell.setCellValue(colNames(i))
              }

              var rowCount = 1

              while (rs.next()) {
                try {
                  val row: SXSSFRow = sheet.createRow(rowCount)
                  rowCount += 1

                  for (i <- colTypes.indices) {
                    try {
                      val cell: SXSSFCell = row.createCell(i)
                      colTypes(i) match {
                        case t if isArray(t)  => cell.setCellValue(rs.getString(colNames(i)))
                        case t if isNumber(t) => cell.setCellValue(rs.getDouble(colNames(i)))
                        case t if isDateTime(t) =>
                          cell.setCellValue(rs.getTimestamp(colNames(i)))
                          cell.setCellStyle(dateTimeStyle)
                        case _ => cell.setCellValue(rs.getString(colNames(i)))
                      }
                    } catch {
                      case e: Throwable => logger.error(s"create cell error: ${e.getMessage}", e)
                    }
                  }

                } catch {
                  case e: Throwable => logger.error(s"create row error: ${e.getMessage}", e)
                }
              }

              Using(new FileOutputStream(destPath))(out => workbook.write(out))
              workbook.dispose()
              logger.info(s"export query $sql as excel file to $destPath, total rows: $rowCount.")

              destPath
            }
          }
        })
    }

  override def testConnection(): Future[Boolean] = {
    Future {
      client.testConnection(testConnTimeoutMs)
    }
  }
  override def getSqlParser(): SqlParser = ClickhouseParser

  override def detectExpressionColumn(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] = {
    val withExistingExpressions: String = buildCteClause(existingExpressions)

    val query =
      s"""
           |$withExistingExpressions
           |select $newExpr
           |from $dbName.$tblName
           |where 1 != 1
           |""".stripMargin

    for {
      ddlExecutor: DDLExecutor <- getDDLExecutor()
      columns: Seq[Column] <- ddlExecutor.detectColumns(query)
    } yield columns.headOption match {
      case Some(column) => column
      case None         => throw DbExecuteError(s"fail to detect column for expression: $newExpr")
    }
  }

  /**
    * @throws DbExecuteError when sql execute error like syntax error
    */
  override def detectAggregateExpressionColumn(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] = {
    val withExistingExpressions: String = buildCteClause(existingExpressions)

    val mainExpression: String = if (ExpressionUtils.isApplyAllExpr(newExpr)) {
      ExpressionUtils.getMainExpression(newExpr)
    } else newExpr

    val query = s"""
           |$withExistingExpressions
           |select $mainExpression
           |from (
           |  select *
           |  from $dbName.$tblName
           |  where 1 != 1
           |)
           |group by 'dummy_col'
           |""".stripMargin

    for {
      ddlExecutor: DDLExecutor <- getDDLExecutor()
      columns: Seq[Column] <- ddlExecutor.detectColumns(query)
    } yield columns.headOption match {
      case Some(column) => column
      case None         => throw DbExecuteError(s"fail to detect column for aggregate expression: $newExpr")
    }
  }

  private def buildCteClause(expressions: Map[String, String]): String = {
    if (expressions.nonEmpty) {
      val cteFields: Iterable[String] = expressions.map {
        case (exprName, expr) => s"(${getFinalExpr(expr)}) as $exprName"
      }

      s"with ${cteFields.mkString(",\n")}"
    } else ""
  }

  private def getFinalExpr(expr: String): String = {
    if (ExpressionUtils.isApplyAllExpr(expr)) {
      ExpressionUtils.getMainExpression(expr)
    } else expr
  }

  override def write(schema: TableSchema, records: Seq[Record]): Future[Int] = {
    writeRecords(client, schema.dbName, schema.name, schema.columns, records)
  }

  private def writeRecords(
      client: JdbcClient,
      dbName: String,
      tblName: String,
      columns: Seq[Column],
      records: Seq[Record],
      batchSize: Int = 1000
  ): Future[Int] = {
    Future {
      val insertColumns: Seq[Column] = dropMaterializedColumns(columns)
      val insertQuery = ClickHouseDDLConverter.toInsertSQL(dbName, tblName, insertColumns, isApplyEncryption = true)

      records
        .map(ClickHouseUtils.normalizeToCorrespondingType(insertColumns, _))
        .toArray
        .grouped(batchSize)
        .map(client.executeBatchUpdate(insertQuery, _))
        .sum
    }.onFailure { ex =>
      error(s"${this.getClass.getSimpleName}::writeRecords fail for table $dbName.$tblName", ex)
    }
  }

  private def dropMaterializedColumns(columns: Seq[Column]): Seq[Column] = {
    columns.filterNot(_.isMaterialized())
  }

  override protected def beforeClosing(): Unit = {
    client.close()
  }
}
