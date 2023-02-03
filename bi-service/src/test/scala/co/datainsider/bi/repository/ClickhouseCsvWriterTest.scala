package co.datainsider.bi.repository

import co.datainsider.bi.module.TestModule
import co.datainsider.query.DbTestUtils
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.Implicits.FutureEnhanceLike

import java.io.File

class ClickhouseCsvWriterTest extends IntegrationTest {
  override protected val injector: Injector = TestInjector(TestModule).newInstance()

  private val dbName = DbTestUtils.dbName
  private val tblName = DbTestUtils.tblSales

  override def beforeAll(): Unit = {
    DbTestUtils.setUpTestDb()
    DbTestUtils.insertSales()
  }

  override def afterAll(): Unit = {
    DbTestUtils.cleanUpTestDb()
  }

  var exportedFilePath: String = null
  test("test export clickhouse query response to csv") {
    val query = s"select * from $dbName.$tblName"

    exportedFilePath = ClickhouseCsvWriter.exportToFile(query).syncGet
    assert(exportedFilePath != null)

    val file = new File(exportedFilePath)
    assert(file.exists())
    assert(file.length() > 0)
  }

  test("test delete files") {
    ClickhouseCsvWriter.deleteFiles(0)
    val file = new File(exportedFilePath)
    assert(!file.exists())
  }

}
