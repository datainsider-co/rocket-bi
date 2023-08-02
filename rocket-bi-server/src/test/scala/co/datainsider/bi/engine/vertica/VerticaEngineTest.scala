package co.datainsider.bi.engine.vertica

import co.datainsider.bi.client.NativeJDbcClient
import co.datainsider.bi.domain.{SshKeyPair, SshConfig}
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.bi.service.SshSessionManager
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import datainsider.client.exception.DbExecuteError

import java.io.File
import java.sql.{Date, Timestamp}
import scala.collection.mutable.ArrayBuffer

/**
  * created 2023-07-20 11:27 AM
  *
  * @author tvc12 - Thien Vi
  */
class VerticaEngineTest extends BaseVerticaTest {

  val baseDir = "./tmp"
  val csvPath = s"${baseDir}/sales.csv"
  val excelPath = s"${baseDir}/sales.xlsx"


  val testWriteTableSchema: TableSchema = TableSchema(
    name = "writeable_table",
    dbName = dbName,
    organizationId = 0,
    displayName = "Student table",
    columns = Seq(
      Int32Column("\'id\'", "Id"),
      StringColumn("address", "Address", isNullable = true),
      Int32Column("age", "Age", isNullable = true),
      DateColumn("created_date", "created_date", isNullable = true),
      DateTimeColumn("day_of_birth", "Date of birth", isNullable = true),
      Int32Column("gender", "Gender", isNullable = true),
      FloatColumn("score", "Average score", isNullable = true),
      StringColumn("email", "Email", isNullable = true),
      StringColumn("address.country", "Country", isNullable = true),
    )
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    val file = new File(baseDir)
    if (!file.exists()) {
      file.mkdirs()
    }
    await(ddlExecutor.createTable(testWriteTableSchema))
  }

  override def cleanup(): Unit = {
    super.cleanup()
    val file = new File(csvPath)
    if (file.exists()) {
      file.delete()
    }
    val excelFile = new File(excelPath)
    if (excelFile.exists()) {
      excelFile.delete()
    }
  }

  test("test export csv") {
    val sql =
      s"""
         |SELECT Region, Total_Profit, Order_Date
         |FROM $dbName.$tblName
         |LIMIT 100
         |""".stripMargin

    val destPath = await(engine.exportToFile(source, sql, s"${baseDir}/sales.csv", FileType.Csv))
    val file = new File(destPath)
    assert(file.exists())
    assert(file.length() > 0)
    file.delete()
  }

  test("test export excel") {
    val sql =
      s"""
         |SELECT Region, Total_Profit, Order_Date
         |FROM $dbName.$tblName
         |LIMIT 100
         |""".stripMargin

    val destPath = await(engine.exportToFile(source, sql, s"${baseDir}/sales.xlsx", FileType.Excel))
    val file = new File(destPath)
    assert(file.exists())
    assert(file.length() > 0)
    file.delete()
  }

  test("test detect expression column success") {
    val expression = "Total_Profit + 100"
    val column = await(engine.detectExpressionColumn(source, dbName, tblName, expression, Map.empty))
    assert(column != null)
    assert(column.getClass == classOf[DoubleColumn])
  }

  test("test detect expression column with invalid expression") {
    val expression = "Total_Profit + 100 +"
    assertFailedFuture[DbExecuteError](engine.detectExpressionColumn(source, dbName, tblName, expression, Map.empty))
  }

  test("test detect aggregate expression column success") {
    val expression = "sum(Total_Profit)"
    val column = await(engine.detectExpressionColumn(source, dbName, tblName, expression, Map.empty))
    assert(column != null)
    assert(column.getClass == classOf[DoubleColumn])
  }

  test("test detect aggregate expression column with invalid expression") {
    val expression = "sum(Total_Profit) +"
    assertFailedFuture[DbExecuteError](engine.detectExpressionColumn(source, dbName, tblName, expression, Map.empty))
  }

