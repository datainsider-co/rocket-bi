// fixme: this test is not working
//package co.datainsider.jobworker.service.handlers
//
//import co.datainsider.jobworker.domain.DatabaseType
//import co.datainsider.jobworker.domain.source.JdbcSource
//import co.datainsider.jobworker.service.handler.SourceMetadataHandler
//import co.datainsider.bi.util.ZConfig
//import com.twitter.util.Await
//import org.scalatest.FunSuite
//
//class VerticalHandlerTest extends FunSuite {
//
//  val jdbcUrl: String = ZConfig.getString("test_db.mssql.url")
//  val username: String = ZConfig.getString("test_db.mssql.username")
//  val password: String = ZConfig.getString("test_db.mssql.password")
//
//  val source: JdbcSource = JdbcSource(
//    1,
//    id = 0L,
//    displayName = "DI Vertica",
//    databaseType = DatabaseType.Vertica,
//    jdbcUrl = "jdbc:vertica://localhost:5433/",
//    username = "vertica",
//    password = "di@2020!"
//  )
//
//  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)
//
//  // fixme: test case nay khong the chay duoc do khong dung duoc moi truong vertica.
//
//  test("vertica test connection") {
//    val connected = Await.result(sourceHandler.testConnection())
//    assert(connected)
//  }
//
//  test("vertica list db") {
//    val databases: Seq[String] = Await.result(sourceHandler.listDatabases())
//    assert(databases.nonEmpty)
//    assert(databases.contains("public"))
//    println(databases.mkString(", "))
//  }
//
//  test("vertica list table") {
//    val tables: Seq[String] = Await.result(sourceHandler.listTables("public"))
//    assert(tables.nonEmpty)
//    assert(tables.contains("customer_dimension"))
//    println(tables.mkString(", "))
//  }
//
//  test("vertica list column") {
//    val tables: Seq[String] = Await.result(sourceHandler.listColumn("public", "customer_dimension"))
//    assert(tables.nonEmpty)
//    assert(tables.contains("customer_key"))
//    println(tables.mkString(", "))
//  }
//}
