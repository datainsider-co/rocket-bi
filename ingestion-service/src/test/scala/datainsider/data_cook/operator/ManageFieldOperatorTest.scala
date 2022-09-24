package datainsider.data_cook.operator

import datainsider.client.domain.query.TableField
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.{ExpressionFieldConfiguration, FieldType, NormalFieldConfiguration, TableConfiguration}
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator.{GetOperator, ManageFieldOperator, RootOperator}
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.ingestion.domain._

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class ManageFieldOperatorTest extends OperatorTest {
  override protected val jobId: EtlJobId = 1500
  implicit val resolver: ExecutorResolver = injector.instance[ExecutorResolver]

  test("pipeline manage field show 1 column") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl1_test_1", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(NormalFieldConfiguration("Alias Field Name", field = TableField(dbName, "tbl1_test_1", "name", ""))),
      TableConfiguration("manage_field_test_1", "ETL Database", "Manage field items")
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, tableSchema, TableConfiguration("manage_field_test_1", "ETL Database", "Manage field items"))
    assertResult(1)(tableSchema.columns.size)

    assertColumn(tableSchema, 0, Some("Alias Field Name"), Some("Alias Field Name"))
    assertTableSize(tableSchema, 500)
  }

  test("Show 1 column use as int") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl1_test_2", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(NormalFieldConfiguration("Name as number 16", field = TableField(dbName, "tbl1_test_2", "name", ""), asType = Some(FieldType.Int16))),
      TableConfiguration("manage_field_100", "ETL Database", "Manage field items")
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, tableSchema, TableConfiguration("manage_field_100", "ETL Database", "Manage field items"))
    assertResult(1)(tableSchema.columns.size)

    val column: Column = tableSchema.columns.head
    assertColumn(tableSchema, 0, Some("Name as number 16"), Some("Name as number 16"))
    assertColumnType[Int16Column](tableSchema, 0)

    assertTableSize(tableSchema, 500)
  }

  test("Cast type limit 1000 items") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl1_test_3", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration(
          "Name as number 8",
          field = TableField(dbName, "tbl1_test_3", "name", ""),
          asType = Some(FieldType.Int8)
        ),
        NormalFieldConfiguration(
          "Name as number 16",
          field = TableField(dbName, "tbl1_test_3", "name", ""),
          asType = Some(FieldType.Int16)
        ),
        NormalFieldConfiguration(
          "Name as number 32",
          field = TableField(dbName, "tbl1_test_3", "name", ""),
          asType = Some(FieldType.Int32)
        ),
        NormalFieldConfiguration(
          "Name as number 64",
          field = TableField(dbName, "tbl1_test_3", "name", ""),
          asType = Some(FieldType.Int64)
        ),
        NormalFieldConfiguration("Id as uint 8", field = TableField(dbName, "tbl1_test_3", "id", ""), asType = Some(FieldType.UInt8)),
        NormalFieldConfiguration(
          "Id as uint 16",
          field = TableField(dbName, "tbl1_test_3", "id", ""),
          asType = Some(FieldType.UInt16)
        ),
        NormalFieldConfiguration(
          "Id as uint 32",
          field = TableField(dbName, "tbl1_test_3", "id", ""),
          asType = Some(FieldType.UInt32)
        ),
        NormalFieldConfiguration(
          "Id as uint 64",
          field = TableField(dbName, "tbl1_test_3", "id", ""),
          asType = Some(FieldType.UInt64)
        ),
        NormalFieldConfiguration("Id as float", field = TableField(dbName, "tbl1_test_3", "id", ""), asType = Some(FieldType.Float)),
        NormalFieldConfiguration(
          "Id as double",
          field = TableField(dbName, "tbl1_test_3", "id", ""),
          asType = Some(FieldType.Double)
        ),
        NormalFieldConfiguration(
          "birth day as date",
          field = TableField(dbName, "tbl1_test_3", "birth_day", ""),
          asType = Some(FieldType.Date)
        ),
        NormalFieldConfiguration(
          "birth day as datetime",
          field = TableField(dbName, "tbl1_test_3", "birth_day", ""),
          asType = Some(FieldType.DateTime)
        ),
        NormalFieldConfiguration(
          "birth day as datetime64",
          field = TableField(dbName, "tbl1_test_3", "birth_day", ""),
          asType = Some(FieldType.DateTime64)
        ),
        NormalFieldConfiguration("id to string", field = TableField(dbName, "tbl1_test_3", "id", ""), asType = Some(FieldType.String))
      ),
      TableConfiguration("manage_field_1000", "ETL Database", "Manage field items")
    )

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get


    assertTableSchemaInfo(jobId, tableSchema, TableConfiguration("manage_field_1000", "ETL Database", "Manage field items"))
    assertResult(14)(tableSchema.columns.size)

    assertColumn(tableSchema, 0, Some("Name as number 8"), Some("Name as number 8"))
    assertColumn(tableSchema, 1, Some("Name as number 16"), Some("Name as number 16"))
    assertColumn(tableSchema, 2, Some("Name as number 32"), Some("Name as number 32"))
    assertColumn(tableSchema, 3, Some("Name as number 64"), Some("Name as number 64"))

    assertColumn(tableSchema, 4, Some("Id as uint 8"), Some("Id as uint 8"))
    assertColumn(tableSchema, 5, Some("Id as uint 16"), Some("Id as uint 16"))
    assertColumn(tableSchema, 6, Some("Id as uint 32"), Some("Id as uint 32"))
    assertColumn(tableSchema, 7, Some("Id as uint 64"), Some("Id as uint 64"))

    assertColumn(tableSchema, 8, Some("Id as float"), Some("Id as float"))
    assertColumn(tableSchema, 9, Some("Id as double"), Some("Id as double"))

    assertColumn(tableSchema, 10, Some("birth day as date"), Some("birth day as date"))
    assertColumn(tableSchema, 11, Some("birth day as datetime"), Some("birth day as datetime"))
    assertColumn(tableSchema, 12, Some("birth day as datetime64"), Some("birth day as datetime64"))

    assertColumn(tableSchema, 13, Some("id to string"), Some("id to string"))

    assertColumnType[Int8Column](tableSchema, 0)
    assertColumnType[Int16Column](tableSchema, 1)
    assertColumnType[Int32Column](tableSchema, 2)
    assertColumnType[Int64Column](tableSchema, 3)

    assertColumnType[UInt8Column](tableSchema, 4)
    assertColumnType[UInt16Column](tableSchema, 5)
    assertColumnType[UInt32Column](tableSchema, 6)
    assertColumnType[UInt64Column](tableSchema, 7)

    assertColumnType[FloatColumn](tableSchema, 8)
    assertColumnType[DoubleColumn](tableSchema, 9)

    assertColumnType[DateColumn](tableSchema, 10)
    assertColumnType[DateTimeColumn](tableSchema, 11)
    assertColumnType[DateTime64Column](tableSchema, 12)

    assertColumnType[StringColumn](tableSchema, 13)

