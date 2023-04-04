package datainsider.data_cook.operator

import datainsider.client.domain.query.{EqualField, GroupTableChartSetting, Select, TableColumn, TableField}
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.{JoinType, TableConfiguration}
import datainsider.data_cook.domain.persist.PersistentType
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator._
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult, operator}
import datainsider.ingestion.service.SchemaService

class PipelineTest extends OperatorTest {

  implicit val executorResolver: ExecutorResolver = injector.instance[ExecutorResolver]
  override protected val jobId: EtlJobId = 13212

  private val schemaService = injector.instance[SchemaService]
  private val dbTest = "pipeline_test"

  override def beforeAll(): Unit = {
    super.beforeAll()
    await(schemaService.ensureDatabaseCreated(orgId, dbTest))
  }

  override def afterAll(): Unit = {
    super.afterAll()
    await(schemaService.deleteDatabase(orgId, dbTest))
  }

  test("execute simple pipeline") {

    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl_a", "etl", "table a"))
    val transformOperator = TransformOperator(
      2,
      GroupTableChartSetting(columns =
        Array(TableColumn("column1", Select(TableField(dbName, "tbl_a", "id", "string", Some("id")))))
      ),
      TableConfiguration("tbl_b", "etl", "table b")
    )
    val saveOperator = SaveDwhOperator(3, dbTest, "test_save_db", PersistentType.Append)

    /**
      * RootOperator -> GetOperator -> TransformOperator -> SaveDwhOperator
      */
    val pipeline: Pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, transformOperator)
      .add(transformOperator, saveOperator)
      .build()
    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipeline result ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
  }

  test("execute complex pipeline") {

    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("table_a1", "etl", "table a"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("table_b1", "etl", "table b"))
    val joinOperator = JoinOperator(
      3,
      joinConfigs = Array(
        JoinConfiguration(
          leftId = 1,
          rightId = 2,
          conditions = Array(
            EqualField(
              leftField = TableField(dbName, "table_a1", "id", ""),
              rightField = TableField(dbName, "table_b1", "id", "")
            )
          ),
          joinType = JoinType.Inner
        )
      ),
      TableConfiguration("table_c", "etl", "table c")
    )
    val saveOperator = SaveDwhOperator(4, dbTest, "test_save_db_2", PersistentType.Append)

    /**
      * RootOperator -> GetOperator -> JoinOperator -> SaveDwhOperator
      *             \                 /
      *              -> GetOperator /
      */
    val pipeline: Pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(rootOperator, getOperator2)
      .add(getOperator, joinOperator)
      .add(getOperator2, joinOperator)
      .add(joinOperator, saveOperator)
      .build()
    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipeline result ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)

  }

  test("execute incorrect pipeline") {

    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl_a", "etl", "table a"))
    val joinOperator = JoinOperator(
      2,
      joinConfigs = Array(
        JoinConfiguration(
          leftId = 1,
          rightId = 2,
          conditions = Array(
            EqualField(
              leftField = TableField(dbName, "tbl_a", "id", ""),
              rightField = TableField(dbName, "tbl_b", "id", "")
            )
          ),
          joinType = JoinType.Inner
        )
      ),
      TableConfiguration("tbl_c", "etl", "table c")
    )
    val saveOperator = SaveDwhOperator(3, dbTest, "test_save_db_3", PersistentType.Append)

    /**
      * RootOperator -> GetOperator -> JoinOperator x -> SaveDwhOperator
      */
    val pipeline: Pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, joinOperator)
      .add(joinOperator, saveOperator)
      .build()
    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipeline execute fail, actual execute result ${pipelineResult.isSucceed}")
    assertResult(pipelineResult.isSucceed)(false)
    assertResult(pipelineResult.exception.isDefined)(true)
    assertResult(pipelineResult.errorOperator.isDefined)(true)
    println(s"operator failed ${pipelineResult.errorOperator.get}, cause ${pipelineResult.exception.get.getMessage}")

  }
}
