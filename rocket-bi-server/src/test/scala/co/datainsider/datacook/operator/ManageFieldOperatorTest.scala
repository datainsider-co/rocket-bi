package co.datainsider.datacook.operator

import co.datainsider.bi.domain.query.{Limit, TableField}
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.{DestTableConfig, ExpressionFieldConfiguration, FieldType, NormalFieldConfiguration}
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class ManageFieldOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 1501
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(operatorService, Some(Limit(0, 500))))
    .register(ManageFieldOperatorExecutor(operatorService))

  test("pipeline manage field show 1 column") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    //    "id", "name", "gender", "address", "birth_day"
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl1_test_1", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration(
          "Alias Field Name",
          field = TableField(dbName, "tbl1_test_1", "id", ""),
          isHidden = false
        ),
        NormalFieldConfiguration("name", field = TableField(dbName, "tbl1_test_1", "name", ""), isHidden = true),
        NormalFieldConfiguration("gender", field = TableField(dbName, "tbl1_test_1", "gender", ""), isHidden = true),
        NormalFieldConfiguration("address", field = TableField(dbName, "tbl1_test_1", "address", ""), isHidden = true),
        NormalFieldConfiguration(
          "birth_day",
          field = TableField(dbName, "tbl1_test_1", "birth_day", ""),
          isHidden = true
        )
      ),
      DestTableConfig("manage_field_test_1", "ETL Database", "Manage field items")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(pipelineResult)
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(
      jobId,
      tableSchema,
      DestTableConfig("manage_field_test_1", "ETL Database", "Manage field items")
    )
    assertResult(1)(tableSchema.columns.size)

    assertColumn(tableSchema, 0, Some("Alias Field Name"), Some("Alias Field Name"))
    assertTableSize(tableSchema, 500)
  }

  test("Show 1 column use as int") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl1_test_2", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration(
          displayName = "Name as number 16",
          field = TableField(dbName, "tbl1_test_2", "name", ""),
          asType = Some(FieldType.Int16)
        ),
        NormalFieldConfiguration("id", field = TableField(dbName, "tbl1_test_1", "id", ""), isHidden = true),
        NormalFieldConfiguration("gender", field = TableField(dbName, "tbl1_test_1", "gender", ""), isHidden = true),
        NormalFieldConfiguration("address", field = TableField(dbName, "tbl1_test_1", "address", ""), isHidden = true),
        NormalFieldConfiguration(
          "birth_day",
          field = TableField(dbName, "tbl1_test_1", "birth_day", ""),
          isHidden = true
        )
      ),
      DestTableConfig("manage_field_100", "ETL Database", "Manage field items")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(
      jobId,
      tableSchema,
      DestTableConfig("manage_field_100", "ETL Database", "Manage field items")
    )
    assertResult(1)(tableSchema.columns.size)

    val column: Column = tableSchema.columns.head
    assertColumn(tableSchema, 0, Some("Name as number 16"), Some("Name as number 16"))
    assertColumnType[Int16Column](tableSchema, 0)

    assertTableSize(tableSchema, 500)
  }

  test("Cast type limit 1000 items") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl1_test_3", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration(
          "Id as float",
          field = TableField(dbName, "tbl1_test_3", "id", ""),
          asType = Some(FieldType.Float)
        ),
        NormalFieldConfiguration(
          "Id as double",
          field = TableField(dbName, "tbl1_test_3", "name", ""),
          asType = Some(FieldType.Double)
        ),
        NormalFieldConfiguration(
          "birth day as datetime64",
          field = TableField(dbName, "tbl1_test_3", "birth_day", ""),
          asType = Some(FieldType.DateTime64)
        ),
        NormalFieldConfiguration(
          "id to string",
          field = TableField(dbName, "tbl1_test_3", "address", ""),
          asType = Some(FieldType.String)
        ),
        NormalFieldConfiguration("gender", field = TableField(dbName, "tbl1_test_1", "gender", ""), isHidden = true)
      ),
      DestTableConfig("manage_field_1000", "ETL Database", "Manage field items")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(
      jobId,
      tableSchema,
      DestTableConfig("manage_field_1000", "ETL Database", "Manage field items")
    )
    assertResult(4)(tableSchema.columns.size)

    assertColumnType[FloatColumn](tableSchema, "Id as float")
    assertColumnType[DoubleColumn](tableSchema, "Id as double")

    assertColumnType[DateTime64Column](tableSchema, "birth day as datetime64")

    assertColumnType[StringColumn](tableSchema, "id to string")

    //    assertTableSize(tableSchema, 1000, true)
  }

  test("Alias field name limit 100") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl1_test_4", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_4", "id", "")),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_4", "name", "")),
        NormalFieldConfiguration("Customer Gender", field = TableField(dbName, "tbl1_test_4", "gender", "")),
        NormalFieldConfiguration("Customer Address", field = TableField(dbName, "tbl1_test_4", "address", "")),
        NormalFieldConfiguration("Customer Birth Day", field = TableField(dbName, "tbl1_test_4", "birth_day", ""))
      ),
      DestTableConfig("alias_field_100", "ETL Database", "Manage field items")
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, newSchema, DestTableConfig("alias_field_100", "ETL Database", "Manage field items"))
    assertResult(5)(newSchema.columns.size)

    assertColumnType[StringColumn](newSchema, "Customer Id")
    assertColumnType[StringColumn](newSchema, "Customer Name")
    assertColumnType[StringColumn](newSchema, "Customer Gender")
    assertColumnType[StringColumn](newSchema, "Customer Address")
    assertColumnType[StringColumn](newSchema, "Customer Birth Day")

    assertTableSize(newSchema, 500)
  }

  test("Alias field use hidden") {

    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl1_test_5", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_5", "id", ""), isHidden = true),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_5", "name", "")),
        NormalFieldConfiguration(
          "Customer Gender",
          field = TableField(dbName, "tbl1_test_5", "gender", ""),
          isHidden = true
        ),
        NormalFieldConfiguration("Customer Address", field = TableField(dbName, "tbl1_test_5", "address", "")),
        NormalFieldConfiguration("Customer Birth Day", field = TableField(dbName, "tbl1_test_5", "birth_day", ""))
      ),
      DestTableConfig("hidden_field_100", "ETL Database", "Manage field items")
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(
      jobId,
      newSchema,
      DestTableConfig("hidden_field_100", "ETL Database", "Manage field items")
    )
    assertResult(3)(newSchema.columns.size)

    assertColumnType[StringColumn](newSchema, "Customer Name")
    assertColumnType[StringColumn](newSchema, "Customer Address")
    assertColumnType[StringColumn](newSchema, "Customer Birth Day")

    assertTableSize(newSchema, 500)
  }

  test("Use 1 expression no cast type") {

    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl1_test_6", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_6", "id", "")),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_6", "name", "")),
        NormalFieldConfiguration("gender", field = TableField(dbName, "tbl1_test_1", "gender", ""), isHidden = true),
        NormalFieldConfiguration("address", field = TableField(dbName, "tbl1_test_1", "address", ""), isHidden = true),
        NormalFieldConfiguration(
          "birth_day",
          field = TableField(dbName, "tbl1_test_1", "birth_day", ""),
          isHidden = true
        )
      ),
      DestTableConfig("use_expr_10", "ETL Database", "Manage field items"),
      extraFields = Array(
        ExpressionFieldConfiguration("name_lower_case", "Name To Lower case", "lower(name)")
      )
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, tableSchema, DestTableConfig("use_expr_10", "ETL Database", "Manage field items"))
    assertResult(3)(tableSchema.columns.size)

    assertColumnType[StringColumn](tableSchema, "Customer Id")
    assertColumnType[StringColumn](tableSchema, "Customer Name")
    assertColumnType[StringColumn](tableSchema, "Name To Lower case")

    assertTableSize(tableSchema, 500)
  }

  test("Use 3 expression with cast type") {

    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerTable, DestTableConfig("tbl1_test_7", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_7", "id", "")),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_7", "name", "")),
        NormalFieldConfiguration("gender", field = TableField(dbName, "tbl1_test_1", "gender", ""), isHidden = true),
        NormalFieldConfiguration("address", field = TableField(dbName, "tbl1_test_1", "address", ""), isHidden = true),
        NormalFieldConfiguration(
          "birth_day",
          field = TableField(dbName, "tbl1_test_1", "birth_day", ""),
          isHidden = true
        )
      ),
      DestTableConfig("use_expr_200", "ETL Database", "Manage field items"),
      extraFields = Array(
        ExpressionFieldConfiguration("name_lower_case", "Name To Lower case", "lower(name)"),
        ExpressionFieldConfiguration(
          "enum",
          "Enum Type",
          "if(toInt32(id) > 100, 1000, -1000)",
          asType = Some(FieldType.String)
        ),
        ExpressionFieldConfiguration(
          "text_to_int",
          "text to int",
          "if(toInt32(id) > 100, '500', '-500')",
          Some(FieldType.Int32)
        )
      )
    )
    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, newSchema, DestTableConfig("use_expr_200", "ETL Database", "Manage field items"))
    assertResult(5)(newSchema.columns.size)

    assertColumnType[StringColumn](newSchema, "Customer Id")
    assertColumnType[StringColumn](newSchema, "Customer Name")
    assertColumnType[StringColumn](newSchema, "Name To Lower case")
    assertColumnType[StringColumn](newSchema, "Enum Type")
    assertColumnType[Int32Column](newSchema, "text to int")

    assertTableSize(newSchema, 500)
  }

}
