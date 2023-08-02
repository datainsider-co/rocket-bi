package co.datainsider.datacook.operator

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.bi.domain.query.Limit
import co.datainsider.bi.engine.mysql.MysqlConnection
import co.datainsider.bi.util.ZConfig
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.domain.persist.PersistentType
import co.datainsider.datacook.engine.{AbstractOperatorTest, ClickhouseIntegrateTest}
import co.datainsider.datacook.pipeline.operator.persist.writer.MySQLWriter
import co.datainsider.datacook.pipeline.operator.persist.{JdbcPersistOperatorExecutor, JdbcPersistResult, MySQLPersistOperator}
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl, Pipeline, PipelineResult}

/**
  * @author tvc12 - Thien Vi
  * @created 10/08/2021 - 9:28 PM
  */
class MySQLOperatorTest extends AbstractOperatorTest with ClickhouseIntegrateTest {
  override protected val jobId: EtlJobId = 1443
  implicit val resolver: ExecutorResolver = new ExecutorResolverImpl()
    .register(RootOperatorExecutor())
    .register(GetOperatorExecutor(client, operatorService, Some(Limit(0, 500))))
    .register(classOf[MySQLPersistOperator], JdbcPersistOperatorExecutor(client))
    .register(SQLOperatorExecutor(operatorService))

  private val mysqlSource: MysqlConnection = injector.instance[MysqlConnection]
  private val host: String = mysqlSource.host
  private val port: Int = mysqlSource.port
  private val username: String = mysqlSource.username
  private val password: String = mysqlSource.password
  private val dbname: String = ZConfig.getString("data_cook.jdbc_test.mysql.dbname")

  private val existedTable = "ORDER_TEST"
  private val tableNotExistsTable = "ORDER_TABLE"

  private def dropTable(dbname: String, tableName: String): Unit = {
    val operator = MySQLPersistOperator(1, mysqlSource.host, mysqlSource.port, mysqlSource.username, mysqlSource.password, dbname, tableName, PersistentType.Append)
    val client = NativeJDbcClient(operator.jdbcUrl, operator.username, operator.password)
    val writer = new MySQLWriter(client)
    if (writer.isTableExisted(dbname, tableName)) {
      writer.dropTable(dbname, tableName)
    }
  }

  override def beforeAll(): Unit = {
    super.beforeAll();
    dropTable(dbname, tableNotExistsTable)
  }

  def countRow(client: JdbcClient, databaseName: String, tableName: String): Long = {
    client.executeQuery(s"""
         |SELECT count(*) as n_row
         |FROM `${databaseName}`.`${tableName}`
         |""".stripMargin)(rs => {
      if (rs.next()) {
        rs.getLong("n_row")
      } else {
        0
      }
    })
  }

  private def getTotalRows(operator: MySQLPersistOperator): Long = {
    val client = NativeJDbcClient(operator.jdbcUrl, operator.username, operator.password)
    countRow(client, operator.databaseName, operator.tableName)
  }

