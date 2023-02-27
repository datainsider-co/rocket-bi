package datainsider.jobworker.util

import datainsider.jobworker.client.NativeJdbcClient
import java.sql.ResultSetMetaData
import scala.collection.mutable.ArrayBuffer
import scala.io.Source

abstract class AbstractDbUtils(jdbcUrl: String, user: String, password: String) {
  protected val client: NativeJdbcClient = NativeJdbcClient(jdbcUrl, user, password)
  protected val db: String = ZConfig.getString("fake_data.database.default.name")
  protected val tblCustomers: String = ZConfig.getString("fake_data.table.customers.name")
  protected val tblOrders: String = ZConfig.getString("fake_data.table.orders.name")
  protected val tblProducts: String = ZConfig.getString("fake_data.table.products.name")

  def setUpTestDb()
  def cleanUpTestDb()
  def insertFakeData(): Unit = {
    insertCustomers()
    insertProducts()
    insertOrders()
  }
  private def insertCustomers(): Unit = {
    val customersCsv = Source.fromFile("data/customers.csv")
    for (line <- customersCsv.getLines) {
      val Array(id, name, address, dob) = line.split(",").map(_.trim)
      client.executeUpdate(s"""
                              |insert into $db.$tblCustomers values($id, '$name', '$address', '$dob')
                              |""".stripMargin)
    }
    customersCsv.close
  }

  private def insertProducts(): Unit = {
    val productsCsv = Source.fromFile("data/products.csv")
    for (line <- productsCsv.getLines) {
      val Array(id, name, price, seller, createdDate, country) = line.split(",").map(_.trim)
      client.executeUpdate(s"""
                              |insert into $db.$tblProducts values($id, '$name', $price, '$seller', '$createdDate', '$country')
                              |""".stripMargin)
    }
    productsCsv.close
  }

  private def insertOrders(): Unit = {
    val ordersCsv = Source.fromFile("data/orders.csv")
    for (line <- ordersCsv.getLines) {
      val Array(id, customerId, productId, createdDate, total) = line.split(",").map(_.trim)
      client.executeUpdate(s"""
                              |insert into $db.$tblOrders values($id, $customerId, $productId, '$createdDate', $total)
                              |""".stripMargin)
    }
    ordersCsv.close
  }
}

class MysqlDbTestUtils(jdbcUrl: String, user: String, password: String) extends AbstractDbUtils(jdbcUrl: String, user: String, password: String) {


  val createTableQuery: Seq[String] =
    Seq(
      s"""
         |create table if not exists $db.$tblCustomers (
         |id Int,
         |name varchar(100),
         |address varchar(100),
         |dob datetime
         |)
         |""".stripMargin,
      s"""
         |create table if not exists $db.$tblProducts (
         |id Int,
         |name varchar(100),
         |price Int,
         |seller varchar(100),
         |created_date datetime,
         |country varchar(100)
         |)
         |""".stripMargin,
      s"""
         |create table if not exists $db.$tblOrders (
         |id Int,
         |customer_id Int,
         |product_id Int,
         |created_date datetime,
         |total_price float
         |)
         |""".stripMargin
    )

  override def setUpTestDb(): Unit = {
    client.executeUpdate(s"create database if not exists $db")
    createTableQuery.foreach(query => client.executeUpdate(query))
  }

  override def cleanUpTestDb(): Unit = {
    client.executeUpdate(s"drop database $db")
  }
}
