package co.datainsider.query

import java.sql.ResultSetMetaData
import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.response.SqlQueryResponse
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.util.{Using, ZConfig}

import scala.collection.mutable.ArrayBuffer
import scala.io.Source

object DbTestUtils {

  val dbName: String = ZConfig.getString("fake_data.database.name")
  val tblCustomers: String = ZConfig.getString("fake_data.table.customers.name")
  val tblOrders: String = ZConfig.getString("fake_data.table.orders.name")
  val tblProducts: String = ZConfig.getString("fake_data.table.products.name")
  val tblActivities: String = ZConfig.getString("fake_data.table.activities.name")
  val tblSales: String = ZConfig.getString("fake_data.table.sales.name", "sales")
  val tblUserActivities: String = ZConfig.getString("fake_data.table.user_activities.name", "user_activities")

  val client: JdbcClient = TestModule.provideClickhouseClient()

  def setUpTestDb(): Unit = {
    client.executeUpdate(s"create database if not exists $dbName")

    client.executeUpdate(s"""
         |create table if not exists $dbName.$tblCustomers (
         |id UInt32,
         |name String,
         |address String,
         |dob Datetime
         |) engine = MergeTree()
         |partition by toYear(dob)
         |order by id;
         |""".stripMargin)

    client.executeUpdate(s"""
         |create table if not exists $dbName.$tblProducts (
         |id UInt32,
         |name String,
         |price UInt64,
         |seller String,
         |created_date Datetime,
         |country String
         |) engine = MergeTree()
         |partition by seller
         |order by id;
         |""".stripMargin)

    client.executeUpdate(s"""
         |create table if not exists $dbName.$tblOrders (
         |id UInt32,
         |customer_id UInt32,
         |product_id UInt32,
         |created_date Datetime
         |) engine = MergeTree()
         |partition by toYYYYMM(created_date)
         |order by id;
         |""".stripMargin)

    client.executeUpdate(
      s"""
         |create table if not exists $dbName.$tblActivities (
         |user_id String,
         |action String,
         |duration UInt32,
         |occurred_at DateTime
         |) engine = MergeTree()
         |order by occurred_at;
         |""".stripMargin
    )

    client.executeUpdate(
      s"""
         |create table if not exists $dbName.$tblSales (
         |  Region String,
         |  Country String,
         |  Item_Type String,
         |  Sales_Channel String,
         |  Order_Priority String,
         |  Order_Date Datetime,
         |  Order_ID UInt32,
         |  Ship_Date Datetime,
         |  Unit_Sold UInt32,
         |  Unit_Price Float64,
         |  Unit_Cost Float64,
         |  Total_Revenue Float64,
         |  Total_Cost Float64,
         |  Total_Profit Float64
         |) engine = MergeTree()
         |order by Order_Date
         |""".stripMargin
    )

  }

  def cleanUpTestDb(): Unit = { client.executeUpdate(s"drop database $dbName") }

  def insertFakeData(): Unit = {
    insertCustomers()
    insertProducts()
    insertOrders()
    insertActivities()
    insertSales()
  }

  private def insertCustomers(): Unit = {
    val customersCsv = Source.fromFile("test-data/customers.csv")
    for (line <- customersCsv.getLines) {
      val Array(id, name, address, dob) = line.split(",").map(_.trim)
      client.executeUpdate(s"""
           |insert into $dbName.$tblCustomers values($id, '$name', '$address', '$dob')
           |""".stripMargin)
    }
    customersCsv.close
  }

  private def insertProducts(): Unit = {
    val productsCsv = Source.fromFile("test-data/products.csv")
    for (line <- productsCsv.getLines) {
      val Array(id, name, price, seller, createdDate, country) = line.split(",").map(_.trim)
      client.executeUpdate(s"""
           |insert into $dbName.$tblProducts values($id, '$name', $price, '$seller', '$createdDate', '$country')
           |""".stripMargin)
    }
    productsCsv.close
  }

