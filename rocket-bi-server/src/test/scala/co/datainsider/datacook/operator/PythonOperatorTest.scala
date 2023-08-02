package co.datainsider.datacook.operator

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.domain.query.Limit
import co.datainsider.bi.util.Using
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema

import scala.io.Source

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class PythonOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 1442
  private val clickhouseSource = injector.instance[ClickhouseConnection]

  val template: String =
    Using(Source.fromInputStream(getClass.getClassLoader.getResourceAsStream("template/main.py.template")))(
      _.getLines().mkString("\n")
    )

  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(
      new PythonOperatorExecutor(
        source,
        operatorService,
        template,
        baseDir = "./tmp",
        executeTimeoutMs = 10000
      )
    )

  test("Test execute with sample python operator") {

    // Root -> GetOperator -> PythonOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_python_100", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("python_100", "ETL Database", "SQL 100 items");
    val pythonOperator = PythonOperator(
      2,
      code = """
          |def process(client: Client, database: str, table: str, dest_database: str, dest_table: str):
          |    create_table_query = "CREATE TABLE IF NOT EXISTS `{database}`.`{dest_table}`(id Int32, name String) ENGINE MergeTree() ORDER BY id".format(
          |        database=dest_database, dest_table=dest_table)
          |    _ = client.command(create_table_query)
          |    result_set = client.query("select id, name from `{database}`.`{table}`".format(database=database, table=table)).result_set
          |    buffers = []
          |    for row in result_set:
          |        buffers.append(row)
          |        if buffers.__len__() > 1000:
          |            client.insert(database=dest_database, table=dest_table, data=buffers, column_names=['id', 'name'])
          |            buffers.clear()
          |    if buffers.__len__() > 0:
          |        client.insert(database=dest_database, table=dest_table, data=buffers, column_names=['id', 'name'])
          |        buffers.clear()
          |""".stripMargin,
      destSqlTableConfig
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pythonOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println("Pipeline result: " + pipelineResult)
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(pythonOperator.id).getData[TableSchema]().get

    assertResult(true)(newSchema != null)
    assertResult(destSqlTableConfig.tblName)(newSchema.name)
    assertResult(destSqlTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(2)(newSchema.columns.size)
    assertTableSize(newSchema, 500)
  }

  test("Test execute with sample python operator failure") {

    // Root -> GetOperator -> PythonOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_python_101", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("python_123", "ETL Database", "SQL 100 items");
    val pythonOperator = PythonOperator(
      2,
      code = """
          |def process(client: Client, database: str, table: str, dest_database: str, dest_table: str):
          |    wrong syntax
          |""".stripMargin,
      destSqlTableConfig
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pythonOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println("Pipeline result: " + pipelineResult)
    assertResult(false)(pipelineResult.isSucceed)
    assertResult(2)(pipelineResult.mapResult.size)
    assertResult(true)(pipelineResult.exception.isDefined)
  }

  test("Test execute with sample python timeout") {

    // Root -> GetOperator -> PythonOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_python_102", "ETL Database", "Get Customer 100"))
    val destSqlTableConfig = DestTableConfig("python_timeout_123", "ETL Database", "SQL 100 items");
    val pythonOperator = PythonOperator(
      2,
      code = """
          |import time
          |
          |
          |def process(client: Client, database: str, table: str, dest_database: str, dest_table: str):
          |    time.sleep(10)
          |""".stripMargin,
      destSqlTableConfig
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pythonOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println("Pipeline result: " + pipelineResult)
    assertResult(false)(pipelineResult.isSucceed)
    assertResult(2)(pipelineResult.mapResult.size)
    assertResult(true)(pipelineResult.exception.isDefined)
  }

}
