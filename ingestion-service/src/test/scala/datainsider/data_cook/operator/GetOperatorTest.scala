package datainsider.data_cook.operator

import datainsider.data_cook.domain.{EtlConfig, IncrementalConfig}
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator.{GetOperator, RootOperator}
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.service.table.EtlTableService.getDbName
import datainsider.ingestion.domain.{DateColumn, DateTimeColumn, DoubleColumn, Int64Column, StringColumn, TableSchema}

/**
  * @author tvc12 - Thien Vi
  * @created 09/25/2021 - 2:49 PM
  */
class GetOperatorTest extends OperatorTest {
  override protected val jobId: EtlJobId = 1200
  implicit val resolver: ExecutorResolver = injector.instance[ExecutorResolver]

  test("run pipeline RootOperator -> GetOperation") {
    val rootOperator = RootOperator(0)
    val destTableConfig = TableConfiguration("customer_testing", "ETL Database", "Get Customer")
    val getOperator = GetOperator(1, customerSchema, destTableConfig)

    val pipeline = Pipeline.builder()
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
    assertResult(customerSchema.columns.length)(tableSchema.columns.size)
    assertTableSize(schema = tableSchema, expectedTotal = 500)
  }

  test("run complex pipeline RootOperator -> GetOperation") {
    /**
     * RootOperator -> GetOperation
     *              \
     *               -> GetOperation
     */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, orderSchema, TableConfiguration("table_1", "ETL Database", "Get Customer"))
    val getOperator2 = GetOperator(2, customerSchema, TableConfiguration("table_2", "ETL Database", "Get Customer"))

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator1)
      .add(rootOperator, getOperator2)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(pipelineResult.isSucceed)(true)
    assertResult(pipelineResult.mapResult.size)(3)

    val tableSchema1: TableSchema = pipelineResult.mapResult(getOperator1.id).getData[TableSchema]().get
    assertResult(orderSchema.columns.length)(tableSchema1.columns.size)
    assertTableSize(tableSchema1, expectedTotal = 500)

    val tableSchema2: TableSchema = pipelineResult.mapResult(getOperator2.id).getData[TableSchema]().get
    assertResult(customerSchema.columns.length)(tableSchema2.columns.size)
    assertTableSize(tableSchema2, expectedTotal = 500)

  }

  test("run exception pipeline RootOperator -> GetOperation") {
    val rootOperator = RootOperator(0)
    val destTableConfig = TableConfiguration("new_testing", "ETL Database", "Get Customer")
    val getOperator = GetOperator(1, customerSchema.copy("db_name"), destTableConfig)

    val pipeline = Pipeline.builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .build()

    val pipelineResult: PipelineResult = pipeline.execute()
    assertResult(pipelineResult.isSucceed)(false)
    assertResult(pipelineResult.exception.isDefined)(true)
    assertResult(pipelineResult.operatorError)(Option(getOperator))
  }

  test("run pipeline RootOperator -> GetOperation with incremental string value") {
    /**
     * RootOperator -> GetOperation
     */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, orderSchema, TableConfiguration("table_string_value", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "800"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline.builder()
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
    assertResult(orderSchema.columns.length)(tableSchema1.columns.size)
    assertTableSize(tableSchema1, expectedTotal = 219)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value == "999")
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id <= '${minValue}'", 0)
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id > '${maxValue}'", 0)

  }

  test("run pipeline RootOperator -> GetOperation with incremental empty string value") {
    /**
     * RootOperator -> GetOperation
     */
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, orderSchema, TableConfiguration("table_empty_string", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline.builder()
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
    assertResult(orderSchema.columns.length)(tableSchema1.columns.size)
    assertTableSize(tableSchema1, expectedTotal = 500)

    assert(pipelineResult.config.nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).nonEmpty)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value == "999")
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id <='${minValue}'", 0)
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id >  '${maxValue}'", 0)

  }

  test("run pipeline RootOperator -> GetOperation with incremental number value") {
    /**
     * RootOperator -> GetOperation
     */
    val salesSchema = orderSchema.copy(
      name = "sales_schema_number",
      columns = Seq(
        Int64Column("id", "id"),
        DoubleColumn("profit", "profit")
      )
    )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_number_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "100"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline.builder()
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
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id <='${minValue}'", 0)
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id >  '${maxValue}'", 0)
  }

  test("run pipeline RootOperator -> GetOperation with incremental number value input incorrect format") {
    /**
     * RootOperator -> GetOperation
     */
    val salesSchema = orderSchema.copy(
      name = "sales_schema_number_incorrect_format",
      columns = Seq(
        Int64Column("id", "id"),
        DoubleColumn("profit", "profit")
      )
    )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_number_incorrect_format_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "tvc12"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline.builder()
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
    val salesSchema = orderSchema.copy(
      name = "sales_schema_number_empty",
      columns = Seq(
        Int64Column("id", "id"),
        StringColumn("profit", "profit")
      )
    )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_number_empty_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("id", minValue))

    val pipeline = Pipeline.builder()
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
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where id >  '${maxValue}'", 0)
  }

  test("run pipeline RootOperator -> GetOperation with incremental date value") {
    /**
     * RootOperator -> GetOperation
     */
      val salesSchema = orderSchema.copy(
        name = "sales_schema_date",
        columns = Seq(
          DateColumn("created_date", "created_date"),
          DoubleColumn("profit", "profit")
        )
      )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_incremental_date", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "2022-12-12"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date", minValue))

    val pipeline = Pipeline.builder()
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
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date <='${minValue}'", 0)
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date >  '${maxValue}'", 0)
  }

  test("run pipeline RootOperator -> GetOperation with incremental date value incorrect format") {
    /**
     * RootOperator -> GetOperation
     */
      val salesSchema = orderSchema.copy(
        name = "sales_schema_date_incorrect_format",
        columns = Seq(
          DateColumn("created_date", "created_date"),
          DoubleColumn("profit", "profit")
        )
      )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_date_incorrect_format_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "tvx213213"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date", minValue))

    val pipeline = Pipeline.builder()
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
      val salesSchema = orderSchema.copy(
        name = "sales_schema_date_empty",
        columns = Seq(
          DateColumn("created_date", "created_date"),
          StringColumn("profit", "profit")
        )
      )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_date_empty_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date", minValue))

    val pipeline = Pipeline.builder()
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
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date >  '${maxValue}'", 0)
  }

  test("run pipeline RootOperator -> GetOperation with incremental date time value") {
    /**
     * RootOperator -> GetOperation
     */
      val salesSchema = orderSchema.copy(
        name = "sales_schema_date_time",
        columns = Seq(
          DateTimeColumn("created_date_time", "created_date_time"),
          DoubleColumn("profit", "profit")
        )
      )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_incremental_date_time", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "2022-12-12 12:12:12"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date_time", minValue))

    val pipeline = Pipeline.builder()
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
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time <='${minValue}'", 0)
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time >  '${maxValue}'", 0)
  }

  test("run pipeline RootOperator -> GetOperation with incremental date time value incorrect format") {
    /**
     * RootOperator -> GetOperation
     */
      val salesSchema = orderSchema.copy(
        name = "sales_schema_date_time_incorrect_format",
        columns = Seq(
          DateTimeColumn("created_date_time", "created_date_time"),
          DoubleColumn("profit", "profit")
        )
      )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_date_time_incorrect_format_1", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "sdasdasczxcsadasd"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date_time", minValue))

    val pipeline = Pipeline.builder()
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
      val salesSchema = orderSchema.copy(
        name = "sales_schema_date_time",
        columns = Seq(
          DateTimeColumn("created_date_time", "created_date_time"),
          DoubleColumn("profit", "profit")
        )
      )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_date", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = "2022-12-12"
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date_time", minValue))

    val pipeline = Pipeline.builder()
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
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time <='${minValue}'", 0)
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time >  '${maxValue}'", 0)
  }

  test("run pipeline RootOperator -> GetOperation with incremental date time value using empty value") {
    /**
     * RootOperator -> GetOperation
     */
      val salesSchema = orderSchema.copy(
        name = "sales_schema_date_time_empty",
        columns = Seq(
          DateTimeColumn("created_date_time", "created_date_time"),
          DoubleColumn("profit", "profit")
        )
      )
    initData(salesSchema, 1000)
    val rootOperator = RootOperator(0)
    val getOperator1 = GetOperator(1, salesSchema, TableConfiguration("sales_schema_incremental_date_time_empty", "ETL Database", "Get Customer"))
    val config = EtlConfig()
    val minValue = ""
    config.updateIncrementalConfig(getOperator1.destTableConfiguration, IncrementalConfig("created_date_time", minValue))

    val pipeline = Pipeline.builder()
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
    assert(pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName == config.getIncrementalConfig(getOperator1.destTableConfiguration).get.columnName)
    val maxValue: String = pipelineResult.config.get.getIncrementalConfig(getOperator1.destTableConfiguration).get.value
    assertQueryCount(s"select count(*) from `${tableSchema1.dbName}`.`${tableSchema1.name}` where created_date_time >  '${maxValue}'", 0)
  }



}
