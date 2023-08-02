package co.datainsider.bi.utils

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.response.SqlQueryResponse
import co.datainsider.bi.util.{Using, ZConfig}

import java.sql.ResultSetMetaData
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


  def setUpTestDb(client: JdbcClient): Unit = {
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

  def cleanUpTestDb(client: JdbcClient): Unit = {
    client.executeUpdate(s"drop database $dbName")
  }

  def insertFakeData(client: JdbcClient): Unit = {
    insertCustomers(client)
    insertProducts(client)
    insertOrders(client)
    insertActivities(client)
    insertSales(client)
  }

  private def insertCustomers(client: JdbcClient): Unit = {
    val customerCsvPath: String = getClass.getClassLoader.getResource("datasets/test-data/customers.csv").getFile
    val records: Array[Record] = readCsvFile(customerCsvPath)
    val query: String = s"""insert into $dbName.$tblCustomers values(?, ?, ?, ?)"""
    client.executeBatchUpdate(query, records)
  }

  private def insertProducts(client: JdbcClient): Unit = {
    val productsCsvPath: String = getClass.getClassLoader.getResource("datasets/test-data/products.csv").getFile
    val records: Array[Record] = readCsvFile(productsCsvPath)
    val query: String = s"""insert into $dbName.$tblProducts values(?, ?, ?, ?, ?, ?)"""
    client.executeBatchUpdate(query, records)
  }

  private def insertOrders(client: JdbcClient): Unit = {
    val ordersCsvPath: String = getClass.getClassLoader.getResource("datasets/test-data/orders.csv").getFile
    val records: Array[Record] = readCsvFile(ordersCsvPath)
    val query: String = s"""insert into $dbName.$tblOrders values(?, ?, ?, ?)"""
    client.executeBatchUpdate(query, records)
  }

  def insertActivities(client: JdbcClient): Unit = {
    val activeUsersCsvPath: String = getClass.getClassLoader.getResource("datasets/test-data/activities.csv").getFile
    val records: Array[Record] = readCsvFile(activeUsersCsvPath)
    val query: String = s"""insert into $dbName.$tblActivities values(?, ?, ?, ?)"""
    client.executeBatchUpdate(query, records)
  }

  def insertSales(client: JdbcClient): Unit = {
    val filePath: String = getClass.getClassLoader.getResource("datasets/test-data/sales.csv").getFile
    val records: Array[Record] = readCsvFile(filePath)
    val query: String = s"""insert into $dbName.$tblSales values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
    client.executeBatchUpdate(query, records)
  }

  private def readCsvFile(csvPath: String): Array[Record] = {
    Using(Source.fromFile(csvPath)) {
      source => {
        val records = ArrayBuffer[Record]()
        for (line <- source.getLines) {
          records += line.split(",").map(text => {
            if (text != null) {
              text
                .replace('\"', ' ')
                .replace('\'', ' ')
                .trim
            } else {
                null
            }
          })
        }
        records.toArray
      }
    }
  }

  def execute(client: JdbcClient, query: String): SqlQueryResponse = {
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

  def setupActivityTbl(client: JdbcClient): Unit = {
    client.executeUpdate(s"""
         |create database if not exists di_system
         |""".stripMargin)

    client.executeUpdate(s"""
         |CREATE TABLE IF NOT EXISTS di_system.user_activities
         |(
         |    `timestamp` UInt64,
         |    `org_id` Nullable(UInt16),
         |    `username` Nullable(String),
         |    `action_name` Nullable(String),
         |    `action_type` Nullable(String),
         |    `resource_type` Nullable(String),
         |    `resource_id` Nullable(String),
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

  }

}
