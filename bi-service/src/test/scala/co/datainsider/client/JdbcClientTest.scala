//package co.datainsider.client
//
//import co.datainsider.bi.client.{HikariClient, NativeJDbcClient}
//import co.datainsider.bi.util.ZConfig
//import datainsider.client.exception.DbExecuteError
//import org.scalatest.FunSuite
//
//import scala.collection.mutable.ArrayBuffer
//import scala.sys.process.{Process, ProcessLogger}
//
//class JdbcClientTest extends FunSuite {
//
//  test("mysql client test") {
//    val jdbcUrl: String = ZConfig.getString("database.mysql.url")
//    val user: String = ZConfig.getString("database.mysql.user")
//    val password: String = ZConfig.getString("database.mysql.password")
//
//    val client = HikariClient(jdbcUrl, user, password)
//    val resp: Boolean = client.executeQuery("select 'hello'")(_.next())
//    assert(resp)
//
//  }
//
//  test("clickhouse client test") {
//    val jdbcUrl: String = ZConfig.getString("database.clickhouse.url")
//    val user: String = ZConfig.getString("database.clickhouse.user")
//    val password: String = ZConfig.getString("database.clickhouse.password")
//
//    val client = NativeJDbcClient(jdbcUrl, user, password)
//    val resp: Boolean = client.executeQuery("select 'hello'")(_.next())
//    assert(resp)
//
//  }
//
//  test("clickhouse client select to csv") {
//    val clickhouseHost = "localhost"
//    val clickhousePort = "9000"
//    val clickhouseUsername = "default"
//    val clickhousePassword = ""
//
//    val filePath = "sales2"
//    val selectQuery = "select * from test.sales"
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
//      "/home/nkthien/test/clickhouse-cluster/tmp/",
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
//
//}
