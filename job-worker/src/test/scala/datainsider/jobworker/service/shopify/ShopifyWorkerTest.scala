package datainsider.jobworker.service.shopify

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.module.{LakeClientModule, MockSchemaClientModule}
import datainsider.client.service.{LakeClientService, MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.domain.JobProgress
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.util.{ClickhouseDbTestUtils, ZConfig}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.BeforeAndAfterAll

abstract class ShopifyWorkerTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule, LakeClientModule).newInstance()

  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
  val lakeService: LakeClientService = injector.instance[LakeClientService]
  val destDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")

  val apiUrl = ZConfig.getString("database_test.shopify.api_url")
  val accessToken = ZConfig.getString("database_test.shopify.access_token")
  val apiVersion = ZConfig.getString("database_test.shopify.api_version")

  val jdbcUrl: String = ZConfig.getString("database_test.clickhouse.url")
  val username: String = ZConfig.getString("database_test.clickhouse.username")
  val password: String = ZConfig.getString("database_test.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)

  val dbName = ZConfig.getString("fake_data.database.default.name")
  /**
   * create table schema before run testcase
   */
  protected def ensureTableSchema()

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(dbName)
    ensureTableSchema()
    super.beforeAll()
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(dbName)
    super.afterAll()
  }

  def reportJob(jobProgress: JobProgress): Future[Unit] = {
    println(s"report job of job_id: ${jobProgress.jobId} is ${jobProgress}")
    Future.Unit
  }

  def count(dbName: String, tblName: String): Long = {
    val query = s"select count(*) from $dbName.$tblName"
    dbTestUtils.getClient().executeQuery(query)(rs => {
      if (rs.next()) {
        return rs.getLong(1)
      } else {
        return 0L
      }
    })
  }

  def ensureTableCreated(table: TableSchema): Unit = {
    val columns = table.columns.map(_.name).mkString(",")
    val query = s"select ${columns} from ${table.dbName}.${table.name} limit 1"
    dbTestUtils.getClient().executeQuery(query)(rs => {
      while (rs.next()) {
        println(s"ensure table created running, print first row of ${table.name}")
        table.columns.foreach(column => {
          println(s"> ${column.name}: ${rs.getObject(column.name)}")
        })
      }
    })
  }

  def getLatestId(dbName: String, tblName: String, fieldIdName: String): Long = {
    val query = s"select max(${fieldIdName}) from $dbName.$tblName"
    dbTestUtils.getClient().executeQuery(query)(rs => {
      if (rs.next()) {
        return rs.getLong(1)
      } else {
        return -1L
      }
    })
  }
}
