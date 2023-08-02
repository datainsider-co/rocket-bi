package co.datainsider.datacook.util

import com.twitter.inject.Test

import java.io.File
import scala.collection.mutable.ArrayBuffer
import scala.language.postfixOps
import scala.sys.process._

/**
  * @author tvc12 - Thien Vi
  * @created 03/15/2022 - 3:25 PM
  */
class Clickhouse2CsvTest extends Test {
//  val host: String = "0.0.0.0"
//  val port: String = ZConfig.getString("db.clickhouse.port")
//  val user: String = ZConfig.getString("db.clickhouse.user")
//  val password: String = ZConfig.getString("db.clickhouse.password")
//
//  test("Write csv by clickhouse-client") {
//    val testFile = new File("cat.csv")
//    val cmd = ArrayBuffer(
//      "clickhouse-client",
//      s"--host=$host",
//      s"--port=$port",
//      s"--user=$user",
//      s"--query=select 1 as id, 'Thien Vi' as name, toDateTime('2021-10-10 10:10:10') as date_time",
//      "--format=CSVWithNames"
//    )
//    if (password.nonEmpty) {
//      cmd += s"--password=$password"
//    }
//    cmd.#>(testFile).!
//
//    val text = new String(Files.readAllBytes(testFile.toPath), StandardCharsets.UTF_8)
//    assertResult(text.nonEmpty)(true)
//    testFile.deleteOnExit()
//  }

  test("zip file") {
    val zipCmd = ArrayBuffer(
      "zip",
      "-j",
      "file.zip",
      getClass.getClassLoader.getResource("datasets/customers2.csv").getPath,
      getClass.getClassLoader.getResource("datasets/customers.csv").getPath
    )
    println(s"zip file cmd ${zipCmd}")
    val process: String = zipCmd.!!
    val file: File = new File("file.zip")
    assert(file.isFile)
    assert(file.exists())
    file.delete()
  }
}
