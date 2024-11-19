//package co.datainsider.schema.service
//
//import co.datainsider.bi.client.JdbcClient
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.schema.domain.RefreshStatus.RefreshStatus
//import co.datainsider.schema.domain.{DatabaseSchema, SystemInfo}
//import co.datainsider.schema.module.SchemaTestModule
//import co.datainsider.schema.repository.{ClickhouseMetaDataHandlerImpl, SchemaMetadataStorage}
//import com.google.inject.name.Names
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import com.twitter.util.Future
//import co.datainsider.common.client.module.{MockCaasClientModule, MockHadoopFileClientModule}
//
///**
//  * created 2022-07-19 2:03 PM
//  *
//  * @author tvc12 - Thien Vi
//  */
//class Clickhouse2DISchemaTest extends IntegrationTest {
//  override protected def injector: Injector =
//    TestInjector(
//      SchemaTestModule,
//      MockCaasClientModule,
//      TestContainerModule,
//      MockHadoopFileClientModule,
//      TestContainerModule
//    ).newInstance()
//
//  val client = injector.instance[JdbcClient](Names.named("clickhouse"))
//  val storage = injector.instance[SchemaMetadataStorage]
//  val orgId = 1L
//
//  test("Load schema should be successful") {
//    val clickhouse2DISchema = new Clickhouse2DISchema(
//      orgId,
//      new ClickhouseMetaDataHandlerImpl(client),
//      storage,
//      SystemInfo.default(orgId).refreshConfig,
//      updateStatus
//    )
//    clickhouse2DISchema.run()
//    val databaseSchemas: Seq[DatabaseSchema] = await(storage.getDatabases(orgId))
//    assert(databaseSchemas.nonEmpty)
//    assert(databaseSchemas.exists(_.name == "system"))
//    assert(databaseSchemas.exists(_.name == "default"))
//    val systemDatabase: DatabaseSchema = databaseSchemas.find(_.name == "system").get
//    assert(systemDatabase.tables.nonEmpty)
//    assert(systemDatabase.tables.exists(_.name == "tables"))
//    assert(systemDatabase.tables.exists(_.name == "columns"))
//    assert(systemDatabase.tables.exists(_.name == "databases"))
//  }
//
//  test("Load schema 2 should be successful") {
//    val clickhouse2DISchema =
//      new Clickhouse2DISchema(
//        orgId,
//        new ClickhouseMetaDataHandlerImpl(client),
//        storage,
//        SystemInfo.default(orgId).refreshConfig,
//        updateStatus
//      )
//    clickhouse2DISchema.run()
//    val databaseSchemas: Seq[DatabaseSchema] = await(storage.getDatabases(orgId))
//    assert(databaseSchemas.nonEmpty)
//    assert(databaseSchemas.exists(_.name == "system"))
//    assert(databaseSchemas.exists(_.name == "default"))
//    val systemDatabase: DatabaseSchema = databaseSchemas.find(_.name == "system").get
//    assert(systemDatabase.tables.nonEmpty)
//    assert(systemDatabase.tables.exists(_.name == "tables"))
//    assert(systemDatabase.tables.exists(_.name == "columns"))
//    assert(systemDatabase.tables.exists(_.name == "databases"))
//  }
//
//  private def updateStatus(status: RefreshStatus, errorMsg: Option[String] = None): Future[Unit] = {
//    println(s"Update status to $status")
//    println(s"Update errorMsg to $errorMsg")
//    Future.Unit
//  }
//}
