package datainsider.ingestion.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.JdbcClient
import datainsider.ingestion.domain.RefreshStatus.RefreshStatus
import datainsider.ingestion.domain.{DatabaseSchema, SystemInfo}
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.repository.{ClickhouseMetaDataHandlerImpl, SchemaMetadataStorage}
import datainsider.module.MockHadoopFileClientModule

/**
  * created 2022-07-19 2:03 PM
  *
  * @author tvc12 - Thien Vi
  */
class Clickhouse2DISchemaTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule, MockCaasClientModule, MockHadoopFileClientModule).newInstance()

  val client = injector.instance[JdbcClient]
  val storage = injector.instance[SchemaMetadataStorage]
  val orgId = 1L

  test("Load schema should be successful") {
    val clickhouse2DISchema = new Clickhouse2DISchema(orgId, new ClickhouseMetaDataHandlerImpl(client), storage, SystemInfo.default(orgId).refreshConfig, updateStatus)
    clickhouse2DISchema.run()
    val databaseSchemas: Seq[DatabaseSchema] = await(storage.getDatabases(orgId))
    assert(databaseSchemas.nonEmpty)
    assert(databaseSchemas.exists(_.name == "system"))
    assert(databaseSchemas.exists(_.name == "default"))
    val systemDatabase: DatabaseSchema = databaseSchemas.find(_.name == "system").get
    assert(systemDatabase.tables.nonEmpty)
    assert(systemDatabase.tables.exists(_.name == "tables"))
    assert(systemDatabase.tables.exists(_.name == "columns"))
    assert(systemDatabase.tables.exists(_.name == "databases"))
  }

  test("Load schema 2 should be successful") {
    val clickhouse2DISchema =
      new Clickhouse2DISchema(orgId, new ClickhouseMetaDataHandlerImpl(client), storage, SystemInfo.default(orgId).refreshConfig, updateStatus)
    clickhouse2DISchema.run()
    val databaseSchemas: Seq[DatabaseSchema] = await(storage.getDatabases(orgId))
    assert(databaseSchemas.nonEmpty)
    assert(databaseSchemas.exists(_.name == "system"))
    assert(databaseSchemas.exists(_.name == "default"))
    val systemDatabase: DatabaseSchema = databaseSchemas.find(_.name == "system").get
    assert(systemDatabase.tables.nonEmpty)
    assert(systemDatabase.tables.exists(_.name == "tables"))
    assert(systemDatabase.tables.exists(_.name == "columns"))
    assert(systemDatabase.tables.exists(_.name == "databases"))
  }

  private def updateStatus(status: RefreshStatus, errorMsg: Option[String] = None): Future[Unit] = {
    println(s"Update status to $status")
    println(s"Update errorMsg to $errorMsg")
    Future.Unit
  }
}
