package co.datainsider.datacook.operator

import co.datainsider.bi.domain.chart.{PivotTableSetting, TableColumn}
import co.datainsider.bi.domain.query._
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator.{GetOperator, GetOperatorExecutor, PivotOperator, PivotOperatorExecutor, RootOperator, RootOperatorExecutor}
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class PivotOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 4104
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(PivotOperatorExecutor(operatorService))

  override def setupSampleTables(): Unit = {
    loadData(getClass.getClassLoader.getResource("datasets/customers.csv").getPath, customerTable)
  }

  test("Pivot on customer") {
    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("customer_10", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function =
              GroupBy(field = TableField(dbName, tblName = "customer_10", fieldName = "name", fieldType = "string"))
          )
        ),
        rows = Array(
          TableColumn(
            "Id",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10", fieldName = "id", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(dbName)(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 500)
  }

  test("Pivot on customer only column") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_1", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_only_column", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_1", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array.empty,
        values = Array.empty,
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(500)(newSchema.columns.size)

    assertTableSize(newSchema, 1)
  }

  test("Pivot on customer only row") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_2", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_only_row", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array.empty,
        rows = Array(
          TableColumn(
            "Id",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_2", fieldName = "id", fieldType = "string")
            )
          )
        ),
        values = Array.empty,
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)

    assertTableSize(newSchema, 500)
  }

  test("Pivot on customer only value") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_3", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_only_value", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array.empty,
        rows = Array.empty,
        values = Array(
          TableColumn(
            "Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_3", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)

    assertTableSize(newSchema, 1)
  }

  test("Pivot on customer only row and value") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_4", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_only_row_column", "ETL Database", "SQL 10 items")
    val pivotOperator = PivotOperator(
      2,
      PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_4", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array(
          TableColumn(
            "Id",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_4", fieldName = "id", fieldType = "string")
            )
          )
        ),
        values = Array.empty,
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    newSchema.columns
      .drop(1)
      .foreach((column: Column) => {
        assertResult(true)(column.isInstanceOf[DoubleColumn])
      })
  }

  test("Pivot on customer only column and value") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_5", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_only_column_value", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_5", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array.empty,
        values = Array(
          TableColumn(
            "Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_5", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(500)(newSchema.columns.size)

    assertTableSize(newSchema, 1)
    newSchema.columns.foreach((column: Column) => {
      assertResult(true)(column.isInstanceOf[DoubleColumn])
    })
  }

  test("Pivot on customer only rows and value") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_6", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_row_value", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array.empty,
        rows = Array(
          TableColumn(
            "Id",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_6", fieldName = "id", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_6", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(2)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    assert(newSchema.columns(0).getClass == classOf[Int64Column])
    assert(newSchema.columns(0).name == "Id")
    assert(newSchema.columns(1).getClass == classOf[DoubleColumn])
    assert(newSchema.columns(1).name == "Profit")
  }

  test("Pivot on customer two rows") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_7", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_two_rows", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_7", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array(
          TableColumn(
            "Id",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_7", fieldName = "id", fieldType = "string")
            )
          ),
          TableColumn(
            "Gender",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_7", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_7", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(502)(newSchema.columns.size)

    assertTableSize(newSchema, 500)


    assert(newSchema.columns(0).getClass == classOf[Int64Column])
    assert(newSchema.columns(0).name == "Id")
    assert(newSchema.columns(1).getClass == classOf[StringColumn])
    assert(newSchema.columns(1).name == "Gender")

    newSchema.columns
      .drop(2)
      .foreach((column: Column) => {
        assertResult(true)(column.isInstanceOf[DoubleColumn])
      })
  }

  test("Pivot on customer two values") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_8", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_two_values", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_8", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array(
          TableColumn(
            "Id",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_8", fieldName = "id", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Total Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_8", fieldName = "gender", fieldType = "string")
            )
          ),
          TableColumn(
            "Total Gender",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_8", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1001)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    assert(newSchema.columns(0).getClass == classOf[Int64Column])
    assert(newSchema.columns(0).name == "Id")

    newSchema.columns
      .drop(1)
      .foreach((column: Column) => {
        assertResult(true)(column.isInstanceOf[DoubleColumn])
      })
  }

  test("Pivot on customer two rows two values") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("customer_10_9", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_10_two_rows_two_values", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_9", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array(
          TableColumn(
            "Id",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_9", fieldName = "id", fieldType = "string")
            )
          ),
          TableColumn(
            "Birth day",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "customer_10_9", fieldName = "birth_day", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Total Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_9", fieldName = "gender", fieldType = "string")
            )
          ),
          TableColumn(
            "Total Gender",
            function = Count(field =
              TableField(dbName = dbName, tblName = "customer_10_9", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1002)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    assert(newSchema.columns(0).getClass == classOf[Int64Column])
    assert(newSchema.columns(0).name == "Id")
    assert(newSchema.columns(1).getClass == classOf[StringColumn])
    assert(newSchema.columns(1).name == "Birth day")

    newSchema.columns
      .drop(2)
      .foreach((column: Column) => {
        assertResult(true)(column.isInstanceOf[DoubleColumn])
      })
  }

  test("Pivot on sales with empty column") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("sales_10", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_empty_column_name", "ETL Database", "PIVOT 10 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Empty column",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "sales_10", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array(
          TableColumn(
            "Birth day",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "sales_10", fieldName = "birth_day", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Total Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "sales_10", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 483)

    assertResult(true)(newSchema.columns(0).isInstanceOf[StringColumn])
  }

  test("Pivot on sales with special column") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("sales_100", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_empty_column_name", "ETL Database", "PIVOT 100 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Empty column",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "sales_100", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array(
          TableColumn(
            "Birth day",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "sales_100", fieldName = "birth_day", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Total Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "sales_100", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )

    val pipeline = Pipeline
      .builder()
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 483)

    assertResult(true)(newSchema.columns(0).isInstanceOf[StringColumn])
  }

  test("pivot with duplicate destination") {
    // Root -> GetOperator -> PivotOperator
    // Root -> GetOperator -> PivotOperator2
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("sales_100", "ETL Database", "Get Customer"))
    val destTableConfig = DestTableConfig("pivot_empty_column_name", "ETL Database", "PIVOT 100 items");
    val pivotOperator = PivotOperator(
      2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Empty column",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "sales_100", fieldName = "name", fieldType = "string")
            )
          )
        ),
        rows = Array(
          TableColumn(
            "Birth day",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "sales_100", fieldName = "birth_day", fieldType = "string")
            )
          )
        ),
        values = Array(
          TableColumn(
            "Total Profit",
            function = Count(field =
              TableField(dbName = dbName, tblName = "sales_100", fieldName = "gender", fieldType = "string")
            )
          )
        ),
        filters = Array.empty
      ),
      destTableConfig
    )
    val pivotOperator2 = pivotOperator.copy(destTableConfiguration = destTableConfig.copy(tblName = "pivot_empty_column_name2"))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pivotOperator)
      .build()

    val pipline2 = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, pivotOperator2)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pivot::pipelineResult: ${pipelineResult}")
    assert(pipelineResult.isSucceed)
    val pipelineResult2: PipelineResult = pipline2.execute()
    println(s"pivot::pipelineResult2: ${pipelineResult2}")
    assert(pipelineResult2.isSucceed)
  }

}
