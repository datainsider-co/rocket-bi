package co.datainsider.datacook.util

import co.datainsider.datacook.domain.persist.{OracleJdbcPersistConfiguration, PersistentType}
import com.twitter.inject.Test
import org.apache.commons.io.FileUtils

import java.io.File
import java.nio.charset.StandardCharsets
import java.util.Base64

/**
  * @author tvc12 - Thien Vi
  * @created 03/08/2022 - 10:46 AM
  */
// Đóng testcase vì không dựng được môi trường test, test case vẫn work khi điền đủ thông tin
class SSLJdbcTest extends Test {
  val keyStoreData = new String(
    Base64.getEncoder.encode(
      FileUtils.readFileToByteArray(new File(getClass.getClassLoader.getResource("keys/key.jks").getPath))
    ),
    StandardCharsets.UTF_8
  )
  val trustStoreData = new String(
    Base64.getEncoder.encode(
      FileUtils.readFileToByteArray(new File(getClass.getClassLoader.getResource("keys/key.jks").getPath))
    ),
    StandardCharsets.UTF_8
  )
  val config = new OracleJdbcPersistConfiguration(
    host = "",
    port = 1522,
    serviceName = "",
    username = "",
    password = "",
    databaseName = "",
    tableName = "",
    persistType = PersistentType.Replace,
//    sslConfiguration = Some(
//      new JKSConfiguration(
//        trustStore = KeyStoreConfiguration(1, data = trustStoreData, password = "KS@hMCV9r4pTure", `type` = "JKS", algorithm = Algorithm.Base64, fileName = "truststore.jsk"),
//        keyStore = KeyStoreConfiguration(1, data = keyStoreData, password = "KS@hMCV9r4pTure", `type` = "JKS", algorithm = Algorithm.Base64, fileName = "keystore.jsk"),
//        protocol = "tcps"
//      )
//    ),
    sslServerCertDn = "",
    retryCount = 5,
    retryDelay = 2
  )

//  test("test ssl connection") {
//    val client = new NativeJdbcClient(config.jdbcUrl, config.properties)
//    val result = client.getConnection().isValid(10)
//    assertResult(true)(result)
//    val querySuccess = client.executeQuery("select 1 from dual")(_.next())
//    assertResult(true)(querySuccess)
//  }
//
//  test("test list database") {
//    val handler = ThirdPartyMetaDataHandler(config)
//    val listDatabase = await(handler.listDatabases())
//    println(listDatabase)
//    assertResult(true)(listDatabase.total >= 0)
//  }
//
//  test("test list table") {
//    val handler = ThirdPartyMetaDataHandler(config)
//    val listDatabase = await(handler.listTables(config.username))
//    println(listDatabase)
//    assertResult(true)(listDatabase.total >= 0)
//  }
}
