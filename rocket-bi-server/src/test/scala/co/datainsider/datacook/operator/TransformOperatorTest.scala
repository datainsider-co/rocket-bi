package co.datainsider.datacook.operator

import co.datainsider.bi.domain.chart.{GroupTableChartSetting, TableColumn}
import co.datainsider.bi.domain.query._
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

/**
  * @author tvc12 - Thien Vi
  * created 09/25/2021 - 2:49 PM
  */
class TransformOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 2606
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(TransformOperatorExecutor(operatorService))

  test("Table with select 3 columns ") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_10", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_3_columns", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = Select(field =
              TableField(dbName = dbName, tblName = "table_customer_10", fieldName = "id", fieldType = "string")
            )
          ),
          TableColumn(
            "Name",
            function = Select(field =
              TableField(dbName = dbName, tblName = "table_customer_10", fieldName = "name", fieldType = "string")
            )
          ),
          TableColumn(
            "Gender",
            function = Select(field =
              TableField(dbName = dbName, tblName = "table_customer_10", fieldName = "gender", fieldType = "string")
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
    assertResult(3)(newSchema.columns.size)
    assertTableSize(newSchema, 500)
    assert(newSchema.columns(0).getClass == classOf[Int64Column])
    assert(newSchema.columns(0).name == "Id")
    assert(newSchema.columns(1).getClass == classOf[StringColumn])
    assert(newSchema.columns(1).name == "Name")
    assert(newSchema.columns(2).getClass == classOf[StringColumn])
    assert(newSchema.columns(2).name == "Gender")
  }

  test("Table total id group by gender") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_10_1", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_group_by", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Gender",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "table_customer_10_1", fieldName = "gender", fieldType = "string")
            )
          ),
          TableColumn(
            "Total Id",
            function = Count(field =
              TableField(dbName = dbName, tblName = "table_customer_10_1", fieldName = "id", fieldType = "string")
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

    info(s"data type:; ${newSchema.columns(1).name} - ${newSchema.columns(1).getClass.getSimpleName}")
    assertResult(true)(newSchema != null)
    assertResult(destTableConfig.tblName)(newSchema.name)
    assertResult(destTableConfig.tblDisplayName)(newSchema.displayName)
    assertResult(getDbName(orgId, jobId))(newSchema.dbName)
    assertResult(2)(newSchema.columns.size)
    assertTableSize(newSchema, 2)
    assertResult(true)(newSchema.columns.head.isInstanceOf[StringColumn])
    assertResult(true)(newSchema.columns(1).isInstanceOf[Int64Column])
  }

  test("Table total id group by gender, birth day") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_10_2", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_group_by_2", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Gender",
            function = GroupBy(field =
              TableField(dbName = dbName, tblName = "table_customer_10_2", fieldName = "gender", fieldType = "string")
            )
          ),
          TableColumn(
            "Birth Day",
            function = GroupBy(field =
              TableField(
                dbName = dbName,
                tblName = "table_customer_10_2",
                fieldName = "birth_day",
                fieldType = "string"
              )
            )
          ),
          TableColumn(
            "Total Id",
            function = Count(field =
              TableField(dbName = dbName, tblName = "table_customer_10_2", fieldName = "id", fieldType = "string")
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
    assertResult(3)(newSchema.columns.size)
    assertTableSize(newSchema, 495)
    assert(newSchema.columns(0).getClass == classOf[StringColumn])
    assert(newSchema.columns(0).name == "Gender")
    assert(newSchema.columns(1).getClass == classOf[StringColumn])
    assert(newSchema.columns(1).name == "Birth Day")
    assert(newSchema.columns(2).getClass == classOf[Int64Column])
    assert(newSchema.columns(2).name == "Total Id")
  }

  test("Table with date histogram with second of") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_second_column", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToSecondNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 483)
  }

  test("Table with date histogram with minute of") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_1", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_minute_column", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_1",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToMinuteNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 483)
  }

  test("Table with date histogram with hour of") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_2", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_hour_column", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_2",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToHourNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 483)
  }

  test("Table with date histogram day of") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_3", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_date_columns", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_3",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToDayNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 483)
  }

  test("Table with date histogram with week of") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_4", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_week_column", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_4",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToWeekNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 395)
  }

  test("Table with date histogram with month of") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_5", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_month_column", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_5",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToMonthNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 215)
  }

  test("Table with date histogram with quarter of") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_6", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_month_column", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_6",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToQuarterNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 215)
  }

  test("Table with date histogram with year of") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_7", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_year_column", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_7",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToYearNum(Some(ToDateTime())))
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
    assertTableSize(newSchema, 21)
  }

  test("Table with date histogram with year") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_8", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_year", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_8",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToYear(Some(ToDateTime())))
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
    assertTableSize(newSchema, 21)
  }

  test("Table with date histogram with quarter of year") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_9", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_quarter_year", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_9",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToQuarter(Some(ToDateTime())))
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
    assertTableSize(newSchema, 4)
  }

  test("Table with date histogram with month of year") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_10", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_month_year", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_10",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToMonth(Some(ToDateTime())))
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
    assertTableSize(newSchema, 12)
  }

  test("Table with date histogram with day of year") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_101", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_day_year", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_101",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToDayOfYear(Some(ToDateTime())))
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
    assertTableSize(newSchema, 269)
  }

  test("Table with date histogram with day of month") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_11", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_day_month", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_11",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToDayOfMonth(Some(ToDateTime())))
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
    assertTableSize(newSchema, 31)
  }

  test("Table with date histogram with day of week") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_12", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_day_week", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_12",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToDayOfWeek(Some(ToDateTime())))
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
    assertTableSize(newSchema, 7)
  }

  test("Table with date histogram with hour of day") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_13", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_hour_of_day", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_13",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToHour(Some(ToDateTime())))
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

  test("Table with date histogram with minute of hour") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_14", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_minute_hour", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_14",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToMinute(Some(ToDateTime())))
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

  test("Table with date histogram with second of minute") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_15", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_second", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_15",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToSecond(Some(ToDateTime())))
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

  test("Table with date histogram with aggregation") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_16", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_date_2_columns", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_16",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToYear(Some(ToDateTime())))
            )
          ),
          TableColumn(
            "Count Id",
            function = Count(field =
              TableField(
                dbName = dbName,
                tblName = "table_customer_1000_16",
                fieldName = "birth_day",
                fieldType = "string"
              )
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
    assertTableSize(newSchema, 21)
  }

  test("Table using select date time") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_17", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_select_columns", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = Select(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_17",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToDateTime())
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
    assertTableSize(newSchema, 500)
  }

  test("Table using select date") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_18", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_select_date_columns", "ETL Database", "SQL 10 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = Select(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_18",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(ToDate())
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
    assertTableSize(newSchema, 500)
  }

  test("Table using select date time with nullable") {
    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_19", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_select_date_time_nullable", "ETL Database", "SQL 100 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Birth Day",
            function = Select(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_19",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(Cast("Nullable(DateTime)"))
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
    assertTableSize(newSchema, 500)
  }

  test("Table using select date with nullable") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_20", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_select_date_nullable", "ETL Database", "SQL 100 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Birth Day",
            function = Select(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_20",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(Cast("Nullable(Date)"))
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
    assertTableSize(newSchema, 500)
  }

  test("Table using group by date with nullable") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_21", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_group_by_date_nullable", "ETL Database", "SQL 100 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Birth Day",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_21",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(Cast("Nullable(Date)"))
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
    assertTableSize(newSchema, 483)
  }

  test("Table using group by date time with nullable") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_22", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_group_by_date_time_nullable", "ETL Database", "SQL 100 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Birth Day",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_22",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(Cast("Nullable(DateTime)"))
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
    assertTableSize(newSchema, 483)
  }

  test("Table using none id with nullable") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_23", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_none_id_nullable", "ETL Database", "SQL 100 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = Select(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_23",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(Cast(innerFn = Some(Cast("Nullable(DateTime)")), asType = "Nullable(Int32)"))
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
    assertTableSize(newSchema, 500)
  }

  test("Table using group by id with nullable") {

    // Root -> GetOperator -> TransformOperator
    val rootOperator = RootOperator(0)
    val getOperator =
      GetOperator(1, customerTable, DestTableConfig("table_customer_1000_24", "ETL Database", "Get Customer 100"))
    val destTableConfig = DestTableConfig("table_group_by_id_nullable", "ETL Database", "SQL 100 items")
    val pivotOperator = TransformOperator(
      2,
      query = GroupTableChartSetting(
        columns = Array(
          TableColumn(
            "Id",
            function = GroupBy(
              field = TableField(
                dbName = dbName,
                tblName = "table_customer_1000_24",
                fieldName = "birth_day",
                fieldType = "string"
              ),
              scalarFunction = Some(Cast(innerFn = Some(Cast("Nullable(DateTime)")), asType = "Nullable(Int32)"))
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
    assertTableSize(newSchema, 483)
  }

}
