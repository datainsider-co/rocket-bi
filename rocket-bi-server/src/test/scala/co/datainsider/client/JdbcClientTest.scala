package co.datainsider.client

import co.datainsider.bi.client.NativeJDbcClient
import co.datainsider.bi.engine.vertica.VerticaConnection
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.util.ZConfig
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class JdbcClientTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestContainerModule).create

  test("mysql client test") {
    val jdbcUrl: String = injector.instance[String](Names.named("mysql_jdbc_url"))
    val user: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")

    val client = NativeJDbcClient(jdbcUrl, user, password)
    val resp: Boolean = client.executeQuery("select 'hello'")(_.next())
    assert(resp)

  }

  test("clickhouse client test") {
    val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
    println(jdbcUrl)
    val user: String = ZConfig.getString("database.clickhouse.user")
    val password: String = ZConfig.getString("database.clickhouse.password")
    val client = NativeJDbcClient(jdbcUrl, user, password)

    val resp: Boolean = client.executeQuery("select 'hello'")(rs => {
      if (rs.next()) {
        println(rs.getString(1))
      }
      true
    })

    assert(resp)

  }

  test("vertica client test") {
    val connection: VerticaConnection = injector.instance[VerticaConnection]
    val client = NativeJDbcClient(connection.jdbcUrl, connection.username, connection.password)

    client.executeQuery("select 'hello'")(rs => {
      if (rs.next()) {
        println("select data from vertica: " + rs.getString(1))
        assert(rs.getString(1) == "hello")
      } else {
        fail("select data from vertica failed")
      }
    })
  }

//  test("clickhouse client select to csv") {
//    val clickhouseSource: ClickhouseSource = injector.instance[ClickhouseSource]
//    val clickhouseHost = clickhouseSource.host
//    val clickhousePort = clickhouseSource.tcpPort
//    val clickhouseUsername = clickhouseSource.username
//    val clickhousePassword = clickhouseSource.password
//
//    val filePath = s"./tmp/sales_${System.currentTimeMillis()}.csv"
//    new File(filePath).getParentFile.mkdirs()
//    val selectQuery = "select 1 as sales_id, 'tvc12' as name"
//    val exportQuery = s"$selectQuery into outfile '$filePath' format CSV"
//
//    val cmd = ArrayBuffer(
//      "clickhouse-client",
//      s"--host=$clickhouseHost",
//      s"--port=$clickhousePort",
//      s"--user=$clickhouseUsername",
//      s"--query=$exportQuery"
//    )
//
//    if (clickhousePassword.nonEmpty) cmd += s"--password=$clickhousePassword"
//
//    var processLog = ""
//    val processLogger = ProcessLogger(log => {
//      processLog += s"\n$log"
//    })
//
//    val exitValue: Int = Process(cmd).run(processLogger).exitValue()
//    if (exitValue == 0) {
//      info(s"csv file written")
//    } else {
//      throw DbExecuteError(s"got error when export data to csv, log: $processLog")
//    }
//
//  }
//
//  test("test find and delete") {
//    val cmd = ArrayBuffer(
//      "find",
//      "./tmp/",
//      "-cmin",
//      "+0",
//      "-delete"
//    )
//
//    var processLog = ""
//    val processLogger = ProcessLogger(log => {
//      processLog += s"\n$log"
//    })
//
//    val exitValue: Int = Process(cmd).run(processLogger).exitValue()
//    if (exitValue == 0) {
//      info(s"clean up tmp csv file success")
//    } else {
//      throw DbExecuteError(s"got error when delete temp csv files, log: $processLog")
//    }
//
//  }

}
