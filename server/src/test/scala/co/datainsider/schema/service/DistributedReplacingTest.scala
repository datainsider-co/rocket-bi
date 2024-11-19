//package co.datainsider.schema.service
//
//import co.datainsider.bi.client.JdbcClient.Record
//import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.schema.domain.{TableSchema, TableType}
//import co.datainsider.schema.domain.column._
//import co.datainsider.schema.module.SchemaTestModule
//import co.datainsider.schema.repository.{ClusteredDDLExecutor, DDLExecutor}
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import co.datainsider.caas.user_profile.module.MockCaasClientModule
//import com.google.inject.name.Names
//import org.scalatest.BeforeAndAfterAll
//
//import java.sql.ResultSet
//import java.util.concurrent.ThreadLocalRandom
//import scala.util.control.Breaks.{break, breakable}
//
///**
//  * @author tvc12 - Thien Vi
//  * @created 12/28/2021 - 5:14 PM
//  */
//class DistributedReplacingTest extends IntegrationTest with BeforeAndAfterAll {
//  override protected val injector: Injector =
//    TestInjector(SchemaTestModule, MockCaasClientModule, TestContainerModule).newInstance()
//  val ddlExecutor = injector.instance[DDLExecutor]
//  val client = injector.instance[JdbcClient](Names.named("clickhouse"))
//
//  val dbTest = "testdb"
//  val onePrimaryTableName = "events1"
//  val twoPrimaryTableName = "events2"
//  val threePrimaryTableName = "events3"
//
//  override protected def beforeAll(): Unit = {
//    super.beforeAll()
//    val isExisted = await(ddlExecutor.existsDatabaseSchema(dbTest))
//    if (isExisted)
//      await(ddlExecutor.dropDatabase(dbTest))
//  }
//
//  protected override def afterAll(): Unit = {
//    super.afterAll()
//    val dropOK = await(ddlExecutor.dropDatabase(dbTest))
//    assert(dropOK)
//  }
//
//  private def generateMockData(generators: Array[() => Any], numberRows: Int): Array[Record] = {
//    val results: Array[Record] = Range(0, numberRows)
//      .map(index => {
//        generators.map(generator => generator())
//      })
//      .toArray
//    results
//  }
//
//  private def getValue(rs: ResultSet, columnName: String): Int = {
//    if (rs.next()) {
//      rs.getInt(columnName)
//    } else {
//      0
//    }
//  }
//
//  test("Create databases") {
//    val isOK = await(ddlExecutor.createDatabase(dbTest))
//    assert(isOK)
//  }
//
//  test("Create replacing table 1 primary key") {
//
//    val createRequest = TableSchema(
//      onePrimaryTableName,
//      dbTest,
//      1L,
//      "TEST",
//      Seq(
//        Int32Column("id", "Id"),
//        StringColumn("name", "Name"),
//        DoubleColumn("profit", "profit")
//      ),
//      orderBys = Seq("id"),
//      primaryKeys = Seq("id"),
//      tableType = Some(TableType.Replacing)
//    )
//    val isOK = await(ddlExecutor.createTable(createRequest))
//    val isExists = await(ddlExecutor.existTableSchema(dbTest, onePrimaryTableName))
//    assert(isOK && isExists)
//  }
//
//  test("Insert & deduplicate table 1 primary key") {
//    Range(0, 100)
//      .foreach(_ => {
//        val data = generateMockData(
//          Array(
//            () => ThreadLocalRandom.current().nextInt(10000),
//            () => ThreadLocalRandom.current().nextInt().toString,
//            () => ThreadLocalRandom.current().nextDouble() * 10000
//          ),
//          10000
//        )
//        client.executeBatchUpdate(s"INSERT INTO `${dbTest}`.`${onePrimaryTableName}` VALUES(?, ?, ?)", data)
//      })
//
//    val isCompleted = waitUntilTableMergeCompleted(dbTest, onePrimaryTableName, Array("id"))
//    assertResult(true)(isCompleted)
//  }
//
//  test("Create replacing table 2 primary key") {
//
//    val createRequest = TableSchema(
//      twoPrimaryTableName,
//      dbTest,
//      1L,
//      "TEST",
//      Seq(
//        StringColumn("uuid", "user id"),
//        Int32Column("event_id", "event_id"),
//        StringColumn("name", "Name"),
//        DoubleColumn("profit", "profit")
//      ),
//      orderBys = Seq("uuid", "event_id"),
////      primaryKeys = Seq("uuid", "event_id"),
//      tableType = Some(TableType.Replacing)
//    )
//    val isOK = await(ddlExecutor.createTable(createRequest))
//    val isExists = await(ddlExecutor.existTableSchema(dbTest, twoPrimaryTableName))
//    assert(isOK && isExists)
//  }
//
//  test("Insert & deduplicate table 2 primary key") {
//    Range(0, 100)
//      .foreach(_ => {
//        val data = generateMockData(
//          Array(
//            () => ThreadLocalRandom.current().nextInt(10000).toString,
//            () => ThreadLocalRandom.current().nextInt(5000),
//            () => ThreadLocalRandom.current().nextInt().toString,
//            () => ThreadLocalRandom.current().nextDouble() * 1000
//          ),
//          10000
//        )
//        client.executeBatchUpdate(s"INSERT INTO `${dbTest}`.`${twoPrimaryTableName}` VALUES(?, ?, ?, ?)", data)
//      })
//
//    val isCompleted = waitUntilTableMergeCompleted(dbTest, twoPrimaryTableName, Array("uuid", "event_id"))
//    assertResult(true)(isCompleted)
//  }
//
//  test("Create replacing table 3 primary key") {
//
//    val createRequest = TableSchema(
//      threePrimaryTableName,
//      dbTest,
//      1L,
//      "TEST",
//      Seq(
//        Int64Column("id", "user id"),
//        StringColumn("user_type", "user type"),
//        StringColumn("code", "code"),
//        StringColumn("name", "Name"),
//        DoubleColumn("profit", "profit")
//      ),
//      orderBys = Seq("id", "user_type", "code"),
//      primaryKeys = Seq("id", "user_type", "code"),
//      tableType = Some(TableType.Replacing)
//    )
//    val isOK = await(ddlExecutor.createTable(createRequest))
//    val isExists = await(ddlExecutor.existTableSchema(dbTest, threePrimaryTableName))
//    assert(isOK && isExists)
//  }
//
//  // Function select an element base on index
//  // and return an element
//  def getRandom(list: Seq[Any]): Any = {
//    list(ThreadLocalRandom.current().nextInt(list.size))
//  }
//
//  test("Insert & deduplicate table 3 primary key") {
//    val listCode = Seq("user", "profile", "cat", "dog", "animal", "tiger")
//    val userType = Seq("admin", "Admin", "user", "staff", "guest", "baby")
//    Range(0, 100)
//      .foreach(_ => {
//        val data = generateMockData(
//          Array(
//            () => ThreadLocalRandom.current().nextInt(10000),
//            () => getRandom(userType),
//            () => getRandom(listCode),
//            () => ThreadLocalRandom.current().nextInt().toString,
//            () => ThreadLocalRandom.current().nextDouble() * 1000
//          ),
//          10000
//        )
//        client.executeBatchUpdate(s"INSERT INTO `${dbTest}`.`${threePrimaryTableName}` VALUES(?, ?, ?, ?, ?)", data)
//      })
//
//    val isCompleted = waitUntilTableMergeCompleted(dbTest, threePrimaryTableName, Array("id", "user_type", "code"))
//    assertResult(true)(isCompleted)
//  }
//
//  private def waitUntilTableMergeCompleted(
//      dbName: String,
//      tblName: String,
//      primaryKeys: Array[String],
//      maxRetryTimes: Int = 50
//  ): Boolean = {
//    var retryCount = 0
//    breakable {
//      do {
//        val nDuplicate = countDuplicateRows(dbName, tblName, primaryKeys)
//        if (nDuplicate == 0) {
//          break
//        } else {
//          retryCount += 1
//          info(s"waitUntilTableMergeCompleted:: ${dbName}.${tblName} - dup ${nDuplicate} - retry ${retryCount}")
//          Thread.sleep(2000)
//        }
//      } while (retryCount < maxRetryTimes)
//    }
//    if (retryCount >= maxRetryTimes) {
//      error(s"waitUntilTableMergeCompleted $dbName.$tblName in cluster failed!")
//      false
//    } else {
//      info(s"waitUntilTableMergeCompleted:: ${dbName}.${tblName} completed")
//      true
//    }
//  }
//
//  def countDuplicateRows(dbTest: String, tableName: String, primaryKeys: Array[String]): Int = {
//    val columnsAsString = primaryKeys.mkString(", ")
//    client.executeQuery(s"""
//                           |SELECT count(*) as TOTAL from
//                           |(
//                           | SELECT ${columnsAsString}
//                           | FROM `${dbTest}`.`${tableName}`
//                           | GROUP BY ${columnsAsString}
//                           | HAVING count(*) > 1
//                           |)
//                           |""".stripMargin)(getValue(_, "TOTAL"))
//  }
//}
