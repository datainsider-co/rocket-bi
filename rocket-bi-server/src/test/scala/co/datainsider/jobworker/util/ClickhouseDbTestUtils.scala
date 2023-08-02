package co.datainsider.jobworker.util

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.schema.domain.TableSchema

class ClickhouseDbTestUtils(jdbcUrl: String, user: String, password: String) {
  protected val clickHouseDDLConverter = new ClickHouseDDLConverter()
  protected val client = NativeJDbcClient(jdbcUrl, user, password)

  def getClient(): JdbcClient = {
    return client
  }

  def createDatabase(dbName: String): Unit = {
    val query = s"create database if not exists $dbName"
    client.executeUpdate(query)
  }

  // fixme: bad method
  def createTable(dbName: String, tblName: String): Unit = {
    val query: String =
      s"""
         |create table if not exists $dbName.$tblName(
         |id Int64,
         |name String,
         |address String,
         |age Int64,
         |birthday Date,
         |gender Int8,
         |average_score Float32,
         |email String
         |) ENGINE = MergeTree() ORDER BY (id)
         |""".stripMargin


    client.executeUpdate(query)
  }

  def createTable(tableSchema: TableSchema): Unit = {
    val sql = clickHouseDDLConverter.toCreateSQL(tableSchema)
    client.executeUpdate(sql) > 0
  }

  def dropDatabase(dbName: String): Unit = {
    val query = s"drop database if exists $dbName"
    client.executeUpdate(query)
  }
}
