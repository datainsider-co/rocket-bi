package datainsider.data_cook.operator

import com.twitter.util.logging.Logging
import datainsider.client.util.{NativeJdbcClient, ZConfig}
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.domain.persist.PersistentType
import datainsider.data_cook.engine.OperatorTest
import datainsider.data_cook.pipeline.operator.persist.writer.{MySQLWriter, OracleWriter}
import datainsider.data_cook.pipeline.operator.persist.{JDBCPersistResult, OraclePersistOperator}
import datainsider.data_cook.pipeline.operator.{GetOperator, RootOperator, SQLOperator}
import datainsider.data_cook.pipeline.{ExecutorResolver, Pipeline, PipelineResult}
import datainsider.data_cook.service.table.EtlTableService.getDbName

/**
 * @author tvc12 - Thien Vi
 * @created 10/08/2021 - 9:28 PM
 */
class OracleOperatorTest extends OperatorTest with Logging {
  override protected val jobId: EtlJobId = 1442
  implicit val executorResolver: ExecutorResolver = injector.instance[ExecutorResolver]

  private val host: String = ZConfig.getString("data_cook.jdbc_test.oracle.host")
  private val port: Int = ZConfig.getInt("data_cook.jdbc_test.oracle.port")
  private val serviceName: String = ZConfig.getString("data_cook.jdbc_test.oracle.service_name")
  private val username: String = ZConfig.getString("data_cook.jdbc_test.oracle.username")
  private val password: String = ZConfig.getString("data_cook.jdbc_test.oracle.password")
  private val dbname: String = ZConfig.getString("data_cook.jdbc_test.oracle.dbname")
  private val destGetTableConfig = TableConfiguration("order_schema_sql_1234", "ETL Database", "Get Customer 100");

  private val existedTable = "order_test"
  private val tableNotExistsTable = "ORDER_TABLE"

  private def dropTable(dbname: String, tableName: String): Unit = {
    val operator = OraclePersistOperator(1, host, port, serviceName, username, password, dbname, tableName, PersistentType.Append)
    val client = NativeJdbcClient(operator.jdbcUrl, operator.username, operator.password)
    val writer = new OracleWriter(client)
    if (writer.isTableExisted(dbname, tableName)) {
      writer.dropTable(dbname, tableName)
    }
  }

  override def beforeAll(): Unit = {
    super.beforeAll();
    dropTable(dbname, tableNotExistsTable)
  }

  def countRow(client: NativeJdbcClient, databaseName: String, tableName: String): Long = {
    client.executeQuery(
      s"""
         |SELECT count(*) as n_row
         |FROM "${databaseName}"."${tableName}"
         |""".stripMargin)(rs => {
      if (rs.next()) {
        rs.getLong("n_row")
      } else {
        0
      }
    })
  }

  private def getTotalRows(operator: OraclePersistOperator): Long = {
    val client = NativeJdbcClient(operator.jdbcUrl, operator.username, operator.password)
    countRow(client, operator.databaseName, operator.tableName)
  }

  test("Persist Append with table existed") {
    // Root -> GetOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_1", "ETL", "ETL"))
    val saveOperator = OraclePersistOperator(2, host, port, serviceName, username, password, dbname, existedTable, PersistentType.Append)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow >= 500)(true)
  }

  test("Persist Append with table not existed") {
    // Root -> GetOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_2", "ETL", "ETL"))
    val saveOperator = OraclePersistOperator(2, host, port, serviceName, username, password, dbname, tableNotExistsTable, PersistentType.Append)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with table existed") {
    // Root -> GetOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_3", "ETL", "ETL"))
    val saveOperator = OraclePersistOperator(2, host, port, serviceName, username, password, dbname, existedTable, PersistentType.Replace)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
  }

  test("Persist Override with table not existed") {
    // Root -> GetOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_3", "ETL", "ETL"))
    val saveOperator = OraclePersistOperator(2, host, port, serviceName, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

    val pipeline = Pipeline
      .builder()
      .setJobId(jobId)
      .setOrganizationId(orgId)
      .add(rootOperator, getOperator)
      .add(getOperator, saveOperator)
      .build()
    val result: PipelineResult = pipeline.execute()

    assertResult(true)(result.isSucceed)
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with string column") {

    // Root -> GetOperator -> SQLOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_4", "ETL", "ETL"))
    val sqlOperator = SQLOperator(
      2,
      s"""select
         | toString(id) as ID,
         | toString(customer_id) as NAME
         |from ${dbName}.persist_4
         | """.stripMargin,
      TableConfiguration("persist_4_1", "ETL", "ETL")
    )
    val saveOperator = OraclePersistOperator(3, host, port, serviceName, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

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
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with int, uint column") {
    // Root -> GetOperator -> SQLOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_5", "ETL", "ETL"))
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
         |from ${dbName}.`persist_5`
         |""".stripMargin,
      TableConfiguration("persist_5_1", "ETL", "ETL")
    )
    val saveOperator = OraclePersistOperator(3, host, port,serviceName,  username, password, dbname, tableNotExistsTable, PersistentType.Replace)

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
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with double, float column") {

    // Root -> GetOperator -> SQLOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_6", "ETL", "ETL"))
    val sqlOperator = SQLOperator(
      2,
      s"""
         |select
         | toFloat32(profit) as profit,
         | toFloat64(profit) as profit64,
         | toFloat32OrNull(toString(profit)) as "profit or null",
         | toFloat64OrNull(toString(profit)) as "profit64 or null",
         | toString(customer_id) as NAME
         |from ${dbName}.`persist_6`
         |""".stripMargin,
      TableConfiguration("persist_6_1", "ETL", "ETL")
    )
    val saveOperator = OraclePersistOperator(3, host, port, serviceName, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

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
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }

  test("Persist Override with date column") {

    // Root -> GetOperator -> SQLOperator -> OraclePersistOperator
    val rootOperator = RootOperator(0)
    val getOperator = GetOperator(1, orderSchema, TableConfiguration("persist_7", "ETL", "ETL"))
    val sqlOperator = SQLOperator(
      2,
      s"""
         |select
         | toDate(order_date) as `Order Date`,
         | toDateOrNull(id) as `Id as Date`,
         | toDateTime(1645633081) as `Current Date`,
         | toDateTime64(1645633081, 3) as `Current Date 64`,
         | toDateTimeOrNull(order_date) as `Order Date Time`,
         | toDateTime64OrNull(order_date) as `Order Date Time 64`,
         | toString(customer_id) as NAME
         |from ${getDbName(orgId, jobId)}.`persist_7`
         |""".stripMargin,
      TableConfiguration("persist_7_1", "ETL", "ETL")
    )
    val saveOperator = OraclePersistOperator(3, host, port, serviceName, username, password, dbname, tableNotExistsTable, PersistentType.Replace)

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
    val persistResult: JDBCPersistResult = result.mapResult(saveOperator.id).asInstanceOf[JDBCPersistResult]
    assertResult(true)(persistResult != null)

    assertResult(persistResult.totalRows)(500)
    assertResult(persistResult.errorRows)(0)
    val totalRow = getTotalRows(saveOperator)
    assertResult(totalRow == 500)(true)
    dropTable(dbname, tableNotExistsTable)
  }
}
