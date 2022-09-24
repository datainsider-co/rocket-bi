/*
package co.datainsider.client

import co.datainsider.bi.client.{HikariClient, NativeJDbcClient}
import co.datainsider.bi.util.ZConfig
import org.scalatest.FunSuite

class JdbcClientTest extends FunSuite {

  test("mysql client test") {
    val jdbcUrl: String = ZConfig.getString("database.mysql.url")
    val user: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")

    val client = HikariClient(jdbcUrl, user, password)
    val resp: Boolean = client.executeQuery("select 'hello'")(_.next())
    assert(resp)

  }

  test("clickhouse client test") {
    val jdbcUrl: String = ZConfig.getString("database.clickhouse.url")
    val user: String = ZConfig.getString("database.clickhouse.user")
    val password: String = ZConfig.getString("database.clickhouse.password")

    val client = NativeJDbcClient(jdbcUrl, user, password)
    val resp: Boolean = client.executeQuery("select 'hello'")(_.next())
    assert(resp)

  }

}
*/
