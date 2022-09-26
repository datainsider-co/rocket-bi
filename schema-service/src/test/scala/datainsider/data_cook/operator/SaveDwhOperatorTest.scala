package datainsider.data_cook.operator

import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.domain.persist.PersistentType
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator.{GetOperator, RootOperator, SaveDwhOperator, SaveDwhResult}
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.ingestion.service.SchemaService

/**
  * @author tvc12 - Thien Vi
  * @created 10/08/2021 - 9:28 PM
  */
class SaveDwhOperatorTest extends OperatorTest {
//  private lazy val persistHandler = injector.instance[ActionHandler[DwhPersistConfiguration, PersistResult]]
  private implicit val resolver = injector.instance[ExecutorResolver]

  private val schemaService = injector.instance[SchemaService]
  override protected val jobId: EtlJobId = 1233
  private val testDbName = "test_persist"
  private val dbNameNotExist = "test_persist_not_exist"

  private val tblName = "tbl_test"
  private val tblName2 = "tbl_test2"

  override def beforeAll(): Unit = {
    super.beforeAll()
    await(schemaService.deleteDatabase(orgId, testDbName))
    await(schemaService.ensureDatabaseCreated(orgId, testDbName, Some("Test persist")))
  }

  test("Persist Append with database not existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_1", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = dbNameNotExist,
      tblName = tblName,
      `type` = PersistentType.Append,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveDwhOperator)
      .build()

    val result: PipelineResult = pipeline.execute()
    result.exception.foreach(_.printStackTrace())
    assert(result.isSucceed)
    val saveDwhResult: SaveDwhResult = result.mapResult(saveDwhOperator.id).asInstanceOf[SaveDwhResult]

    assert(saveDwhResult != null)
    assert(saveDwhResult.totalRows == saveDwhResult.insertedRows)
    assert(saveDwhResult.totalRows == 1)
  }

  test("Persist Update with database not existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_2", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = dbNameNotExist,
      tblName = tblName,
      `type` = PersistentType.Replace,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline.builder()
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

    assertTableSize(dbNameNotExist, tblName, 88, false)
    await(schemaService.deleteDatabase(orgId, dbNameNotExist))
  }

  test("Persist Update with database existed and table not existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_3", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = testDbName,
      tblName = tblName,
      `type` = PersistentType.Replace,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline.builder()
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
    assertTableSize(testDbName, tblName, 88, false)

  }

  test("Persist Append with database existed and table not existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_4", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = testDbName,
      tblName = tblName2,
      `type` = PersistentType.Append,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline.builder()
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

    assertTableSize(testDbName, tblName2, 88, false)
  }

  test("Persist Update with database existed and table existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_5", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = testDbName,
      tblName = tblName,
      `type` = PersistentType.Replace,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline.builder()
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

    assertTableSize(testDbName, tblName, 88, false)
  }

  test("Persist Append with database existed and table existed") {

    // RootOperator -> GetOperator -> SaveDwhOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, salesSchema, TableConfiguration("tbl_6", "ETL", "ETL"))
    val saveDwhOperator = SaveDwhOperator(
      2,
      dbName = testDbName,
      tblName = tblName2,
      `type` = PersistentType.Append,
      displayName = Some("Hello")
    )

    val pipeline = Pipeline.builder()
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

    assertTableSize(testDbName, tblName2, 88, false)

  }

}
