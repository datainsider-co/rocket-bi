package co.datainsider.datacook.operator

import co.datainsider.bi.domain.query.Limit
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.domain.persist.PersistentType
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator.{GetOperator, GetOperatorExecutor, RootOperator, RootOperatorExecutor, SQLOperatorExecutor, SaveDwhOperator, SaveDwhOperatorExecutor, SaveDwhResult}
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}

import scala.util.Try

/**
  * @author tvc12 - Thien Vi
  * @created 10/08/2021 - 9:28 PM
  */
class SaveDwhOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  //  private lazy val persistHandler = injector.instance[ActionHandler[DwhPersistConfiguration, PersistResult]]
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(SaveDwhOperatorExecutor(client, operatorService))

  override protected val jobId: EtlJobId = 1233
  private val destDbName = "test_persist_db"
  private val destDbNameNotExist = "test_persist_db_not_exist"

  private val tblName = "sample_persist_1"
  private val tblName2 = "sample_persist_2"

  override def beforeAll(): Unit = {
    super.beforeAll()
    Try(await(schemaService.deleteDatabase(orgId, destDbNameNotExist)))
    Try(await(schemaService.deleteDatabase(orgId, destDbName)))
    await(schemaService.ensureDatabaseCreated(orgId, destDbName, Some("Test persist")))
  }

  test("[Append] when database not exist") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_1", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = destDbNameNotExist,
      tblName = tblName,
      `type` = PersistentType.Append,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveDwhOperator)
      .build()

    val result: PipelineResult = pipeline.execute()
    assert(result.isSucceed)
    val saveDwhResult: SaveDwhResult = result.mapResult(saveDwhOperator.id).asInstanceOf[SaveDwhResult]

    assert(saveDwhResult != null)
    assert(saveDwhResult.totalRows == saveDwhResult.insertedRows)
    assert(saveDwhResult.totalRows == 1)

    assertTableSize(destDbNameNotExist, tblName, 200, false)
    await(schemaService.deleteDatabase(orgId, destDbNameNotExist))
  }

  test("[Replace] when database not exist") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_2", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = destDbNameNotExist,
      tblName = tblName,
      `type` = PersistentType.Replace,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveDwhOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assert(result.isSucceed)
    val saveDwhResult: SaveDwhResult = result.mapResult(saveDwhOperator.id).asInstanceOf[SaveDwhResult]

    assert(saveDwhResult != null)
    assert(saveDwhResult.totalRows == saveDwhResult.insertedRows)
    assert(saveDwhResult.totalRows == 1)

    assertTableSize(destDbNameNotExist, tblName, 200, false)
    await(schemaService.deleteDatabase(orgId, destDbNameNotExist))
  }

  test("[Replace] when database existed & table not existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_3", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = destDbName,
      tblName = tblName,
      `type` = PersistentType.Replace,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveDwhOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assert(result.isSucceed)
    val saveDwhResult: SaveDwhResult = result.mapResult(saveDwhOperator.id).asInstanceOf[SaveDwhResult]

    assert(saveDwhResult != null)
    assert(saveDwhResult.totalRows == saveDwhResult.insertedRows)
    assert(saveDwhResult.totalRows == 1)
    assertTableSize(destDbName, tblName, 200, false)

  }

  test("[Append] when database existed & table not existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_4", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = destDbName,
      tblName = tblName2,
      `type` = PersistentType.Append,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveDwhOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assert(result.isSucceed)
    val saveDwhResult: SaveDwhResult = result.mapResult(saveDwhOperator.id).asInstanceOf[SaveDwhResult]

    assert(saveDwhResult != null)
    assert(saveDwhResult.totalRows == saveDwhResult.insertedRows)
    assert(saveDwhResult.totalRows == 1)

    assertTableSize(destDbName, tblName2, 200, false)
  }

  test("[Replace] when database existed & table existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_5", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = destDbName,
      tblName = tblName,
      `type` = PersistentType.Replace,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveDwhOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assert(result.isSucceed)
    val saveDwhResult: SaveDwhResult = result.mapResult(saveDwhOperator.id).asInstanceOf[SaveDwhResult]

    assert(saveDwhResult != null)
    assert(saveDwhResult.totalRows == saveDwhResult.insertedRows)
    assert(saveDwhResult.totalRows == 1)

    assertTableSize(destDbName, tblName, 200, false)
  }

  test("[Append] when database existed & table existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesTable, DestTableConfig("tbl_6", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = destDbName,
      tblName = tblName2,
      `type` = PersistentType.Append,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveDwhOperator)
      .build()

    val result: PipelineResult = pipeline.execute()

    assert(result.isSucceed)
    val saveDwhResult: SaveDwhResult = result.mapResult(saveDwhOperator.id).asInstanceOf[SaveDwhResult]

    assert(saveDwhResult != null)
    assert(saveDwhResult.totalRows == saveDwhResult.insertedRows)
    assert(saveDwhResult.totalRows == 1)

    assertTableSize(destDbName, tblName2, 400, false)

  }

}
