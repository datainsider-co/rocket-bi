package co.datainsider.datacook.engine

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.engine.ClientManager
import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
import co.datainsider.bi.module.TestModule
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.misc.ClickHouseUtils
import com.twitter.inject.IntegrationTest

/**
  * created 2023-07-03 2:39 PM
  *
  * @author tvc12 - Thien Vi
  */

trait EngineIntegrateTest extends IntegrationTest {
  def assertQueryCount(countQuery: String, expectedTotal: Int): Unit

  def insertData(tableSchema: TableSchema, rows: Seq[Array[Any]]): Unit
}

trait ClickhouseIntegrateTest extends EngineIntegrateTest {
  val engine = new ClickhouseEngine(new ClientManager())
  val source: ClickhouseConnection = injector.instance[ClickhouseConnection]
  val client: JdbcClient = engine.createClient(source)

  override def afterAll(): Unit = {
    super.afterAll()
    client.close()
  }

  override def assertQueryCount(countQuery: String, expectedTotal: Int): Unit = {
    val total: Int = client.executeQuery(countQuery)(rs => {
      if (rs.next()) {
        rs.getInt(1)
      } else {
        0
      }
    })
    assert(total == expectedTotal)
  }

  override def insertData(tableSchema: TableSchema, rows: Seq[Array[Any]]): Unit = {
    val insertQuery =
      s"""INSERT INTO `${tableSchema.dbName}`.`${tableSchema.name}`(${tableSchema.columns
        .map(col => s"`${col.name}`")
        .mkString(",")})
         |VALUES (${tableSchema.columns.map(_ => "?").mkString(",")})""".stripMargin
    val insertedRows: Int = rows
      .map(ClickHouseUtils.normalizeToCorrespondingType(tableSchema.columns, _))
      .toArray
      .grouped(100000)
      .map(client.executeBatchUpdate(insertQuery, _))
      .sum
    println(s"Inserted `${tableSchema.dbName}`.`${tableSchema.name}`: $insertedRows rows")
  }
}
