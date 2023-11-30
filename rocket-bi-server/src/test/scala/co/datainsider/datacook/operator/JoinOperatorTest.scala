package co.datainsider.datacook.operator

import co.datainsider.bi.domain.query.{EqualField, Limit, TableField}
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.{DestTableConfig, JoinType}
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.exception.InputInvalid
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class JoinOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 1300
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(operatorService, Some(Limit(0, 500))))
    .register(JoinOperatorExecutor(operatorService, Some(Limit(0, 500))))

  test("run pipeline has join operator using JoinType.Inner") {

    /**
      * Root -> GetOperator -> JoinOperator
      *      \              /
      *      -> GetOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, customerTable, DestTableConfig("tbl_1", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("tbl_2", "ETL", "tbl 2"))
    val destTableConfig = DestTableConfig("join_100", "ETL Database", "Join 100 items")
    val joinOperator = JoinOperator(
      3,
      Array(
        JoinConfiguration(
          leftId = 1,
          rightId = 2,
          conditions = Array(
            EqualField(TableField(dbName, "tbl_1", "id", ""), TableField(dbName, "tbl_2", "id", ""))
          ),
          joinType = JoinType.Inner
        )
      ),
      destTableConfig
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(getOperator1, joinOperator)
      .add(getOperator2, joinOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(4)(pipelineResult.mapResult.size)
    val joinTableSchema: TableSchema = pipelineResult.mapResult(joinOperator.id).getData[TableSchema]().get

    assertResult(destTableConfig.tblName)(joinTableSchema.name)
    assertResult(destTableConfig.tblDisplayName)(joinTableSchema.displayName)
    assertResult(getDbName(orgId, jobId))(joinTableSchema.dbName)
    assertResult(10)(joinTableSchema.columns.size)
  }

  test("run pipeline has join operator using JoinType.FullOuter") {

    /**
      * Root -> GetOperator -> JoinOperator
      *      \              /
      *      -> GetOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, customerTable, DestTableConfig("tbl_3", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("tbl_4", "ETL", "tbl 2"))
    val destTableConfig = DestTableConfig("join_test_2", "ETL Database", "Join 100 items")
    val joinOperator = JoinOperator(
      3,
      Array(
        JoinConfiguration(
          leftId = 1,
          rightId = 2,
          conditions = Array(
            EqualField(TableField(dbName, "tbl_3", "id", ""), TableField(dbName, "tbl_4", "id", ""))
          ),
          joinType = JoinType.FullOuter
        )
      ),
      destTableConfig
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(getOperator1, joinOperator)
      .add(getOperator2, joinOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(4)(pipelineResult.mapResult.size)
    val joinTableSchema: TableSchema = pipelineResult.mapResult(joinOperator.id).getData[TableSchema]().get

    assertResult(destTableConfig.tblName)(joinTableSchema.name)
    assertResult(destTableConfig.tblDisplayName)(joinTableSchema.displayName)
    assertResult(getDbName(orgId, jobId))(joinTableSchema.dbName)
    assertResult(10)(joinTableSchema.columns.size)
  }

  test("run pipeline has join operator using JoinType.Left") {

    /**
      * Root -> GetOperator -> JoinOperator
      *      \              /
      *      -> GetOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, customerTable, DestTableConfig("tbl_1_test_3", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("tbl_2_test_3", "ETL", "tbl 2"))
    val destTableConfig = DestTableConfig("join_test_3", "ETL Database", "Join 100 items")
    val joinOperator = JoinOperator(
      3,
      Array(
        JoinConfiguration(
          leftId = 1,
          rightId = 2,
          conditions = Array(
            EqualField(TableField(dbName, "tbl_1_test_3", "id", ""), TableField(dbName, "tbl_2_test_3", "id", ""))
          ),
          joinType = JoinType.Left
        )
      ),
      destTableConfig
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(getOperator1, joinOperator)
      .add(getOperator2, joinOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(4)(pipelineResult.mapResult.size)
    val joinTableSchema: TableSchema = pipelineResult.mapResult(joinOperator.id).getData[TableSchema]().get

    assertResult(destTableConfig.tblName)(joinTableSchema.name)
    assertResult(destTableConfig.tblDisplayName)(joinTableSchema.displayName)
    assertResult(getDbName(orgId, jobId))(joinTableSchema.dbName)
    assertResult(10)(joinTableSchema.columns.size)
  }

  test("run pipeline has join operator using JoinType.Right") {

    /**
      * Root -> GetOperator -> JoinOperator
      *      \              /
      *      -> GetOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, customerTable, DestTableConfig("tbl_1_test_4", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderTable, DestTableConfig("tbl_2_test_4", "ETL", "tbl 2"))
    val destTableConfig = DestTableConfig("join_test_4", "ETL Database", "Join 100 items")
    val joinOperator = JoinOperator(
      3,
      Array(
        JoinConfiguration(
          leftId = 1,
          rightId = 2,
          conditions = Array(
            EqualField(TableField(dbName, "tbl_1_test_4", "id", ""), TableField(dbName, "tbl_2_test_4", "id", ""))
          ),
          joinType = JoinType.Right
        )
      ),
      destTableConfig
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(getOperator1, joinOperator)
      .add(getOperator2, joinOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(4)(pipelineResult.mapResult.size)
    val joinTableSchema: TableSchema = pipelineResult.mapResult(joinOperator.id).getData[TableSchema]().get

    assertResult(destTableConfig.tblName)(joinTableSchema.name)
    assertResult(destTableConfig.tblDisplayName)(joinTableSchema.displayName)
    assertResult(getDbName(orgId, jobId))(joinTableSchema.dbName)
    assertResult(10)(joinTableSchema.columns.size)
  }

  test("run pipeline has join operator using JoinType.InnerJoin With Same Field") {

    /**
      * Root -> GetOperator -> JoinOperator
      *      \              /
      *      -> GetOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, customerTable, DestTableConfig("table_1", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, customerTable, DestTableConfig("table_2", "ETL", "tbl 2"))
    val destTableConfig = DestTableConfig("joined_table", "ETL Database", "Join 100 items")
    val joinOperator = JoinOperator(
      3,
      Array(
        JoinConfiguration(
          leftId = 1,
          rightId = 2,
          conditions = Array(
            EqualField(
              leftField = TableField(dbName, "table_1", "id", ""),
              rightField = TableField(dbName, "table_2", "id", "")
            )
          ),
          joinType = JoinType.Inner
        )
      ),
      destTableConfig
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .add(getOperator1, joinOperator)
      .add(getOperator2, joinOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(4)(pipelineResult.mapResult.size)
    val joinTableSchema: TableSchema = pipelineResult.mapResult(joinOperator.id).getData[TableSchema]().get

    assertResult(destTableConfig.tblName)(joinTableSchema.name)
    assertResult(destTableConfig.tblDisplayName)(joinTableSchema.displayName)
    assertResult(getDbName(orgId, jobId))(joinTableSchema.dbName)
    assert(joinTableSchema.columns(0).name == "id")
    assert(joinTableSchema.columns(1).name == "name")
    assert(joinTableSchema.columns(2).name == "gender")
    assert(joinTableSchema.columns(3).name == "address")
    assert(joinTableSchema.columns(4).name == "birth_day")
    assert(joinTableSchema.columns(5).name == "table_2.id")
    assert(joinTableSchema.columns(6).name == "table_2.name")
    assert(joinTableSchema.columns(7).name == "table_2.gender")
    assert(joinTableSchema.columns(8).name == "table_2.address")
    assert(joinTableSchema.columns(9).name == "table_2.birth_day")
    assertResult(10)(joinTableSchema.columns.size)
  }

  test("run pipeline has join operator missing left result") {

    /**
      * Root -> GetOperator -> JoinOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator2 = GetOperator(1, orderTable, DestTableConfig("tbl_2_test_5", "ETL", "tbl 2"))
    val destTableConfig = DestTableConfig("join_test_5", "ETL Database", "Join 100 items")
    val joinOperator = JoinOperator(
      2,
      Array(
        JoinConfiguration(
          rightId = 1,
          leftId = 2,
          conditions = Array(
            EqualField(TableField(dbName, "tbl_2_test_5", "id", ""), TableField(dbName, "tbl_1_test_5", "id", ""))
          ),
          joinType = JoinType.Right
        )
      ),
      destTableConfig
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator2)
      .add(getOperator2, joinOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(false)(pipelineResult.isSucceed)
    assertResult(true)(pipelineResult.errorOperator.nonEmpty)
    assertResult(true)(pipelineResult.exception.nonEmpty)
    assertResult(true)(pipelineResult.exception.get.isInstanceOf[InputInvalid])
    assertResult(Some(joinOperator))(pipelineResult.errorOperator)
    println(pipelineResult.exception.get.getMessage)
  }

  test("run pipeline has join operator missing right result") {

    /**
      * Root -> GetOperator -> JoinOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator2 = GetOperator(1, orderTable, DestTableConfig("tbl_2_test_6", "ETL", "tbl 2"))
    val destTableConfig = DestTableConfig("join_test_6", "ETL Database", "Join 100 items")
    val joinOperator = JoinOperator(
      2,
      Array(
        JoinConfiguration(
          rightId = 2,
          leftId = 1,
          conditions = Array(
            EqualField(TableField(dbName, "tbl_1_test_6", "id", ""), TableField(dbName, "tbl_2_test_6", "id", ""))
          ),
          joinType = JoinType.Right
        )
      ),
      destTableConfig
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator2)
      .add(getOperator2, joinOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(false)(pipelineResult.isSucceed)
    assertResult(true)(pipelineResult.errorOperator.nonEmpty)
    assertResult(true)(pipelineResult.exception.nonEmpty)
    assertResult(true)(pipelineResult.exception.get.isInstanceOf[InputInvalid])
    assertResult(Some(joinOperator))(pipelineResult.errorOperator)
    println(pipelineResult.exception.get.getMessage)
  }

}