  private def insertOrders(): Unit = {
    val ordersCsv = Source.fromFile("test-data/orders.csv")
    for (line <- ordersCsv.getLines) {
      val Array(id, customerId, productId, createdDate) = line.split(",").map(_.trim)
      client.executeUpdate(s"""
           |insert into $dbName.$tblOrders values($id, $customerId, $productId, '$createdDate')
           |""".stripMargin)
    }
    ordersCsv.close
  }

  def insertActivities(): Unit = {
    val activitiesCsv = Source.fromFile("test-data/activities.csv")
    for (line <- activitiesCsv.getLines) {
      val Array(userId, action, duration, occurredAt) = line.split(",").map(_.trim)
      client.executeUpdate(s"""
           |insert into $dbName.$tblActivities values('$userId', '$action', $duration, '$occurredAt')
           |""".stripMargin)
    }
    activitiesCsv.close()
  }

  def insertSales(): Unit = {
    Using(Source.fromFile("test-data/sales.csv"))(function = source => {
      val lines = source.getLines()

      while (lines.hasNext) {
        val rowAsString: String = lines.next().split(",").map(normalizeCsvValue).mkString(",")
        client.executeUpdate(s"insert into $dbName.$tblSales values ($rowAsString)")
      }

    })

  }

  def execute(query: String): SqlQueryResponse = {
    client.executeQuery(query)(rs => {
      val metadata: ResultSetMetaData = rs.getMetaData
      val colCount = metadata.getColumnCount
      val colNames = ArrayBuffer[String]()
      for (i <- 1 to colCount)
        colNames += metadata.getColumnName(i)
      val rows = ArrayBuffer[Array[Object]]()

      while (rs.next()) {
        val row = ArrayBuffer[Object]()
        colNames.foreach(c => row += rs.getObject(c))
        rows += row.toArray
      }

      SqlQueryResponse(headers = colNames.toArray, records = rows.toArray)
    })
  }

  def normalizeCsvValue(value: String): String = {
    val escapeQuoteStr = value
      .replace('\"', ' ')
      .replace('\'', ' ')
      .trim
    s"'$escapeQuoteStr'"
  }

  def setupActivityTbl(): Unit = {
    client.executeUpdate(s"""
        |create database if not exists $dbName
        |""".stripMargin)

    client.executeUpdate(s"""
        |CREATE TABLE IF NOT EXISTS $dbName.$tblUserActivities
        |(
        |    `timestamp` UInt64,
        |    `org_id` Nullable(UInt16),
        |    `username` Nullable(String),
        |    `action_name` Nullable(String),
        |    `action_type` Nullable(String),
        |    `resource_type` Nullable(String),
        |    `remote_host` Nullable(String),
        |    `remote_address` Nullable(String),
        |    `method` Nullable(String),
        |    `path` Nullable(String),
        |    `param` Nullable(String),
        |    `status_code` Nullable(UInt16),
        |    `request_size` Nullable(UInt16),
        |    `request_content` Nullable(String),
        |    `response_size` Nullable(UInt16),
        |    `response_content` Nullable(String),
        |    `execution_time` Nullable(UInt16),
        |    `message` Nullable(String)
        |)
        |ENGINE MergeTree()
        |ORDER BY timestamp
        |""".stripMargin)

    val values = Seq(
      System.currentTimeMillis(),
      0,
      "root",
      "CreateDashboardRequest",
      "Create",
      "Dashboard",
      "127.0.0.1",
      "localhost",
      "POST",
      "/api/dashboard/create",
      "",
      200,
      100,
      "{\"name\": \"new dashboard\"}",
      110,
      "{\"id\": 0, \"name\": \"new dashboard\"}",
      50,
      "create new dashboard with name \"new dashboard\""
    )

    client.executeUpdate(
      s"""
          |insert into $dbName.$tblUserActivities values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          |""".stripMargin,
      values: _*
    )
  }

  def cleanUpActivityTbl(): Unit = {
    client.executeUpdate(s"""
        |drop table if exists $dbName.$tblUserActivities
        |""".stripMargin)
  }

}