  test("Persist Append with table existed") {
    // Root -> GetOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_1", "ETL", "ETL"))
    val saveOperator =
      MySQLPersistOperator(2, host, port, username, password, dbname, existedTable, PersistentType.Append)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()
    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow >= 500)(true)
  }

  test("Persist Append with table not existed") {
    // Root -> GetOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_2", "ETL", "ETL"))
    val saveOperator =
      MySQLPersistOperator(2, host, port, username, password, dbname, tableNotExistsTable, PersistentType.Append)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with table existed") {
    // Root -> GetOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_3", "ETL", "ETL"))
    val saveOperator = MySQLPersistOperator(
      2,
      host,
      port,
      username,
      password,
      dbname,
      existedTable,
      PersistentType.Replace,
      Some("""{"serverTimezone": "Asia/Ho_Chi_Minh"}""")
    )

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
  }

  test("Persist Override with table not existed") {
    // Root -> GetOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_4", "ETL", "ETL"))
    val saveOperator =
      MySQLPersistOperator(2, host, port, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with string column") {

    // Root -> GetOperator -> SQLOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_5", "ETL", "ETL"))
    val sqlOperator = SQLOperator(
      2,
      s"""SELECT
         | toString(id) as ID,
         | toString(customer_id) as NAME
         |FROM `${dbName}`.`${getOperator.destTableConfiguration.tblName}`
         | """.stripMargin,
      DestTableConfig("persist_5_1", "ETL", "ETL")
    )
    val saveOperator =
      MySQLPersistOperator(3, host, port, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sqlOperator)
      .add(sqlOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with int, uint column") {
    // Root -> GetOperator -> SQLOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_6", "ETL", "ETL"))
    val sqlOperator = SQLOperator(
      2,
      s"""
         |select
         | toInt8(id) as ID8,
         | toInt16(id) as ID16,
         | toInt32(id) as ID32,
         | toInt64(id) as ID64,
         | toUInt8(id) as ID_U8,
         | toUInt16(id) as ID_U16,
         | toUInt32(id) as ID_U32,
         | toUInt64(id) as ID_U64,
         | toInt8OrNull(toString(id)) as ID8_OR_NULL,
         | toInt16OrNull(toString(id)) as ID16_OR_NULL,
         | toInt32OrNull(toString(id)) as ID32_OR_NULL,
         | toInt64OrNull(toString(id)) as ID64_OR_NULL,
         | toUInt8OrNull(toString(id)) as ID_U8_OR_NULL,
         | toUInt16OrNull(toString(id)) as ID_U16_OR_NULL,
         | toUInt32OrNull(toString(id)) as ID_U32_OR_NULL,
         | toUInt64OrNull(toString(id)) as ID_U64_OR_NULL,
         | toString(customer_id) as NAME
         |from ${dbName}.`${getOperator.destTableConfiguration.tblName}`
         |""".stripMargin,
      DestTableConfig("persist_6_1", "ETL", "ETL")
    )
    val saveOperator =
      MySQLPersistOperator(3, host, port, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sqlOperator)
      .add(sqlOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with double, float column") {

    // Root -> GetOperator -> SQLOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_7", "ETL", "ETL"))
    val sqlOperator = SQLOperator(
      2,
      s"""
         |select
         | toFloat32(profit) as profit,
         | toFloat64(profit) as profit64,
         | toFloat32OrNull(toString(profit)) as "profit or null",
         | toFloat64OrNull(toString(profit)) as "profit64 or null",
         | toString(customer_id) as NAME
         |from ${dbName}.`${getOperator.destTableConfiguration.tblName}`
         |""".stripMargin,
      DestTableConfig("persist_7_1", "ETL", "ETL")
    )
    val saveOperator =
      MySQLPersistOperator(3, host, port, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sqlOperator)
      .add(sqlOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with date column") {

    // Root -> GetOperator -> SQLOperator -> MySQLPersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderTable, DestTableConfig("persist_8", "ETL", "ETL"))
    val sqlOperator = SQLOperator(
      2,
      s"""
         |select
         | toDate(order_date) as `Order Date`,
         | toDateOrNull(toString(id)) as `Id as Date`,
         | toDateTime(1645633081) as `Current Date`,
         | toDateTime64(1645633081, 3) as `Current Date 64`,
         | toDateTimeOrNull(toString(order_date)) as `Order Date Time`,
         | toDateTime64OrNull(toString(order_date)) as `Order Date Time 64`,
         | toString(customer_id) as NAME
         |from ${getDbName(orgId, jobId)}.`${getOperator.destTableConfiguration.tblName}`
         |""".stripMargin,
      DestTableConfig("persist_8_1", "ETL", "ETL")
    )
    val saveOperator =
      MySQLPersistOperator(3, host, port, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, sqlOperator)
      .add(sqlOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JdbcPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JdbcPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }
}
