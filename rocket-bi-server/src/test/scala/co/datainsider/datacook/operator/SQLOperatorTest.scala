package co.datainsider.datacook.operator

import co.datainsider.bi.domain.query.Limit
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class SQLOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 1402
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(SQLOperatorExecutor(operatorService))

  test("Sql operator on customer table") {

    // Root -> GetOperator -> SQLOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_sql_100", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("sql_100", "ETL Database", "SQL 100 items");
    val sqlOperator = SQLOperator(
      2,
      query = s"select id as Id, name as Name from ${getDbName(orgId, jobId)}.`customer_sql_100`",
      destSqlTableConfig
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sqlOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(sqlOperator.id).getData[TableSchema]().get

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
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_sql_1000", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("sql_1000", "ETL Database", "SQL 100 items")
    val sQLOperator =
      SQLOperator(2, query = s"select id as Id from ${getDbName(orgId, jobId)}.`customer_sql_1000`", destSqlTableConfig)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sQLOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(sQLOperator.id).getData[TableSchema]().get

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
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_sql_no_limit", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("sql", "ETL Database", "SQL query items");
    val sQLOperator = SQLOperator(
      2,
      query = s"select id as Id from ${getDbName(orgId, jobId)}.`customer_sql_no_limit`",
      destSqlTableConfig
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sQLOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(sQLOperator.id).getData[TableSchema]().get

    assertResult(true)(newSchema != null)
    assertResult(destSqlTableConfig.tblName)(newSchema.name)
    assertResult(destSqlTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)
  }

  test("Sql operator on customer table use sql limit") {
    // Root -> GetOperator -> SQLOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_sql_limit_20", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("sql_query_limit_20", "ETL Database", "SQL query items");
    val sQLOperator = SQLOperator(
      2,
      query = s"select id as Id from ${getDbName(orgId, jobId)}.`customer_sql_limit_20` limit 0, 20",
      destSqlTableConfig
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sQLOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(sQLOperator.id).getData[TableSchema]().get

    assertResult(true)(newSchema != null)
    assertResult(destSqlTableConfig.tblName)(newSchema.name)
    assertResult(destSqlTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)
    assertTableSize(newSchema, 20)
  }

  test("sql operator with duplicate name") {
    // Root -> GetOperator -> SQLOperator
    // Root -> GetOperator -> SQLOperator2
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("sql_20", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("sql_20_1", "ETL Database", "SQL query items");
    val sqlOperator = SQLOperator(
      2,
      query = s"select id as Id from ${dbName}.`${getOperator.destTableConfiguration.tblName}` limit 0, 20",
      destSqlTableConfig
    )
    val destSqlTableConfig2 = DestTableConfig("sql_20_2", "ETL Database", "SQL query items");
    val sqlOperator2 = SQLOperator(
      2,
      query = s"select id as Id from ${dbName}.`${getOperator.destTableConfiguration.tblName}` limit 20, 40",
      destSqlTableConfig2
    )

    val pipeline1 = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sqlOperator)
      .build()

    val pipeline2 = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sqlOperator2)
      .build()

    val pipelineResult1: PipelineResult = pipeline1.execute()
    println(s"SQLOperatorTest:: ${pipelineResult1}")
    assertResult(true)(pipelineResult1.isSucceed)

    val pipelineResult2: PipelineResult = pipeline2.execute()
    println(s"SQLOperatorTest:: ${pipelineResult2}")
    assertResult(true)(pipelineResult2.isSucceed)


  }
}
