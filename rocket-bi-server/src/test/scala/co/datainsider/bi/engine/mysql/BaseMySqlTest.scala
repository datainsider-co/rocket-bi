package co.datainsider.bi.engine.mysql

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.engine.ClientManager
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.util.{Serializer, Using}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

import scala.io.Source

/**
  * created 2023-06-27 2:30 PM
  *
  * @author tvc12 - Thien Vi
  */
abstract class BaseMySqlTest extends IntegrationTest {
  override protected val injector: Injector = TestInjector(TestContainerModule).create

  val source: MysqlConnection = injector.instance[MysqlConnection]

  val engine: MySqlEngine = new MySqlEngine(new ClientManager())

  val client: JdbcClient = engine.createClient(source)

  val ddlExecutor: DDLExecutor = engine.getDDLExecutor(source)

  val tblName = "sales"
  val dbName = "test"

  val tableSchema = TableSchema(
    name = tblName,
    dbName = dbName,
    organizationId = 1,
    displayName = dbName,
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

  override def beforeAll(): Unit = {
    super.beforeAll()
    cleanup()
    setupSampleData()
  }

  def setupSampleData(): Unit = {
    client.executeUpdate(s"CREATE DATABASE IF NOT EXISTS $dbName")
    client.executeUpdate(
      s"""CREATE TABLE IF NOT EXISTS $dbName.$tblName (
         |  Region VARCHAR(255),
         |  Country VARCHAR(255),
         |  Item_Type VARCHAR(255),
         |  Sales_Channel VARCHAR(255),
         |  Order_Priority VARCHAR(255),
         |  Order_Date DATETIME,
         |  Order_ID VARCHAR(255) NOT NULL,
         |  Ship_Date DATETIME,
         |  Units_Sold INT,
         |  Unit_Price FLOAT,
         |  Unit_Cost FLOAT,
         |  Total_Revenue FLOAT,
         |  Total_Cost FLOAT,
         |  Total_Profit FLOAT
         |) ENGINE=InnoDB
         |DEFAULT CHARSET=utf8mb4
         |COLLATE=utf8mb4_unicode_ci
         |""".stripMargin
    )
    val dataPath: String = getClass.getClassLoader.getResource("datasets/sales_100records").getPath
    val records: Array[Record] = readAsRecords(tableSchema.columns, dataPath)
    client.executeBatchUpdate(
      s"""INSERT INTO $dbName.$tblName(Region, Country, Item_Type, Sales_Channel, Order_Priority, Order_Date, Order_ID, Ship_Date, Units_Sold, Unit_Price, Unit_Cost, Total_Revenue, Total_Cost, Total_Profit)
         |VALUES(? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ?)
         |""".stripMargin,
      records
    )
  }

  private def readAsRecords(columns: Seq[Column], dataPath: String): Array[Array[Any]] = {
    Using(Source.fromFile(dataPath)) { source =>
      source
        .getLines()
        .toArray
        .map(line => {
          val dataMap: Map[String, Any] = Serializer.fromJson[Map[String, Any]](line)
          columns.map(column => dataMap(column.name)).toArray
        })
    }
  }

  override def afterAll(): Unit = {
    super.afterAll()
    cleanup()
    client.close()
  }

  def cleanup(): Unit = {
    client.executeUpdate(s"DROP DATABASE IF EXISTS $dbName")
  }

}
