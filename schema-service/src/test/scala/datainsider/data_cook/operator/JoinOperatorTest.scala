package datainsider.data_cook.operator

import datainsider.client.domain.query.{EqualField, TableField}
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.{JoinType, TableConfiguration}
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.exception.InputInvalid
import datainsider.data_cook.pipeline.operator._
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.service.table.EtlTableService.getDbName
import datainsider.ingestion.domain.TableSchema

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class JoinOperatorTest extends OperatorTest {
  override protected val jobId: EtlJobId = 1300
  implicit val resolver: ExecutorResolver = injector.instance[ExecutorResolver]

  test("run pipeline has join operator using JoinType.Inner") {

    /**
      * Root -> GetOperator -> JoinOperator
      *      \              /
      *      -> GetOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, customerSchema, TableConfiguration("tbl_1", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("tbl_2", "ETL", "tbl 2"))
    val destTableConfig = TableConfiguration("join_100", "ETL Database", "Join 100 items")
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
    val getOperator1 = GetOperator(1, customerSchema, TableConfiguration("tbl_3", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("tbl_4", "ETL", "tbl 2"))
    val destTableConfig = TableConfiguration("join_test_2", "ETL Database", "Join 100 items")
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
    val getOperator1 = GetOperator(1, customerSchema, TableConfiguration("tbl_1_test_3", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("tbl_2_test_3", "ETL", "tbl 2"))
    val destTableConfig = TableConfiguration("join_test_3", "ETL Database", "Join 100 items")
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
    val getOperator1 = GetOperator(1, customerSchema, TableConfiguration("tbl_1_test_4", "ETL", "tbl 1"))
    val getOperator2 = GetOperator(2, orderSchema, TableConfiguration("tbl_2_test_4", "ETL", "tbl 2"))
    val destTableConfig = TableConfiguration("join_test_4", "ETL Database", "Join 100 items")
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

  test("run pipeline has join operator missing left result") {

    /**
      * Root -> GetOperator -> JoinOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator2 = GetOperator(1, orderSchema, TableConfiguration("tbl_2_test_5", "ETL", "tbl 2"))
    val destTableConfig = TableConfiguration("join_test_5", "ETL Database", "Join 100 items")
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
    assertResult(true)(pipelineResult.operatorError.nonEmpty)
    assertResult(true)(pipelineResult.exception.nonEmpty)
    assertResult(true)(pipelineResult.exception.get.isInstanceOf[InputInvalid])
    assertResult(Some(joinOperator))(pipelineResult.operatorError)
    println(pipelineResult.exception.get.getMessage)
  }

  test("run pipeline has join operator missing right result") {

    /**
      * Root -> GetOperator -> JoinOperator
      */
    val rootOperator = RootOperator(0)
    val getOperator2 = GetOperator(1, orderSchema, TableConfiguration("tbl_2_test_6", "ETL", "tbl 2"))
    val destTableConfig = TableConfiguration("join_test_6", "ETL Database", "Join 100 items")
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
    assertResult(true)(pipelineResult.operatorError.nonEmpty)
    assertResult(true)(pipelineResult.exception.nonEmpty)
    assertResult(true)(pipelineResult.exception.get.isInstanceOf[InputInvalid])
    assertResult(Some(joinOperator))(pipelineResult.operatorError)
    println(pipelineResult.exception.get.getMessage)
  }

}
