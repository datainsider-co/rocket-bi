package co.datainsider.datacook.engine

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.bi.util.Using
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.module.TestDataCookModule
import co.datainsider.datacook.pipeline.operator.OperatorService
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaModule}
import co.datainsider.schema.service.SchemaService
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.Assertion

import java.sql.{Date, Timestamp}
import scala.collection.mutable.ArrayBuffer
import scala.io.Source
import scala.util.Random

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 3:12 PM
  */
abstract class AbstractOperatorTest extends IntegrationTest with EngineIntegrateTest {
  override protected val injector: Injector = TestInjector(
    TestModule,
    SchemaModule,
    MockCaasClientModule,
    TestDataCookModule,
    TestContainerModule,
    MockSchemaClientModule
  ).create
  protected val operatorService: OperatorService = injector.instance[OperatorService]
  protected val schemaService: SchemaService = injector.instance[SchemaService]

  protected def orgId: OrganizationId = 555L
  protected def jobId: EtlJobId
  protected def dbName: String = getDbName(orgId, jobId)
  protected def toTblView(tblName: String) = s"$dbName.$tblName"

  protected def getDbName(orgId: OrganizationId, jobId: EtlJobId): String = {
    operatorService.getDbName(orgId, jobId)
  }

  protected def sourceDbName: String = "sample_testing_db"

  override def afterAll(): Unit = {
    super.afterAll()
    cleanUp()
  }

  override def beforeAll(): Unit = {
    super.beforeAll()
    cleanUp()
    setupSampleDatabase()
  }

  protected def setupSampleDatabase(): Unit = {
    val databaseSchema = DatabaseSchema(
      name = sourceDbName,
      organizationId = orgId,
      displayName = sourceDbName,
      creatorId = "tvc12"
    )
    await(schemaService.addDatabase(databaseSchema))
//    waitUntilDatabaseCreated(sourceDbName)
    setupSampleTables()
  }

  protected def setupSampleTables(): Unit = {
    loadData(getClass.getClassLoader.getResource("datasets/customers.csv").getPath, customerTable)
    loadData(getClass.getClassLoader.getResource("datasets/customers2.csv").getPath, nullableCustomerTable)
    loadData(getClass.getClassLoader.getResource("datasets/sales.csv").getPath, salesTable)
    loadData(getClass.getClassLoader.getResource("datasets/orders.csv").getPath, orderTable)
    loadData(getClass.getClassLoader.getResource("datasets/products.csv").getPath, productTable)
  }

  private def waitUntilDatabaseCreated(dbName: String): Unit = {
    val startTime = System.currentTimeMillis()
    var isCreated = false
    while (!isCreated && System.currentTimeMillis() - startTime < 10000) {
      try {
        await(schemaService.getDatabaseSchema(orgId, dbName))
        isCreated = true
      } catch {
        case ex: Throwable => Thread.sleep(1000)
      }
    }
  }

  protected def cleanUp(): Unit = {
    try {
      await(operatorService.removeAllTables(orgId, jobId))
    } catch {
      case ex: Throwable => // ignore
    }
    try {
      await(schemaService.deleteDatabase(orgId, sourceDbName))
    } catch {
      case ex: Throwable => // ignore
    }
  }

  protected def loadData(path: String, table: TableSchema): Unit = {
    await(schemaService.createOrMergeTableSchema(table))
    val records: Seq[Array[Any]] = readData(path)
    insertData(table, records)
  }

  private def readData(path: String): Seq[Array[Any]] = {

    Using(Source.fromFile(path))(source => {
      val buffer = ArrayBuffer[Array[Any]]()
      for (line <- source.getLines) {
        val data: Array[Any] = (line + " ")
          .split(",")
          .map(value => {
            // remove double quote
            val trimValue = String.valueOf(value).trim
            if (trimValue.startsWith("\"") && trimValue.endsWith("\"")) {
              trimValue.substring(1, trimValue.length - 1)
            } else {
              trimValue
            }
          })
        buffer.append(data)
      }
      buffer.toSeq
    })
  }

  protected val customerTable = TableSchema(
    organizationId = orgId,
    dbName = sourceDbName,
    name = "customers",
    displayName = "Customers",
    columns = Seq(
      Int32Column("id", "id"),
      StringColumn("name", "name", isNullable = true),
      StringColumn("gender", "gender", isNullable = true),
      StringColumn("address", "address", isNullable = true),
      DateColumn("birth_day", "birth_day", isNullable = true)
    )
  )

  protected val nullableCustomerTable = customerTable.copy(name = "customer_nullable")

  protected val orderTable = TableSchema(
    organizationId = orgId,
    dbName = sourceDbName,
    name = "order",
    displayName = "order",
    columns = Seq(
      Int32Column("id", "id"),
      Int32Column("product_id", "product_id", isNullable = true),
      Int32Column("customer_id", "customer_id", isNullable = true),
      DateColumn("order_date", "order_date", isNullable = true),
      FloatColumn("profit", "profit", isNullable = true)
    )
  )

