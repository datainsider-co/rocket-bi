package datainsider.data_cook.operator

import datainsider.client.domain.query._
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.pipeline.operator.{GetOperator, ManageFieldOperator, PivotOperator, RootOperator}
import datainsider.data_cook.service.table.EtlTableService.getDbName
import datainsider.ingestion.domain.{Column, DoubleColumn, StringColumn, TableSchema}

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class PivotOperatorTest extends OperatorTest {
  override protected val jobId: EtlJobId = 4104
  implicit val resolver: ExecutorResolver = injector.instance[ExecutorResolver]


  test("Pivot on customer") {
    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
      query = PivotTableSetting(
        columns = Array(
          TableColumn(
            "Name",
            function = GroupBy(field =
              TableField(dbName, tblName = "customer_10", fieldName = "name", fieldType = "string")
            )
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 500)
  }

  test("Pivot on customer only column") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_1", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_only_column", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(500)(newSchema.columns.size)

    assertTableSize(newSchema, 1)
  }

  test("Pivot on customer only row") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_2", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_only_row", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)

    assertTableSize(newSchema, 500)
  }

  test("Pivot on customer only value") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_3", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_only_value", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1)(newSchema.columns.size)

    assertTableSize(newSchema, 1)
  }

  test("Pivot on customer only row and value") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_4", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_only_row_column", "ETL Database", "SQL 10 items")
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    newSchema.columns.drop(1).foreach((column: Column) => {
      assertResult(true)(column.isInstanceOf[DoubleColumn])
    })
  }

  test("Pivot on customer only column and value") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_5", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_only_column_value", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_6", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_row_value", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(2)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    assertResult(true)(newSchema.columns.head.isInstanceOf[StringColumn])
    assertResult(true)(newSchema.columns(1).isInstanceOf[DoubleColumn])
  }

  test("Pivot on customer two rows") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_7", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_two_rows", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(502)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    assertResult(true)(newSchema.columns.head.isInstanceOf[StringColumn])
    assertResult(true)(newSchema.columns(1).isInstanceOf[StringColumn])

    newSchema.columns.drop(2).foreach((column: Column) => {
      assertResult(true)(column.isInstanceOf[DoubleColumn])
    })
  }

  test("Pivot on customer two values") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_8", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_two_values", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1001)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    assertResult(true)(newSchema.columns.head.isInstanceOf[StringColumn])

    newSchema.columns.drop(1).foreach((column: Column) => {
      assertResult(true)(column.isInstanceOf[DoubleColumn])
    })
  }

  test("Pivot on customer two rows two values") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("customer_10_9", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_10_two_rows_two_values", "ETL Database", "SQL 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(1002)(newSchema.columns.size)

    assertTableSize(newSchema, 500)

    assertResult(true)(newSchema.columns(0).isInstanceOf[StringColumn])
    assertResult(true)(newSchema.columns(1).isInstanceOf[StringColumn])
    newSchema.columns.drop(2).foreach((column: Column) => {
      assertResult(true)(column.isInstanceOf[DoubleColumn])
    })
  }

  test("Pivot on sales with empty column") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("sales_10", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_empty_column_name", "ETL Database", "PIVOT 10 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 484)

    assertResult(true)(newSchema.columns(0).isInstanceOf[StringColumn])
  }

  test("Pivot on sales with special column") {

    // Root -> GetOperator -> PivotOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("sales_100", "ETL Database", "Get Customer"))
    val destTableConfig = TableConfiguration("pivot_empty_column_name", "ETL Database", "PIVOT 100 items");
    val pivotOperator = PivotOperator(2,
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
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(501)(newSchema.columns.size)

    assertTableSize(newSchema, 484)

    assertResult(true)(newSchema.columns(0).isInstanceOf[StringColumn])
  }

}
