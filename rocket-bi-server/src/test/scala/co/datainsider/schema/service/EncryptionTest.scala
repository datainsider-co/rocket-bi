package co.datainsider.schema.service

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.bi.service.ConnectionService
import co.datainsider.bi.util.Using
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.{TableSchema, TableStatus, TableType}
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaTestModule}
import co.datainsider.schema.repository.{DDLExecutor, SchemaRepository}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike

import scala.collection.mutable.ArrayBuffer
import scala.io.Source

class EncryptionTest extends IntegrationTest {
  override protected val injector: Injector =
    TestInjector(MockCaasClientModule, SchemaTestModule, TestContainerModule, TestModule, MockSchemaClientModule)
      .newInstance()

  val schemaManager: SchemaRepository = injector.instance[SchemaRepository]
  val schemaService: SchemaService = injector.instance[SchemaService]
  private val orgId = 1
  val clickhouseEngine = injector.instance[Engine[ClickhouseConnection]].asInstanceOf[ClickhouseEngine]
  val source: ClickhouseConnection = injector.instance[ClickhouseConnection]
  protected val client: JdbcClient = clickhouseEngine.createClient(source)

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
  val testData: Array[Record] = readDataFromFile(
    getClass.getClassLoader.getResource("datasets/products.csv").getPath
  )
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
    val encryptedData: Array[Array[Any]] = readDataFromClickhouse()
    encryptedData.foreach(record => {
      val expectedRecord: Array[String] = testData.find(_.head.equals(record.head.toString)).get.map(_.toString)
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
    val encryptedData: Array[Record] = readDataFromClickhouse()
    encryptedData.foreach(record => {
      val expectedRecord: Array[String] = testData.find(_.head.equals(record.head.toString)).get.map(_.toString)
      for (i <- 1 to 4) {
        assert(expectedRecord(i).equals(record(i).toString))
      }
    })
  }

  def waitForTableReady(): Unit = {
    var retry: Int = 30
    while (retry > 0) {
      schemaManager
        .getTable(1, testDbName, testTblName)
        .map(tableSchema => {
          println(tableSchema.tableStatus)
          tableSchema.tableStatus match {
            case None =>
            case Some(value) =>
              if (value.equals(TableStatus.Normal)) {
                retry = 0
              }
          }
        })
        .syncGet()
      retry = retry - 1
      Thread.sleep(3000)
    }
  }

  def readDataFromClickhouse(): Array[Array[Any]] = {
    val records = ArrayBuffer.empty[Record]
    client.executeQuery(s"select * from $testDbName.$testTblName limit 10")(rs => {
      while (rs.next()) {
        val record = ArrayBuffer.empty[Any]
        record += rs.getInt("id")
        record += rs.getString("name")
        record += rs.getLong("quality")
        record += rs.getString("type")
        record += rs.getString("created_date")
        records += record.toArray
      }
    })
    records.toArray
  }

  def readDataFromFile(path: String): Array[Record] = {
    Using(Source.fromFile(path))(source => {
      val buffer = ArrayBuffer[Array[Any]]()
      for (line <- source.getLines) {
        val data: Array[Any] = (line + " ").split(",").map(_.trim)
        buffer.append(data)
      }
      buffer.toArray
    })
  }

  def insertData(schema: TableSchema, data: Array[Record]): Future[Unit] = {
    Future {
      val colNames: Seq[String] = schema.columns.map(_.name)
      val query =
        s"""
             |insert into `${schema.dbName}`.`${schema.name}` (${colNames.mkString(", ")})
             |values(${Seq.fill(colNames.size)("?").mkString(", ")})
             |""".stripMargin

      client.executeBatchUpdate(query, data)
    }
  }
}