  protected val productTable = TableSchema(
    organizationId = orgId,
    dbName = sourceDbName,
    name = "product",
    displayName = "product",
    columns = Seq(
      Int32Column("id", "id"),
      StringColumn("name", "name", isNullable = true),
      Int32Column("quality", "quality", isNullable = true),
      StringColumn("type", "type", isNullable = true),
      DateColumn("create_date", "create_date", isNullable = true)
    )
  )

  protected val salesTable = TableSchema(
    organizationId = orgId,
    dbName = sourceDbName,
    name = "sales",
    displayName = "sales",
    columns = Seq(
      StringColumn("Region", "Region", isNullable = true),
      StringColumn("Country", "Country", isNullable = true),
      StringColumn("Item_Type", "Item Type", isNullable = true),
      StringColumn("Sales_Channel", "Sales_Channel", isNullable = true),
      StringColumn("Order_Priority", "Order_Priority", isNullable = true),
      DateTimeColumn("Order_Date", "Order_Date", isNullable = true),
      StringColumn("Order_ID", "Order_ID", isNullable = false),
      DateTimeColumn("Ship_Date", "Ship_Date", isNullable = true),
      Int32Column("Units_Sold", "Units_Sold", isNullable = true),
      FloatColumn("Unit_Price", "Unit_Price", isNullable = true),
      FloatColumn("Unit_Cost", "Unit_Cost", isNullable = true),
      FloatColumn("Total_Revenue", "Total_Revenue", isNullable = true),
      FloatColumn("Total_Cost", "Total_Cost", isNullable = true),
      FloatColumn("Total_Profit", "Total_Profit", isNullable = true)
    )
  )

  protected def assertTableSize(schema: TableSchema, expectedTotal: Int, useDistinct: Boolean = false): Unit = {
    assertTableSize(schema.dbName, schema.name, expectedTotal, useDistinct)
  }

  protected def assertTableSize(dbName: String, tbName: String, expectedTotal: Int, useDistinct: Boolean): Unit = {
    val query = useDistinct match {
      case true => s"select count(distinct(*)) as currentTotal from ${dbName}.`${tbName}`"
      case _    => s"select count(*) as currentTotal from ${dbName}.`${tbName}`"
    }
    assertQueryCount(query, expectedTotal)
  }

  protected def assertTableSchemaInfo(
      etlId: EtlJobId,
      schema: TableSchema,
      destTableConfig: DestTableConfig
  ): Unit = {
    assertResult(true)(schema != null)
    assertResult(destTableConfig.tblName)(schema.name)
    assertResult(destTableConfig.tblDisplayName)(schema.displayName)
    assertResult(getDbName(orgId, etlId))(schema.dbName)
  }

  protected def assertColumn(
      schema: TableSchema,
      index: Int,
      name: Option[String] = None,
      displayName: Option[String] = None
  ): Unit = {
    val column: Column = schema.columns(index)
    if (name.isDefined) {
      assertResult(name.get)(column.name)
    }
    if (displayName.isDefined) {
      assertResult(displayName.get)(column.displayName)
    }
  }

  protected def assertColumnType[T <: Column](schema: TableSchema, index: Int): Assertion = {
    assertResult(true)(schema.columns(index).isInstanceOf[T])
  }

  protected def assertColumnType[T <: Column](schema: TableSchema, name: String): Assertion = {
    assertResult(true)(schema.columns.find(_.name == name).isInstanceOf[Some[T]])
  }

  /**
    * init data for testing, for count row size
    * Date support random in range [2020-12-12. 2022-12-31]
    */
  protected def generateAndInsertData(tableSchema: TableSchema, size: Int): Any = {
    await(schemaService.createTableSchema(tableSchema))
    val rows = ArrayBuffer.empty[Array[Any]]
    (0 until size).foreach(_ => {
      val row: Array[Any] = generateRow(tableSchema.columns)
      rows.append(row)
      if (rows.size > 1000) {
        insertData(tableSchema, rows)
        rows.clear()
      }
    })
    if (rows.nonEmpty) {
      insertData(tableSchema, rows)
    }
  }

  private def generateRow(columns: Seq[Column]): Array[Any] = {
    columns.map {
      case _: StringColumn                                                           => Random.alphanumeric.take(10).mkString
      case _ @(_: Int8Column | _: Int16Column | _: Int32Column | _: Int64Column)     => Random.nextInt(500)
      case _ @(_: UInt8Column | _: UInt16Column | _: UInt32Column | _: UInt64Column) => Random.nextInt(500)
      case _ @(_: FloatColumn | _: DoubleColumn)                                     => Random.nextDouble() + Random.nextLong()
      //  [2020-12-12. 2022-12-31]
      case _: DateColumn => new Date(1607731200000L + Random.nextInt(1641600000))
      //  [2020-12-12. 2022-12-31]
      case _: DateTimeColumn => new Timestamp(1607731200000L + Random.nextInt(1641600000))
    }.toArray
  }

}