  test("test query histogram") {
    val fieldName = "Total_Revenue"
    val baseSql = s"select Total_Revenue from $dbName.$tblName"
    val histogramSql = VerticaParser.toHistogramSql(fieldName, baseSql, 5)
    assert(histogramSql != null)

    val dataTable: DataTable = await(engine.execute(source, histogramSql))
    assert(dataTable.headers.nonEmpty)
    assert(dataTable.records.nonEmpty)
  }

  test("test write data to vertica") {
    val date = Date.valueOf("2021-01-01")
    val dateTime = Timestamp.valueOf("2021-01-01 12:12:12")
    val dateTime2 = Timestamp.valueOf("2021-01-01 12:12:12.456")

    val records = Seq(
      Array(1, "Atlantic", 10, date, date, "1", 7.1, "kiki\"@gmail.com", null),
      Array(2, "Pa\"cific", 3, dateTime, dateTime, 0, null, "mimi@gmail.com", "Vietnam"),
      Array(3, "1", 7, null, null, 0, 7.3, "momo@gmail.com", "Vietnam"),
      Array(4, "Himawari", null, null, date, 0, "7.3", "momo@gmail.com", null),
      Array(5, null, null, null, null, null, null, null, ""),
      Array(6, null, null, date.getTime, date.getTime, null, null, null, "1"),
      Array(7, null, null, dateTime.getTime, dateTime2.getTime, null, null, null, null)
    )

    await(engine.write(source, testWriteTableSchema, records))
    val query = s"""SELECT *
         |FROM ${testWriteTableSchema.dbName}.${testWriteTableSchema.name}
         |ORDER BY "'id'" """.stripMargin
    val actualRows: Seq[Seq[Any]] = client.executeQuery(query)(rs => {
      val records = ArrayBuffer[Seq[Any]]()
      while (rs.next()) {
          val record = ArrayBuffer[Any]()
          for (i <- 1 to rs.getMetaData.getColumnCount) {
            record += rs.getObject(i)
          }
          records += record
      }
      records
    })
    assert(actualRows.size == 7)
    assert(actualRows(0).toSeq == Seq(1, "Atlantic", 10, date, Timestamp.valueOf("2021-01-01 00:00:00.0"), 1, 7.1, "kiki\"@gmail.com", null))
    assert(actualRows(1).toSeq == Seq(2, "Pa\"cific", 3, date, dateTime, 0, null, "mimi@gmail.com", "Vietnam"))
    assert(actualRows(2) == Seq(3, "1", 7, null, null, 0, 7.3, "momo@gmail.com", "Vietnam"))
    assert(actualRows(3) == Seq(4, "Himawari", null, null, Timestamp.valueOf("2021-01-01 00:00:00"), 0, 7.3, "momo@gmail.com", null))
    assert(actualRows(4) == Seq(5, null, null, null, null, null, null, null, ""))
    assert(actualRows(5) == Seq(6, null, null, date, Timestamp.valueOf("2021-01-01 00:00:00.0"), null, null, null, "1"))
    assert(actualRows(6) == Seq(7, null, null, date, dateTime2, null, null, null, null))
  }


  test("connect using ssh") {
    val keypair = injector.instance[SshKeyPair]
    val tunnelConfig = injector.instance[SshConfig]
    val verticaServiceName: String = ZConfig.getString("test_db.vertica.service_name")
    val originPort = ZConfig.getInt("test_db.vertica.service_port")
    val originConnection = source.copyHostPorts(verticaServiceName, Seq(originPort))
    println(s"open tunnel from localhost -> ${tunnelConfig.host}:${tunnelConfig.port}")
    Using(SshSessionManager.createSession(keypair, tunnelConfig))(session => {
      val newPorts = session.forwardLocalPorts(originConnection.getRemoteHost(), originConnection.getRemotePorts())
      println(s"tunnel from ${originConnection.getRemoteHost()}:${originConnection.getRemotePorts()} -> ${session.getLocalHost()}:${newPorts}")
      val tunnelConnection = source.copyHostPorts(session.getLocalHost(), newPorts)
      val client = NativeJDbcClient(tunnelConnection.jdbcUrl, tunnelConnection.username, tunnelConnection.password)
      client.executeQuery("SELECT 1")(rs => {
        assert(rs.next())
        assert(rs.getInt(1) == 1)
      })
    })
  }
}
