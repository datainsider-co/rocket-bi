package datainsider.data_cook.engine

import com.google.inject.name.Names
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.{Duration, Future}
import datainsider.client.domain.query.SqlQuery
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.Implicits.FutureEnhance
import datainsider.client.util.JdbcClient
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.module.DataCookTestModule
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain._
import datainsider.ingestion.misc.JdbcClient.Record
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.service.SchemaService
import datainsider.ingestion.util.Using
import org.scalatest.{Assertion, BeforeAndAfter}

import java.sql.{Date, Timestamp}
import scala.collection.mutable.ArrayBuffer
import scala.io.Source
import scala.util.Random

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 3:12 PM
  */
abstract class OperatorTest extends IntegrationTest with BeforeAndAfter {
  override protected val defaultAwaitTimeout: Duration = Duration.fromSeconds(100)
  override protected val injector: Injector = DiTestInjector(TestModule, MockCaasClientModule, DataCookTestModule).newInstance()
  protected lazy val tableService: EtlTableService = injector.instance[EtlTableService]
  protected val client: JdbcClient = injector.instance[JdbcClient]

  protected def dbName: String = getDbName(orgId, jobId)

  protected def toTblView(tblName: String) = s"$dbName.$tblName"

  protected val orgId: OrganizationId = 12132
  protected val jobId: EtlJobId
  protected val cookSchemaService: SchemaService = injector.instance[SchemaService](Names.named("etl_schema_service"))

  // internal org id
  protected val oldJobId: EtlJobId = 2027

  protected val customerTable: TableConfiguration = TableConfiguration(tblName = "customer", dbDisplayName = "Etl Operation", tblDisplayName = "Customers")
  protected val customerNullableTable: TableConfiguration = TableConfiguration(tblName = "customer_null_able", dbDisplayName = "Etl Operation", tblDisplayName = "Customers")
  protected val salesTable: TableConfiguration = TableConfiguration(tblName = "sales", dbDisplayName = "Etl Operation", tblDisplayName = "Sales")
  protected val orderTable: TableConfiguration = TableConfiguration(tblName = "order", dbDisplayName = "Etl Operation", tblDisplayName = "Orders")
  protected val productTable: TableConfiguration = TableConfiguration(tblName = "product", dbDisplayName = "Etl Operation", tblDisplayName = "Products")

  protected var customerSchema: TableSchema = _
  protected var customerNullableSchema: TableSchema = _
  protected var salesSchema: TableSchema = _
  protected var orderSchema: TableSchema = _
  protected var productSchema: TableSchema = _

  protected def dropOldData(): Unit = {
    try {
      await(tableService.removeAllTables(orgId, jobId))
    } catch {
      case ex: Throwable => error(s"dropOldData:: etlId::${jobId} error", ex)
    }
    try {
      await(tableService.removeAllTables(orgId, oldJobId))
    } catch {
      case ex: Throwable => error(s"dropOldData:: etlId::${oldJobId} error", ex)
    }
  }

  protected def getDbName(orgId: OrganizationId, jobId: EtlJobId): String = {
    tableService.getDbName(orgId, jobId)
  }

  override def beforeAll(): Unit = {
    super.beforeAll()
    try {
      dropOldData()
      customerSchema = await(
        readFileAndCreateView(
          orgId,
          oldJobId,
          getClass.getClassLoader.getResource("datasets/customers.csv").getPath,
          Array("id", "name", "gender", "address", "birth_day"),
          customerTable
        )
      )
      customerNullableSchema = await(
        readFileAndCreateView(
          orgId,
          oldJobId,
          getClass.getClassLoader.getResource("datasets/customers2.csv").getPath,
          Array("id", "name", "gender", "address", "birth_day"),
          customerNullableTable
        )
      )
      salesSchema = await(
        readFileAndCreateView(
          orgId,
          oldJobId,
          getClass.getClassLoader.getResource("datasets/sales.csv").getPath,
          Array("id", "name", "gender", "address", "birth_day"),
          salesTable
        )
      )
      orderSchema = await(
        readFileAndCreateView(
          orgId,
          oldJobId,
          getClass.getClassLoader.getResource("datasets/orders.csv").getPath,
          Array("id", "product_id", "customer_id", "order_date", "profit"),
          orderTable
        )
      )
      productSchema = await(
        readFileAndCreateView(
          orgId,
          oldJobId,
          getClass.getClassLoader.getResource("datasets/products.csv").getPath,
          Array("id", "name", "quality", "type", "create_date"),
          productTable
        )
      )
    } catch {
      case ex: Throwable =>
        println(s"beforeAll:: error ${ex.getMessage}")
        ex.printStackTrace()
    }
  }

//  override def afterAll(): Unit = {
//    dropOldData()
//    super.afterAll()
//  }

