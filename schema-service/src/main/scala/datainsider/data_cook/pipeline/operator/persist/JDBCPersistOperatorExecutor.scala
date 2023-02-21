package datainsider.data_cook.pipeline.operator.persist
import com.twitter.util.logging.Logging
import datainsider.client.util.{JdbcClient, NativeJdbcClientWithProperties}
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.data_cook.domain.persist.PersistentType
import datainsider.data_cook.pipeline.exception.{InputInvalid, UnsupportedJDBCWriterException}
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.pipeline.operator.persist.writer._
import datainsider.data_cook.pipeline.operator.{Executor, ExecutorContext, OperatorResult}
import datainsider.data_cook.repository.DwhRepository
import datainsider.ingestion.domain.TableSchema
import datainsider.profiler.Profiler

import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global

case class PersistResult(
    totalRows: Long,
    insertedRows: Long
)

case class JDBCPersistOperatorExecutor(dwhRepository: DwhRepository, chunkSize: Int)
    extends Executor[JDBCPersistOperator]
    with Logging {

  @throws[InputInvalid]
  @throws[UnsupportedJDBCWriterException]
  override def process(operator: JDBCPersistOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

    ensureInput(operator, context.mapResults)
    val sourceTable: TableSchema = context.mapResults(operator.parentIds.head).getData[TableSchema]().get
    val destTable: TableSchema = sourceTable.copy(
      name = operator.tableName,
      dbName = operator.databaseName
    )

    val persistResult: PersistResult = operator.persistType match {
      case PersistentType.Replace => replaceData(context.orgId, sourceTable, destTable, operator)
      case PersistentType.Append  => appendData(context.orgId, sourceTable, destTable, operator)
    }

    JDBCPersistResult(operator.id, persistResult.insertedRows, persistResult.totalRows)

  }

  @throws[InputInvalid]
  private def ensureInput(
      operator: JDBCPersistOperator,
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for jdbc persist operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing previous result of jdbc persist operator")
    }
  }

  private def handleWriteData(
      organizationId: OrganizationId,
      writer: JDBCWriter,
      fromTable: TableSchema,
      destTable: TableSchema
  ): PersistResult = {
    var insertedRows = 0
    val totalRows = dwhRepository.read(
      fromTable,
      chunkSize,
      resultFn = (records) => {
        insertedRows += writer.write(destTable.dbName, destTable.name, destTable.columns, records)
      }
    )
    PersistResult(totalRows, insertedRows)
  }

  def appendData(
      organizationId: OrganizationId,
      fromTable: TableSchema,
      destTable: TableSchema,
      persistConfiguration: JDBCPersistOperator
  ): PersistResult = {
    val writer: JDBCWriter = getWriter(persistConfiguration)
    writer.ensureTableCreated(destTable)
    handleWriteData(organizationId, writer, fromTable, destTable)
  }

  def replaceData(
      organizationId: OrganizationId,
      sourceTable: TableSchema,
      destTable: TableSchema,
      operator: JDBCPersistOperator
  ): PersistResult = {
    val writer: JDBCWriter = getWriter(operator)
    if (writer.isTableExisted(destTable.dbName, destTable.name)) {
      writer.dropTable(destTable.dbName, destTable.name)
    }
    writer.ensureTableCreated(destTable)
    handleWriteData(organizationId, writer, sourceTable, destTable)
  }

  @throws[UnsupportedJDBCWriterException]
  private def getWriter(operator: JDBCPersistOperator): JDBCWriter = {
    val client: JdbcClient = NativeJdbcClientWithProperties(operator.jdbcUrl, operator.properties)
    operator match {
      case _: OraclePersistOperator          => new OracleWriter(client)
      case _: MySQLPersistOperator           => new MySQLWriter(client)
      case _: MsSQLPersistOperator           => new MsSQLWriter(client)
      case operator: PostgresPersistOperator => new PostgresWriter(client, operator.catalogName, operator.username)
      case _: VerticaPersistOperator         => new VerticaWriter(client)
      case _                                 => throw UnsupportedJDBCWriterException(s"Unsupported jdbc writer for ${operator.getClass}")
    }
  }
}

case class TestJDBCPersistOperatorExecutor() extends Executor[JDBCPersistOperator] {

  override def process(operator: JDBCPersistOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

    ensureInput(operator, context.mapResults)
    JDBCPersistResult(operator.id, 0, 0)

  }

  @throws[InputInvalid]
  private def ensureInput(
      operator: JDBCPersistOperator,
      mapResults: mutable.Map[OperatorId, OperatorResult]
  ): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for jdbc persist operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing previous result of jdbc persist operator")
    }
  }

}
