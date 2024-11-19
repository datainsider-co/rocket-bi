// fixme: pending test because cannot have redshift connection
//package co.datainsider.bi.engine.redshift
//
//import co.datainsider.bi.client.JdbcClient
//import co.datainsider.bi.client.JdbcClient.Record
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.bi.util.{Serializer, Using}
//import co.datainsider.bi.util.Implicits.FutureEnhance
//import co.datainsider.schema.domain.TableSchema
//import co.datainsider.schema.domain.column._
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//
//import java.sql.Timestamp
//import java.text.SimpleDateFormat
//import scala.io.Source
//
///**
//  * created 2023-06-27 2:30 PM
//  *
//  * @author tvc12 - Thien Vi
//  */
//class BaseRedshiftTest extends IntegrationTest {
//  override protected val injector: Injector = TestInjector(TestContainerModule).create
//
//  val redshiftSource: RedshiftConnection = TestContainerModule.providesRedshiftSource()
//
//  val engineCreator = new RedshiftEngineFactory()
//
//  val engine: RedshiftEngine = engineCreator.create(redshiftSource)
//
//  val client: JdbcClient = engine.client
//
//  val tblName = "sales"
//  val dbName = "test"
//
//  val tableSchema = TableSchema(
//    name = tblName,
//    dbName = dbName,
//    organizationId = 1,
//    displayName = dbName,
//    columns = Seq(
//      StringColumn("Region", "Region", isNullable = true),
//      StringColumn("Country", "Country", isNullable = true),
//      StringColumn("Item_Type", "Item Type", isNullable = true),
//      StringColumn("Sales_Channel", "Sales_Channel", isNullable = true),
//      StringColumn("Order_Priority", "Order_Priority", isNullable = true),
//      DateTimeColumn("Order_Date", "Order_Date", isNullable = true),
//      StringColumn("Order_ID", "Order_ID", isNullable = false),
//      DateTimeColumn("Ship_Date", "Ship_Date", isNullable = true),
//      Int32Column("Units_Sold", "Units_Sold", isNullable = true),
//      FloatColumn("Unit_Price", "Unit_Price", isNullable = true),
//      FloatColumn("Unit_Cost", "Unit_Cost", isNullable = true),
//      FloatColumn("Total_Revenue", "Total_Revenue", isNullable = true),
//      FloatColumn("Total_Cost", "Total_Cost", isNullable = true),
//      FloatColumn("Total_Profit", "Total_Profit", isNullable = true)
//    )
//  )
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    setupSampleData()
//  }
//
//  def setupSampleData(): Unit = {
//    client.executeUpdate(s"CREATE SCHEMA $dbName")
//    client.executeUpdate(
//      s"""CREATE TABLE $dbName.$tblName (
//         |  Region VARCHAR(255),
//         |  Country VARCHAR(255),
//         |  Item_Type VARCHAR(255),
//         |  Sales_Channel VARCHAR(255),
//         |  Order_Priority VARCHAR(255),
//         |  Order_Date TIMESTAMP,
//         |  Order_ID VARCHAR(255) NOT NULL,
//         |  Ship_Date TIMESTAMP,
//         |  Units_Sold INT,
//         |  Unit_Price FLOAT,
//         |  Unit_Cost FLOAT,
//         |  Total_Revenue FLOAT,
//         |  Total_Cost FLOAT,
//         |  Total_Profit FLOAT
//         |)
//         |""".stripMargin
//    )
//    val dataPath: String = getClass.getClassLoader.getResource("datasets/sales_100records").getPath
//    val records: Array[Record] = readAsRecords(tableSchema.columns, dataPath)
//
//    client.executeBatchUpdate(
//      s"""INSERT INTO $dbName.$tblName(Region, Country, Item_Type, Sales_Channel, Order_Priority, Order_Date, Order_ID, Ship_Date, Units_Sold, Unit_Price, Unit_Cost, Total_Revenue, Total_Cost, Total_Profit)
//         |VALUES(? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ? , ?)
//         |""".stripMargin,
//      records
//    )
//  }
//
//  private def readAsRecords(columns: Seq[Column], dataPath: String): Array[Array[Any]] = {
//    Using(Source.fromFile(dataPath)) { source =>
//      source
//        .getLines()
//        .toArray
//        .map(line => {
//          val dataMap: Map[String, Any] = Serializer.fromJson[Map[String, Any]](line)
//          columns.map {
//            case c: DateTimeColumn =>
//              try {
//                val dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
//                val date = dateFormat.parse(dataMap(c.name).toString)
//                new Timestamp(date.getTime)
//              } catch {
//                case e: Throwable => null
//              }
//            case _ @c => dataMap(c.name)
//          }.toArray
//        })
//    }
//  }
//
//  override def afterAll(): Unit = {
//    super.afterAll()
//    cleanup()
//  }
//
//  def cleanup(): Unit = {
//    client.executeUpdate(s"DROP SCHEMA $dbName CASCADE")
//  }
//
//  test("test query redshift") {
//    val sql = s"select * from $dbName.$tblName;"
//    val dataTable = engine.execute(sql).syncGet()
//    assert(dataTable.records.nonEmpty)
//  }
//
//}
