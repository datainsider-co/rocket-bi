package co.datainsider.jobworker.service.shopify

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.JobProgress
import co.datainsider.jobworker.module.JobWorkerTestModule
import co.datainsider.jobworker.util.ClickhouseDbTestUtils
import co.datainsider.schema.client.{MockSchemaClientService, SchemaClientService}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.module.MockSchemaClientModule
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
import datainsider.client.service.LakeClientService
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.{BeforeAndAfterAll, Ignore}

@Ignore
abstract class ShopifyWorkerTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(
    JobWorkerTestModule,
    MockHadoopFileClientModule,
    MockLakeClientModule,
    MockSchemaClientModule,
    TestContainerModule
  ).newInstance()
  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
  val lakeService: LakeClientService = injector.instance[LakeClientService]
  val destDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")
  val apiUrl = ZConfig.getString("test_db.shopify.api_url")
  val accessToken = ZConfig.getString("test_db.shopify.access_token")
  val apiVersion = ZConfig.getString("test_db.shopify.api_version")
  val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
  val username: String = ZConfig.getString("test_db.clickhouse.username")
  val password: String = ZConfig.getString("test_db.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)
  val dbName = ZConfig.getString("fake_data.database.default.name")

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
    dbTestUtils
      .getClient()
      .executeQuery(query)(rs => {
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
    dbTestUtils
      .getClient()
      .executeQuery(query)(rs => {
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
    dbTestUtils
      .getClient()
      .executeQuery(query)(rs => {
        if (rs.next()) {
          return rs.getLong(1)
        } else {
          return -1L
        }
      })
  }

  /**
    * create table schema before run testcase
    */
  protected def ensureTableSchema()
}
