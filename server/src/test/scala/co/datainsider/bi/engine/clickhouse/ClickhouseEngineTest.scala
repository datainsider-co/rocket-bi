package co.datainsider.bi.engine.clickhouse

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.{ClickhouseConnection, SshConfig, SshKeyPair}
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.bi.service.TunnelSession
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.bi.utils.DbTestUtils
import co.datainsider.bi.util.Implicits.FutureEnhance
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

import java.io.File
import java.nio.file.{Files, Paths}
import scala.util.Try

class ClickhouseEngineTest extends IntegrationTest {
  override protected val injector: Injector = TestInjector(TestContainerModule).create

  val source: ClickhouseConnection = injector.instance[ClickhouseConnection]
  val engineCreator = new ClickhouseEngineFactory()

  val engine: ClickhouseEngine = engineCreator.create(source)

  val client: JdbcClient = engine.client
  val dbName: String = DbTestUtils.dbName
  val tblSales: String = DbTestUtils.tblSales
  val csvPath ="./tmp/clickhouse_sales.csv"
  val excelPath = "./tmp/clickhouse_sales.xlsx"

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb(client)
    DbTestUtils.insertFakeData(client)
    cleanUpFile(csvPath)
    cleanUpFile(excelPath)
    ensureFolderExists(csvPath)
  }
  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb(client)
    cleanUpFile(excelPath)
    cleanUpFile(csvPath)
    Try(engine.close())
  }

  private def ensureFolderExists(path: String): Unit = {
    val file = new File(path)
    if (!file.getParentFile.exists()) {
      file.getParentFile.mkdirs()
    }
  }

  private def cleanUpFile(path: String): Unit = {
    Try(Files.deleteIfExists(Paths.get(path)))
  }


  test("test export excel file") {
    val sql = s"select Region, Order_Date, Total_Profit from $dbName.$tblSales"
    val destPath = engine.exportToFile(sql, excelPath, FileType.Excel).syncGet()

    val file = new File(destPath)
    assert(file.exists())
    file.delete()
  }

  test("test engine with data table") {
    val keypair = injector.instance[SshKeyPair]
    val tunnelConfig = injector.instance[SshConfig]
    val originSource = source.copy(
      host = ZConfig.getString("test_db.clickhouse.service_name"),
      httpPort = ZConfig.getInt("test_db.clickhouse.http_interface_port"),
      tcpPort = ZConfig.getInt("test_db.clickhouse.native_interface_port")
    )
    println(s"open tunnel from localhost -> ${tunnelConfig.host}:${tunnelConfig.port}")
    val session = TunnelSession
      .newBuilder()
      .setKeyPair(keypair)
      .setTunnelConnection(originSource.copy(tunnelConfig = Some(tunnelConfig)))
      .build()
    Using(session)(session => {
      session.open()
      println(s"tunnel from ${originSource.getRemoteHost()}:${originSource.getRemotePorts()} -> ${session.getMappedHost()}:${session.getMappedHost()}")
      val tunnelSource = source.copyHostPorts(session.getMappedHost(), session.getMappedPortAsMap())
      Using(engineCreator.create(tunnelSource))(engine => {
        val dataTable: DataTable = await(engine.execute(s"select * from $dbName.$tblSales limit 10"))
        println(s"execute query success with rows size ${dataTable.records.size}")
        assert(dataTable.records.size == 10)
      })
    })
  }
}
