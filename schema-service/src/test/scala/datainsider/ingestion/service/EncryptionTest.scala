package datainsider.ingestion.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.JdbcClient
import datainsider.ingestion.domain.{Column, Int32Column, Int64Column, StringColumn, TableSchema, TableStatus, TableType}
import datainsider.ingestion.misc.JdbcClient.Record
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.repository.SchemaRepository
import datainsider.ingestion.util.Implicits.FutureEnhance
import datainsider.ingestion.util.Using

import java.io.File
import scala.collection.mutable.ArrayBuffer
import scala.io.Source

class EncryptionTest extends IntegrationTest {
  override protected val injector: Injector = TestInjector(MockCaasClientModule, TestModule).newInstance()

  val schemaManager: SchemaRepository = injector.instance[SchemaRepository]
  val schemaService: SchemaService = injector.instance[SchemaService]
  protected val client: JdbcClient = injector.instance[JdbcClient]

  val testDbName: String = "encryption_db_test"
  val testTblName: String = "encryption_tbl_test"
  val testColumns: Seq[Column] = Seq(
    Int32Column(name = "id", displayName = "id", isNullable = true),
    StringColumn(name = "name", displayName = "product name", isNullable = true),
    Int64Column(name = "quality", displayName = "quality", isNullable = true),
    StringColumn(name = "type", displayName = "type", isNullable = true),
    StringColumn(name = "created_date", displayName = "created date", isNullable = true)
  )
  val tableSchema: TableSchema = TableSchema(
    name = testTblName,
    dbName = testDbName,
    organizationId = 1,
    displayName = "create table",
    columns = testColumns,
    tableType = Some(TableType.Default)
  )
  val testData: Seq[Seq[String]] = readDataFromFile(getClass.getClassLoader.getResource("datasets/products.csv").getPath)
  override def beforeAll(): Unit = {
    super.beforeAll()
    schemaManager.createDatabase(1, testDbName, "test database").syncGet()
    schemaService.createTableSchema(tableSchema).syncGet()
    insertData(tableSchema, testData)
  }
  override def afterAll(): Unit = {
    super.afterAll()
    schemaManager.dropDatabase(1, testDbName)
  }

  test("encrypt data test") {
    val updatedColumns: Seq[Column] = Seq(
      Int32Column(name = "id", displayName = "id", isNullable = true),
      StringColumn(name = "name", displayName = "product name", isNullable = true, isEncrypted = true),
      Int64Column(name = "quality", displayName = "quality", isNullable = true),
      StringColumn(name = "type", displayName = "type", isNullable = true),
      StringColumn(name = "created_date", displayName = "created date", isNullable = true)
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = updatedColumns)).syncGet()
    waitForTableReady()
    val encryptedData: Seq[Seq[Any]] = readDataFromClickhouse()
    encryptedData.foreach(record => {
      val expectedRecord: Seq[String] = testData.find(_.head.equals(record.head.toString)).get
      assert(!expectedRecord(1).equals(record(1).toString))
      for (i <- 2 to 4) {
        assert(expectedRecord(i).equals(record(i).toString))
      }
    })
  }

  test("decrypt data test") {
    val updatedColumns: Seq[Column] = Seq(
      Int32Column(name = "id", displayName = "id", isNullable = true),
      StringColumn(name = "name", displayName = "product name", isNullable = true),
      Int64Column(name = "quality", displayName = "quality", isNullable = true),
      StringColumn(name = "type", displayName = "type", isNullable = true),
      StringColumn(name = "created_date", displayName = "created date", isNullable = true)
    )
    schemaService.updateTableSchema(1, tableSchema.copy(columns = updatedColumns)).syncGet()
    waitForTableReady()
    val encryptedData: Seq[Seq[Any]] = readDataFromClickhouse()
    encryptedData.foreach(record => {
      val expectedRecord: Seq[String] = testData.find(_.head.equals(record.head.toString)).get
      for (i <- 1 to 4) {
        assert(expectedRecord(i).equals(record(i).toString))
      }
    })
  }

  def waitForTableReady(): Unit = {
    var retry: Int = 30
    while (retry > 0) {
      schemaManager.getTable(1, testDbName, testTblName).map(tableSchema => {
        println(tableSchema.tableStatus)
        tableSchema.tableStatus match {
          case None =>
          case Some(value) =>
            if (value.equals(TableStatus.Normal)) {
              retry = 0
            }
        }
      }).syncGet()
      retry = retry - 1
      Thread.sleep(3000)
    }
  }

  def readDataFromClickhouse(): Seq[Seq[Any]] = {
    val records = ArrayBuffer.empty[Record]
    client.executeQuery(s"select * from $testDbName.$testTblName limit 10")(rs => {
      while (rs.next()) {
        val record = ArrayBuffer.empty[Any]
        record += rs.getInt("id")
        record += rs.getString("name")
        record += rs.getLong("quality")
        record += rs.getString("type")
        record += rs.getString("created_date")
        records += record
      }
    })
    records
  }

  def readDataFromFile(path: String): Seq[Seq[String]] = {
    Using(Source.fromFile(path))(source => {
      val buffer = ArrayBuffer[Seq[String]]()
      for (line <- source.getLines) {
        val data: Seq[String] = (line + " ").split(",").map(_.trim)
        buffer.append(data)
      }
      buffer
    })
  }

  def insertData(schema: TableSchema, data: Seq[Record]): Future[Unit] =
    Future {
      client.executeBatchUpdate(
        s"""
           |insert into ${schema.dbName}.${schema.name} values(${Array
          .fill(schema.columns.size)("?")
          .mkString(",")})""".stripMargin,
        data
      )
    }
}
