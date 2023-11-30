package co.datainsider.datacook.operator

import co.datainsider.bi.domain.query.Limit
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.domain.{EtlConfig, IncrementalConfig}
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator.{GetOperator, GetOperatorExecutor, RootOperator, RootOperatorExecutor}
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class GetOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {

  override protected val jobId: EtlJobId = 1200
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(operatorService, Some(Limit(0, 500))))

  override def setupSampleTables(): Unit = {
    loadData(getClass.getClassLoader.getResource("datasets/customers.csv").getPath, customerTable)
    loadData(getClass.getClassLoader.getResource("datasets/orders.csv").getPath, orderTable)
  }

  test("run pipeline RootOperator -> GetOperation") {
    val rootOperator = RootOperator(0)
    val destTableConfig = DestTableConfig("customer_testing", "ETL Database", "Get Customer")
    val getOperator = GetOperator(1, customerTable, destTableConfig)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(pipelineResult.isSucceed)(true)
    val tableSchema: TableSchema = pipelineResult.mapResult(getOperator.id).getData[TableSchema]().get
    assertResult(true)(tableSchema != null)
    assertResult(destTableConfig.tblName)(tableSchema.name)
    assertResult(destTableConfig.tblDisplayName)(tableSchema.displayName)
    assertResult(getDbName(orgId, jobId))(tableSchema.dbName)
    assertResult(customerTable.columns.length)(tableSchema.columns.size)
    assertTableSize(schema = tableSchema, expectedTotal = 500)
  }

  test("run complex pipeline RootOperator -> GetOperation") {

    /**
      * RootOperator -> GetOperation
      *              \
      *               -> GetOperation
      */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, orderTable, DestTableConfig("table_1", "ETL Database", "Get Customer"))
    val getOperator2 = GetOperator(2, customerTable, DestTableConfig("table_2", "ETL Database", "Get Customer"))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(3)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(orderTable.columns.length)(tableSchema1.columns.size)
    assertTableSize(tableSchema1, expectedTotal = 500)

    val tableSchema2: TableSchema = pipelineResult.mapResult(getOperator2.id).getData[TableSchema]().get
    assertResult(customerTable.columns.length)(tableSchema2.columns.size)
    assertTableSize(tableSchema2, expectedTotal = 500)

  }

  test("run exception pipeline RootOperator -> GetOperation") {
    val rootOperator = RootOperator(0)
    val destTableConfig = DestTableConfig("new_testing", "ETL Database", "Get Customer")
    val getOperator = GetOperator(1, customerTable.copy("db_name"), destTableConfig)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(pipelineResult.isSucceed)(false)
    assertResult(pipelineResult.exception.isDefined)(true)
    assertResult(pipelineResult.errorOperator)(Option(getOperator))
  }

  test("run pipeline RootOperator -> GetOperation with incremental string value") {

    /**
      * RootOperator -> GetOperation
      */
    val rootOperator = RootOperator(0)
    val getOperator1 =
      GetOperator(1, orderTable, DestTableConfig("table_string_value", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "800"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(orderTable.columns.length)(tableSchema1.columns.size)
    assertTableSize(tableSchema1, expectedTotal = 200)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value == "1000")
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id <= '${minValue}'",
      1
    )
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id >= '${maxValue}'",
      0
    )

  }


  test("run pipeline RootOperator -> GetOperation with incremental empty string value") {

    /**
      * RootOperator -> GetOperation
      */
    val rootOperator = RootOperator(0)
    val getOperator1 =
      GetOperator(1, orderTable, DestTableConfig("table_empty_string", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(orderTable.columns.length)(tableSchema1.columns.size)
    assertTableSize(tableSchema1, expectedTotal = 500)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assert(maxValue == "1000")
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id > ${maxValue}",
      0
    )

  }

  test("run pipeline RootOperator -> GetOperation with incremental number value") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_number",
      columns = Seq(
        Int64Column("id", "id"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 =
      GetOperator(1, salesSchema, DestTableConfig("sales_schema_number_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "100"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(salesSchema.columns.length)(tableSchema1.columns.size)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id < '${minValue}'",
      0
    )
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id >= '${maxValue}'",
      0
    )
  }

  test("run pipeline RootOperator -> GetOperation with incremental number value input incorrect format") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_number_incorrect_format",
      columns = Seq(
        Int64Column("id", "id"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(
      1,
      salesSchema,
      DestTableConfig("sales_schema_number_incorrect_format_1", "ETL Database", "Get Customer")
    )
    val config = EtlConfig()
    val minValue = "tvc12"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(false)
    assertResult(pipelineResult.mapResult.size)(1)
  }

  test("run pipeline RootOperator -> GetOperation with incremental empty number value") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_number_empty",
      columns = Seq(
        Int64Column("id", "id"),
        StringColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 =
      GetOperator(1, salesSchema, DestTableConfig("sales_schema_number_empty_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(salesSchema.columns.length)(tableSchema1.columns.size)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id > '${maxValue}'",
      0
    )
  }

  test("run pipeline RootOperator -> GetOperation with incremental date value") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_date",
      columns = Seq(
        DateColumn("created_date", "created_date"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 =
      GetOperator(1, salesSchema, DestTableConfig("sales_schema_incremental_date", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "2022-12-12"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(salesSchema.columns.length)(tableSchema1.columns.size)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date < '${minValue}'",
      0
    )
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date >  '${maxValue}'",
      0
    )
  }

  test("run pipeline RootOperator -> GetOperation with incremental date value incorrect format") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_date_incorrect_format",
      columns = Seq(
        DateColumn("created_date", "created_date"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(
      1,
      salesSchema,
      DestTableConfig("sales_schema_date_incorrect_format_1", "ETL Database", "Get Customer")
    )
    val config = EtlConfig()
    val minValue = "tvx213213"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(false)
    assertResult(pipelineResult.mapResult.size)(1)
  }

  test("run pipeline RootOperator -> GetOperation with incremental empty date value") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_date_empty",
      columns = Seq(
        DateColumn("created_date", "created_date"),
        StringColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 =
      GetOperator(1, salesSchema, DestTableConfig("sales_schema_date_empty_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date", minValue))

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(salesSchema.columns.length)(tableSchema1.columns.size)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date > '${maxValue}'",
      0
    )
  }

  test("run pipeline RootOperator -> GetOperation with incremental date time value") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_date_time_2",
      columns = Seq(
        DateTimeColumn("created_date_time", "created_date_time"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(
      1,
      salesSchema,
      DestTableConfig("sales_schema_incremental_date_time", "ETL Database", "Get Customer")
    )
    val config = EtlConfig()
    val minValue = "2022-12-12 12:12:12"
    config.updateIncrementalConfig(
      getOperator1.destTableConfiguration,
      IncrementalConfig("created_date_time", minValue)
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(salesSchema.columns.length)(tableSchema1.columns.size)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time < '${minValue}'",
      0
    )
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time >  '${maxValue}'",
      0
    )
  }

  test("run pipeline RootOperator -> GetOperation with incremental date time value incorrect format") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_date_time_incorrect_format",
      columns = Seq(
        DateTimeColumn("created_date_time", "created_date_time"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(
      1,
      salesSchema,
      DestTableConfig("sales_schema_date_time_incorrect_format_1", "ETL Database", "Get Customer")
    )
    val config = EtlConfig()
    val minValue = "sdasdasczxcsadasd"
    config.updateIncrementalConfig(
      getOperator1.destTableConfiguration,
      IncrementalConfig("created_date_time", minValue)
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(false)
    assertResult(pipelineResult.mapResult.size)(1)
  }

  test("run pipeline RootOperator -> GetOperation with incremental date time value 2") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_date_time",
      columns = Seq(
        DateTimeColumn("created_date_time", "created_date_time"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 =
      GetOperator(1, salesSchema, DestTableConfig("sales_schema_date", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "2022-12-12"
    config.updateIncrementalConfig(
      getOperator1.destTableConfiguration,
      IncrementalConfig("created_date_time", minValue)
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(salesSchema.columns.length)(tableSchema1.columns.size)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time <'${minValue}'",
      0
    )
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time > '${maxValue}'",
      0
    )
  }

  test("run pipeline RootOperator -> GetOperation with incremental date time value using empty value") {

    /**
      * RootOperator -> GetOperation
      */
    val salesSchema = orderTable.copy(
      name = "sales_schema_date_time_empty",
      columns = Seq(
        DateTimeColumn("created_date_time", "created_date_time"),
        DoubleColumn("profit", "profit")
      )
    )
    generateAndInsertData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(
      1,
      salesSchema,
      DestTableConfig("sales_schema_incremental_date_time_empty", "ETL Database", "Get Customer")
    )
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(
      getOperator1.destTableConfiguration,
      IncrementalConfig("created_date_time", minValue)
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .setConfig(config)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    println(s"pipelineResult:: ${pipelineResult}")
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(2)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(salesSchema.columns.length)(tableSchema1.columns.size)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(
      pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config
        .getIncrementalConfig(getOperator1.destTableConfiguration)
        .get
        .columnName
    )
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(
      s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time >  '${maxValue}'",
      0
    )
  }
}
