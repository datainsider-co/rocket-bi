package datainsider.ingestion.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.JsonParser
import datainsider.ingestion.domain._
import datainsider.ingestion.module.{MockHadoopFileClientModule, TestModule}
import datainsider.ingestion.repository.{DDLExecutor, DataRepository}
import datainsider.ingestion.util.Implicits._
import org.scalatest.BeforeAndAfterAll

import java.{util => ju}

/**
  * @author andy
  * @since 7/10/20
  */
class DataRepositoryTest extends IntegrationTest with BeforeAndAfterAll {

  override protected val injector: Injector =
    TestInjector(MockCaasClientModule, TestModule, MockHadoopFileClientModule).newInstance();

  val schemaExecutor = injector.instance[DDLExecutor]
  val dataRepository = injector.instance[DataRepository]
  val tableSchema = TableSchema(
    dbName = "default",
    name = "transaction_write_test",
    organizationId = 1L,
    displayName = "User Transaction",
    columns = Seq(
      Int32Column("id", "Id"),
      DateTimeColumn(
        "created_date",
        "Created Date",
        inputFormats = Seq(
          "yyyy-MM-dd HH:mm:ss"
        )
      ),
      StringColumn("location", "Location"),
      StringColumn("shop", "Shop"),
      Int64Column("sale", "Sale"),
      StringColumn("f1", "Extra fields"),
      StringColumn("f2", "Extra fields"),
      StringColumn("f3", "Extra fields"),
      StringColumn("f4", "Extra fields"),
      StringColumn("f5", "Extra fields"),
      StringColumn("f6", "Extra fields"),
      StringColumn("f7", "Extra fields"),
      StringColumn("f8", "Extra fields"),
      StringColumn("f9", "Extra fields"),
      StringColumn("f10", "Extra fields"),
      StringColumn("f11", "Extra fields"),
      StringColumn("f12", "Extra fields"),
      StringColumn("f13", "Extra fields"),
      StringColumn("f14", "Extra fields"),
      StringColumn("f15", "Extra fields"),
      StringColumn("f16", "Extra fields"),
      StringColumn("f17", "Extra fields"),
      StringColumn("f18", "Extra fields"),
      StringColumn("f19", "Extra fields"),
      StringColumn("f20", "Extra fields"),
      StringColumn("f21", "Extra fields"),
      StringColumn("f22", "Extra fields"),
      StringColumn("f23", "Extra fields"),
      StringColumn("f24", "Extra fields"),
      StringColumn("f25", "Extra fields"),
      StringColumn("f26", "Extra fields"),
      StringColumn("f27", "Extra fields"),
      StringColumn("f28", "Extra fields"),
      StringColumn("f29", "Extra fields"),
      StringColumn("f30", "Extra fields"),
      StringColumn("f31", "Extra fields"),
      StringColumn("f32", "Extra fields"),
      StringColumn("f33", "Extra fields"),
      StringColumn("f34", "Extra fields"),
      StringColumn("f35", "Extra fields"),
      StringColumn("f36", "Extra fields"),
      StringColumn("f37", "Extra fields"),
      StringColumn("f38", "Extra fields"),
      StringColumn("f39", "Extra fields"),
      StringColumn("f40", "Extra fields"),
      StringColumn("f41", "Extra fields"),
      StringColumn("f42", "Extra fields"),
      StringColumn("f43", "Extra fields"),
      StringColumn("f44", "Extra fields"),
      StringColumn("f45", "Extra fields"),
      StringColumn("f46", "Extra fields"),
      StringColumn("f47", "Extra fields"),
      StringColumn("f48", "Extra fields"),
      StringColumn("f49", "Extra fields"),
      StringColumn("f50", "Extra fields")
    )
  )
  override protected def beforeAll(): Unit = {

    val r = schemaExecutor.createTable(tableSchema).syncGet

    assertResult(true)(r)
  }

  override protected def afterAll(): Unit = {
    val r = schemaExecutor.dropTable(tableSchema.dbName, tableSchema.name).syncGet
    assertResult(true)(r)
  }

  test("Write 1000 records") {
    val count = 500
    val records = buildRecords(count)
    val r = dataRepository.writeRecords(tableSchema, records, 1000).syncGet()

    println(JsonParser.toJson(r))

    assertResult(count)(r)

  }

  // Be Careful
  // This testcase takes a really long time to complete
//  test("Write 150k records by using Recursion") {
//    var count = 0
//    val records = buildRecords(1000)
//    for (i <- 0 to 150) {
//
//      val r = dataRepository.writeRecords(tableSchema, records, 1000).syncGet()
//      count = count + r
//      println(s"$r => $count in total")
//
//      assertResult(1000)(r)
//    }
//
//  }

  def buildRecords(count: Int): Seq[Seq[Any]] = {
    List
      .fill[Seq[Any]](count) {
        Seq(
          10,
          new java.sql.Timestamp(System.currentTimeMillis()),
          "Ho Chi Minh",
          "PT2000",
          67
        ) ++ List.fill(50)(createReallyLongText()).toSeq
      }
      .toSeq
  }

  //2k chars
  def createReallyLongText(): String = {
    List.fill(56)(ju.UUID.randomUUID().toString()).mkString(",")
  }

}
