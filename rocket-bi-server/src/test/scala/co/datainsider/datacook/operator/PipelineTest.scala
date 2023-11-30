package co.datainsider.datacook.operator

import co.datainsider.bi.domain.chart.{GroupTableChartSetting, TableColumn}
import co.datainsider.bi.domain.query.{EqualField, Limit, Select, TableField}
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.{DestTableConfig, JoinType}
import co.datainsider.datacook.domain.persist.PersistentType
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}

class PipelineTest extends AbstractOperatorTest with ClickhouseIntegrateTest {

  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(operatorService, Some(Limit(0, 500))))
    .register(SQLOperatorExecutor(operatorService))
    .register(TransformOperatorExecutor(operatorService))
    .register(PivotOperatorExecutor(operatorService))
    .register(SaveDwhOperatorExecutor(getEngineResolver(), getConnectionService(), schemaService))
    .register(JoinOperatorExecutor(operatorService))


  override protected val jobId: EtlJobId = 13212

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
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl_a", "etl", "table a"))
    val transformOperator = TransformOperator(
      2,
      GroupTableChartSetting(columns =
        Array(TableColumn("column1", Select(TableField(dbName, "tbl_a", "id", "string"))))
      ),
      DestTableConfig("tbl_b", "etl", "table b")
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
    val getOperator = GetOperator(1, customerTable, DestTableConfig("table_a1", "etl", "table a"))
    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("table_b1", "etl", "table b"))
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
      DestTableConfig("table_c", "etl", "table c")
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
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl_a", "etl", "table a"))
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
      DestTableConfig("tbl_c", "etl", "table c")
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