//    assertTableSize(tableSchema, 1000, true)
  }

  test("Alias field name limit 100") {
    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl1_test_4", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_4", "id", "")),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_4", "name", "")),
        NormalFieldConfiguration("Customer Gender", field = TableField(dbName, "tbl1_test_4", "gender", "")),
        NormalFieldConfiguration("Customer Address", field = TableField(dbName, "tbl1_test_4", "address", "")),
        NormalFieldConfiguration("Customer Birth Day", field = TableField(dbName, "tbl1_test_4", "birth_day", ""))
      ),
      TableConfiguration("alias_field_100", "ETL Database", "Manage field items")
    )
    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, newSchema, TableConfiguration("alias_field_100", "ETL Database", "Manage field items"))
    assertResult(5)(newSchema.columns.size)

    assertColumn(newSchema, 0, Some("Customer Id"), Some("Customer Id"))
    assertColumn(newSchema, 1, Some("Customer Name"), Some("Customer Name"))
    assertColumn(newSchema, 2, Some("Customer Gender"), Some("Customer Gender"))
    assertColumn(newSchema, 3, Some("Customer Address"), Some("Customer Address"))
    assertColumn(newSchema, 4, Some("Customer Birth Day"), Some("Customer Birth Day"))

    assertColumnType[StringColumn](newSchema, 0)
    assertColumnType[StringColumn](newSchema, 1)
    assertColumnType[StringColumn](newSchema, 2)
    assertColumnType[StringColumn](newSchema, 3)
    assertColumnType[StringColumn](newSchema, 4)

    assertTableSize(newSchema, 500)
  }

  test("Alias field use hidden") {

    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl1_test_5", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_5", "id", ""), isHidden = true),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_5", "name", "")),
        NormalFieldConfiguration("Customer Gender", field = TableField(dbName, "tbl1_test_5", "gender", ""), isHidden = true),
        NormalFieldConfiguration("Customer Address", field = TableField(dbName, "tbl1_test_5", "address", "")),
        NormalFieldConfiguration("Customer Birth Day", field = TableField(dbName, "tbl1_test_5", "birth_day", ""))
      ),
      TableConfiguration("hidden_field_100", "ETL Database", "Manage field items")
    )
    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, newSchema, TableConfiguration("hidden_field_100", "ETL Database", "Manage field items"))
    assertResult(3)(newSchema.columns.size)

    assertColumn(newSchema, 0, Some("Customer Name"), Some("Customer Name"))
    assertColumn(newSchema, 1, Some("Customer Address"), Some("Customer Address"))
    assertColumn(newSchema, 2, Some("Customer Birth Day"), Some("Customer Birth Day"))

    assertColumnType[StringColumn](newSchema, 0)
    assertColumnType[StringColumn](newSchema, 1)
    assertColumnType[StringColumn](newSchema, 2)

    assertTableSize(newSchema, 500)
  }

  test("Use 1 expression no cast type") {

    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl1_test_6", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_6", "id", "")),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_6", "name", ""))
      ),
      TableConfiguration("use_expr_10", "ETL Database", "Manage field items"),
      extraFields = Array(
        ExpressionFieldConfiguration("name_lower_case", "Name To Lower case", "lower(name)")
      )
    )
    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val tableSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get


    assertTableSchemaInfo(jobId, tableSchema, TableConfiguration("use_expr_10", "ETL Database", "Manage field items"))
    assertResult(3)(tableSchema.columns.size)

    assertColumn(tableSchema, 0, Some("Customer Id"), Some("Customer Id"))
    assertColumn(tableSchema, 1, Some("Customer Name"), Some("Customer Name"))
    assertColumn(tableSchema, 2, Some("Name To Lower case"), Some("Name To Lower case"))

    assertColumnType[StringColumn](tableSchema, 0)
    assertColumnType[StringColumn](tableSchema, 1)
    assertColumnType[StringColumn](tableSchema, 2)

    assertTableSize(tableSchema, 500)
  }

  test("Use 3 expression with cast type") {

    // Root -> GetOperator -> MangeFieldOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, customerSchema, TableConfiguration("tbl1_test_7", "ETL Database", "Get Customer"))
    val manageFieldOperator = ManageFieldOperator(
      2,
      Array(
        NormalFieldConfiguration("Customer Id", field = TableField(dbName, "tbl1_test_7", "id", "")),
        NormalFieldConfiguration("Customer Name", field = TableField(dbName, "tbl1_test_7", "name", ""))
      ),
      TableConfiguration("use_expr_200", "ETL Database", "Manage field items"),
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
    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, manageFieldOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(true)(pipelineResult.isSucceed)
    assertResult(3)(pipelineResult.mapResult.size)
    val newSchema: TableSchema = pipelineResult.mapResult(manageFieldOperator.id).getData[TableSchema]().get

    assertTableSchemaInfo(jobId, newSchema, TableConfiguration("use_expr_200", "ETL Database", "Manage field items"))
    assertResult(5)(newSchema.columns.size)

    assertColumn(newSchema, 0, Some("Customer Id"), Some("Customer Id"))
    assertColumn(newSchema, 1, Some("Customer Name"), Some("Customer Name"))
    assertColumn(newSchema, 2, Some("Name To Lower case"), Some("Name To Lower case"))
    assertColumn(newSchema, 3, Some("Enum Type"), Some("Enum Type"))
    assertColumn(newSchema, 4, Some("text to int"), Some("text to int"))

    assertColumnType[StringColumn](newSchema, 0)
    assertColumnType[StringColumn](newSchema, 1)
    assertColumnType[StringColumn](newSchema, 2)
    assertColumnType[StringColumn](newSchema, 3)
    assertColumnType[Int32Column](newSchema, 4)

    assertTableSize(newSchema, 500)
  }

}
