package co.datainsider.datacook.pipeline.operator.persist

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.client.{JdbcClient, NativeJdbcClientWithProperties}
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.query.{ObjectQueryBuilder, QueryParserImpl, Select, TableField}
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.engine.{DataStream, Engine}
import co.datainsider.bi.service.ConnectionService
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.datacook.domain.Ids.OrganizationId
import co.datainsider.datacook.domain.persist.PersistentType
import co.datainsider.datacook.pipeline.exception.{InputInvalid, UnsupportedJDBCWriterException}
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.persist.writer._
import co.datainsider.datacook.pipeline.operator.{Executor, ExecutorContext, OperatorResult}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import com.twitter.util.logging.Logging

import java.sql.ResultSet
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

case class JdbcPersistOperatorExecutor(
    engineResolver: EngineResolver,
    connectionService: ConnectionService,
    insertBatchSize: Int = 100000
) extends Executor[JdbcPersistOperator]
    with Logging {

  @throws[InputInvalid]
  @throws[UnsupportedJDBCWriterException]
  override def execute(operator: JdbcPersistOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      val sourceTable: TableSchema = context.mapResults(operator.parentIds.head).getData[TableSchema]().get
      val destTable: TableSchema = sourceTable.copy(
        name = operator.tableName,
        dbName = operator.databaseName
      )

      val persistResult: InsertResult = operator.persistType match {
        case PersistentType.Replace => replaceData(context.orgId, sourceTable, destTable, operator)
        case PersistentType.Append  => appendData(context.orgId, sourceTable, destTable, operator)
      }

      JdbcPersistResult(operator.id, persistResult.insertedRows, persistResult.totalRows)

    }

  @throws[InputInvalid]
  private def ensureInput(
      operator: JdbcPersistOperator,
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
  ): InsertResult = {
    var insertedRows = 0
    val totalRows: Long = getData(
      orgId = organizationId,
      fromTable = fromTable,
      destTable = destTable,
      insertBatchSize = insertBatchSize,
      resultFn = (records) => {
        insertedRows += writer.write(destTable.dbName, destTable.name, destTable.columns, records)
      }
    )
    InsertResult(totalRows, insertedRows)
  }

  private def getData(
      orgId: Long,
      fromTable: TableSchema,
      destTable: TableSchema,
      insertBatchSize: Int,
      resultFn: (Seq[Record]) => Unit
  ): Long = {
    val connection: Connection = connectionService.getTunnelConnection(orgId).syncGet()
    val engine: Engine[Connection] = engineResolver.resolve(connection.getClass).asInstanceOf[Engine[Connection]]
    var totalRows: Long = 0
    val selectQuery: String = parseToQuery(engine, fromTable)
    engine.executeAsDataStream(connection, selectQuery)((dataStream: DataStream) => {
      val destIndexes: Array[Int] = indexedColumns(destTable, dataStream.columns)

      var buffers = ArrayBuffer.empty[Record]
      while (dataStream.stream.hasNext) {
        val record: Record = dataStream.stream.next()
        val newRecord = destIndexes.map(index => record.lift(index).orNull)
        buffers += newRecord
        if (buffers.size > insertBatchSize) {
          resultFn(buffers)
          totalRows += buffers.size
          buffers = ArrayBuffer.empty[Record]
        }
      }
      // empty
      if (buffers.nonEmpty) {
        resultFn(buffers)
        totalRows += buffers.size
      }
    })
    totalRows
  }

  /**
    * indexed destination columns in source table, if not found, return -1
    */
  private def indexedColumns(destTable: TableSchema, fromColumns: Seq[Column]): Array[Int] = {
    val fromColumnIndexMap: Map[String, Int] = fromColumns.map(_.name).zipWithIndex.toMap
    destTable.columns.map(column => fromColumnIndexMap.getOrElse(column.name, -1)).toArray
  }

  private def parseToQuery(engine: Engine[Connection], table: TableSchema): String = {
    val queryParser = new QueryParserImpl(engine.getSqlParser())
    val builder = new ObjectQueryBuilder()
    table.columns.foreach(col => {
      builder.addFunction(
        Select(field =
          new TableField(
            dbName = table.dbName,
            tblName = table.name,
            fieldName = col.name,
            fieldType = col.getColumnType,
          ),
          aliasName = Some(col.name)
        )
      )
    })
    queryParser.parse(builder.build())
  }

  private def appendData(
      organizationId: OrganizationId,
      fromTable: TableSchema,
      destTable: TableSchema,
      persistConfiguration: JdbcPersistOperator
  ): InsertResult = {
    val writer: JDBCWriter = getWriter(persistConfiguration)
    writer.ensureTableCreated(destTable)
    handleWriteData(organizationId, writer, fromTable, destTable)
  }

  private def replaceData(
      organizationId: OrganizationId,
      sourceTable: TableSchema,
      destTable: TableSchema,
      operator: JdbcPersistOperator
  ): InsertResult = {
    val writer: JDBCWriter = getWriter(operator)
    if (writer.isTableExisted(destTable.dbName, destTable.name)) {
      writer.dropTable(destTable.dbName, destTable.name)
    }
    writer.ensureTableCreated(destTable)
    handleWriteData(organizationId, writer, sourceTable, destTable)
  }

  @throws[UnsupportedJDBCWriterException]
  private def getWriter(operator: JdbcPersistOperator): JDBCWriter = {
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

case class InsertResult(
    totalRows: Long,
    insertedRows: Long
)
