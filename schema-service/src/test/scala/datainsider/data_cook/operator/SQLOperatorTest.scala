package datainsider.data_cook.operator

import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator.{GetOperator, RootOperator, SQLOperator}
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.service.table.EtlTableService.getDbName
import datainsider.ingestion.domain.TableSchema

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class SQLOperatorTest extends OperatorTest {
  override protected val jobId: EtlJobId = 1402
  implicit val resolver: ExecutorResolver = injector.instance[ExecutorResolver]


  test("Sql operator on customer table") {

    // Root -> GetOperator -> SQLOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_sql_100", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = TableConfiguration("sql_100", "ETL Database", "SQL 100 items");
    val pivotOperator = SQLOperator(2,
      query = s"select id as Id, name as Name from ${getDbName(orgId, jobId)}.`customer_sql_100`",
      destSqlTableConfig
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pivotOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(pivotOperator.id).getData[TableSchema]().get

    assertResult(true)(newSchema != null)
    assertResult(destSqlTableConfig.tblName)(newSchema.name)
    assertResult(destSqlTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(2)(newSchema.columns.size)
    assertTableSize(newSchema, 500)
  }

  test("Sql operator on customer table 2") {
    // Root -> GetOperator -> SQLOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_sql_1000", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = TableConfiguration("sql_1000", "ETL Database", "SQL 100 items")
    val pivotOperator = SQLOperator(2,
      query = s"select id as Id from ${getDbName(orgId, jobId)}.`customer_sql_1000`",
      destSqlTableConfig
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pivotOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(pivotOperator.id).getData[TableSchema]().get

    assertResult(true)(newSchema != null)
    assertResult(destSqlTableConfig.tblName)(newSchema.name)
    assertResult(destSqlTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)
    assertTableSize(newSchema, 500, true)
  }

  test("Sql operator on customer table with no limit") {
    // Root -> GetOperator -> SQLOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_sql_no_limit", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = TableConfiguration("sql", "ETL Database", "SQL query items");
    val pivotOperator = SQLOperator(2,
      query = s"select id as Id from ${getDbName(orgId, jobId)}.`customer_sql_no_limit`",
      destSqlTableConfig
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pivotOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(pivotOperator.id).getData[TableSchema]().get

    assertResult(true)(newSchema != null)
    assertResult(destSqlTableConfig.tblName)(newSchema.name)
    assertResult(destSqlTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)
  }

  test("Sql operator on customer table use sql limit") {
    // Root -> GetOperator -> SQLOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_sql_limit_20", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = TableConfiguration("sql_query_limit_20", "ETL Database", "SQL query items");
    val pivotOperator = SQLOperator(2,
      query = s"select id as Id from ${getDbName(orgId, jobId)}.`customer_sql_limit_20` limit 0, 20",
      destSqlTableConfig
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pivotOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(pivotOperator.id).getData[TableSchema]().get

    assertResult(true)(newSchema != null)
    assertResult(destSqlTableConfig.tblName)(newSchema.name)
    assertResult(destSqlTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)
    assertTableSize(newSchema, 20)
  }
}