  /**
    * Function create view from query
    */
  def readFileAndCreateView(
      orgId: OrganizationId,
      etlId: EtlJobId,
      path: String,
      headers: Array[String],
      tableConfig: TableConfiguration
  ): Future[TableSchema] = {
    val data = readData(path)
    createView(orgId, etlId, headers, data, tableConfig)
  }

  def buildQuery(headers: Array[String], data: Seq[Seq[String]]): String = {
    val queryItems = ArrayBuffer[String]()
    queryItems += buildHeaderQuery(headers, data.head)
    val allQueries = data.slice(1, data.length - 1).map(item => buildNormalQuery(item))
    queryItems.appendAll(allQueries)
    queryItems.mkString(" UNION ALL ")
  }

  def createView(
      orgId: OrganizationId,
      etlId: EtlJobId,
      headers: Array[String],
      data: Seq[Seq[String]],
      tableConfig: TableConfiguration
  ): Future[TableSchema] = {
    // use row for sample
    val query: String = buildQuery(headers, data.slice(0, 10))
    for {
      currentSchema <- tableService.creatView(orgId, etlId, SqlQuery(query), tableConfig, tableType = TableType.InMemory)
      _ <- insertData(currentSchema, data.drop(2).toSeq)
    } yield currentSchema
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

  def buildNormalQuery(data: Seq[String]): String = {
    val query = new StringBuilder()
    query.append("select ")
    query.append(data.map(text => s"'$text'").mkString(", "))
    query.toString()
  }

  def buildHeaderQuery(headers: Array[String], data: Seq[String]): String = {
    val query = new StringBuilder()
    query.append("select ")
    val newQuery: String = data.zipWithIndex
      .map {
        case (text: String, index) if index < headers.length => s"""'$text' as "${headers(index)}""""
        case (text: String, index)                           => s"'$text'"
        case _                                               => ""
      }
      .mkString(", ")
    query.append(newQuery)
    query.toString()
  }

  def readData(path: String): Seq[Seq[String]] = {
    Using(Source.fromFile(path))(source => {
      val buffer = ArrayBuffer[Seq[String]]()
      for (line <- source.getLines) {
        val data: Seq[String] = (line + " ").split(",").map(_.trim)
        buffer.append(data)
      }
      buffer.toSeq
    })
  }

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

  protected def assertQueryCount(countQuery: String, expectedTotal: Int): Unit = {
    val currentTotal: Int = client.executeQuery(countQuery)(rs => if (rs.next()) rs.getInt(1) else 0)
    assertResult(expectedTotal)(currentTotal)
  }

  protected def assertTableSchemaInfo(
      etlId: EtlJobId,
      schema: TableSchema,
      destTableConfig: TableConfiguration
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



  /**
   * init data for testing, chi quan tam toi so luong row de test.
   * Date support random in range [2020-12-12. 2022-12-31]
   */
  protected def initData(tableSchema: TableSchema,
                         size: Int) = {
    cookSchemaService.createTableSchema(tableSchema).syncGet()
    val rows = ArrayBuffer.empty[Seq[Any]]
    (0 until size).foreach(_ => {
      val row: Seq[Any] = generateRow(tableSchema.columns)
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

  private def generateRow(columns: Seq[Column]): Seq[Any] = {
    columns.map(column => {
      column match {
        case _: StringColumn => Random.alphanumeric.take(10).mkString
        case _ @ (_: Int8Column |_: Int16Column | _:Int32Column | _: Int64Column)    => Random.nextInt(500)
        case _ @ (_: UInt8Column |_: UInt16Column | _:UInt32Column | _: UInt64Column)    => Random.nextInt(500)
        case _ @ (_: FloatColumn |_: DoubleColumn)    => Random.nextDouble() + Random.nextLong()
        //  [2020-12-12. 2022-12-31]
        case _: DateColumn    => new Date(1607731200000L + Random.nextInt(1641600000))
        //  [2020-12-12. 2022-12-31]
        case _: DateTimeColumn => new Timestamp(1607731200000L + Random.nextInt(1641600000))
      }
    })
  }

}
