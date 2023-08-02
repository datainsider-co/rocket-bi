package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.client.BigQueryClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.BigQueryConnection
import co.datainsider.bi.engine._
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.repository.FileStorage
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.datacook.pipeline.ExecutorResolver
import co.datainsider.datacook.pipeline.operator.OperatorService
import co.datainsider.jobworker.repository.writer.{DataWriter, LocalFileWriterConfig}
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.schema.repository.{DDLExecutor, DataRepository}
import com.google.auth.oauth2.ServiceAccountCredentials
import com.google.cloud.bigquery.{BigQuery, BigQueryOptions, FieldValueList, TableResult}
import com.twitter.inject.{Injector, Logging}
import com.twitter.util.Future
import datainsider.client.domain.Implicits.async
import datainsider.client.exception.{DbExecuteError, InternalError}
import org.nutz.lang.stream.StringInputStream

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.iterableAsScalaIterableConverter

class BigQueryEngine(clientManager: ClientManager, maxQueryRows: Int = 10000, defaultTimeoutMs: Int = 30000)
    extends Engine[BigQueryConnection]
    with Logging {

  private val dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")

  def createClient(source: BigQueryConnection): BigQueryClient = {
    val client: BigQuery = Using(new StringInputStream(source.credentials))(credentialStream => {
      val credentials = ServiceAccountCredentials.fromStream(credentialStream)
      BigQueryOptions
        .newBuilder()
        .setCredentials(credentials)
        .setProjectId(source.projectId)
        .setLocation(source.location.orNull)
        .build()
        .getService
    })
    new BigQueryClient(client, maxQueryRows, defaultTimeoutMs)
  }

  private def getClient(source: BigQueryConnection): BigQueryClient =
    clientManager.get(source)(() => createClient(source))

  override def execute(source: BigQueryConnection, sql: String, doFormatValues: Boolean): Future[DataTable] =
    async {
      getClient(source)
        .query(sql)(tableResult => {
          val columns: Seq[Column] = BigQueryUtils.parseColumns(tableResult.getSchema)
          val rows = ArrayBuffer[Array[Object]]()

          tableResult
            .iterateAll()
            .forEach(fieldValueList => {
              val row = toRecord(columns, fieldValueList).map(_.asInstanceOf[Object])
              rows += row
            })

          DataTable(columns.map(_.name).toArray, columns.map(_.getClass.getSimpleName).toArray, rows.toArray)
        })
    }

  override def executeHistogramQuery(source: BigQueryConnection, histogramSql: String): Future[DataTable] = {
    execute(source, histogramSql)
  }

  override def getDDLExecutor(source: BigQueryConnection): DDLExecutor = {
    val client: BigQueryClient = getClient(source)
    new BigQueryDDLExecutor(client)
  }

  override def exportToFile(
      source: BigQueryConnection,
      sql: String,
      destPath: String,
      fileType: FileType
  ): Future[String] =
    async {
      val stream: DataStream = getClient(source).query(sql)(toStream)

      FileStorage.exportToFile(stream, fileType, destPath)
    }

  override def testConnection(source: BigQueryConnection): Future[Boolean] =
    Future {
      try {
        Using(createClient(source)) {
         client: BigQueryClient => {
           val connTimeoutMs = 30000L
           client.query("select 1", Some(connTimeoutMs))((tableResult: TableResult) => {
             tableResult.iterateAll().asScala.head.get(0).getLongValue.equals(1L)
           })
         }
        }
      } catch {
        case ex: Throwable => throw InternalError(s"unable to connect to bigquery, cause ${ex.getMessage}")
      }
    }

  override def getSqlParser(): SqlParser = BigQueryParser

  override def detectExpressionColumn(
      source: BigQueryConnection,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] = {
    val query =
      s"""
         |select $newExpr
         |from $dbName.$tblName
         |where 1 != 1
         |""".stripMargin

    for {
      ddlExecutor: DDLExecutor <- getDDLExecutor(source)
      columns: Seq[Column] <- ddlExecutor.detectColumns(query)
    } yield columns.headOption match {
      case Some(column) => column
      case None         => throw DbExecuteError(s"fail to detect column for expression: $newExpr")
    }
  }

  override def detectAggregateExpressionColumn(
      source: BigQueryConnection,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[Column] = {
    val mainExpression: String = if (ExpressionUtils.isApplyAllExpr(newExpr)) {
      ExpressionUtils.getMainExpression(newExpr)
    } else newExpr

    val query =
      s"""
         |select 'dummy_col' c1, $mainExpression
         |from (
         |  select *
         |  from $dbName.$tblName
         |  where 1 != 1
         |)
         |group by c1
         |""".stripMargin

    for {
      ddlExecutor: DDLExecutor <- getDDLExecutor(source)
      columns: Seq[Column] <- ddlExecutor.detectColumns(query)
    } yield columns.lift(1) match {
      case Some(column) => column
      case None         => throw DbExecuteError(s"fail to detect column for aggregate expression: $newExpr")
    }

  }

  override def createWriter(source: BigQueryConnection): DataWriter = {
    val client: BigQueryClient = getClient(source)
    val sleepIntervalMs: Int = ZConfig.getInt("jobworker.sleep_interval_ms", 10000)
    val writerConfig = new LocalFileWriterConfig(
      baseDir = ZConfig.getString("bigquery_engine.local_file_writer.base_dir", "./tmp/clickhouse"),
      fileExtension = ZConfig.getString("bigquery_engine.local_file_writer.file_extension", "json"),
      maxFileSizeInBytes = ZConfig.getBytes("bigquery_engine.local_file_writer.max_file_size")
    )
    new BigqueryWriter(client, writerConfig, sleepIntervalMs)
  }

  override def getPreviewExecutorResolver(source: BigQueryConnection, operatorService: OperatorService)(
      injector: Injector
  ): ExecutorResolver = ???

  override def getExecutorResolver(source: BigQueryConnection, operatorService: OperatorService)(
      injector: Injector
  ): ExecutorResolver = ???

  override def getDataRepository(source: BigQueryConnection): DataRepository = ???

  override def write(source: BigQueryConnection, schema: TableSchema, records: Seq[Record]): Future[Int] =
    Future {
      val client: BigQueryClient = getClient(source)
      client.write(schema, records).toInt
    }

  private def toStream(tableResult: TableResult): DataStream = {
    val columns: Seq[Column] = BigQueryUtils.parseColumns(tableResult.getSchema)
    val it: util.Iterator[FieldValueList] = tableResult.iterateAll().iterator()

    val stream = new Iterator[Record] {
      override def hasNext: Boolean = it.hasNext

      override def next(): Record = {
        val fieldValueList: FieldValueList = it.next()
        toRecord(columns, fieldValueList)
      }
    }

    DataStream(columns, stream)
  }

  private def toRecord(columns: Seq[Column], fieldValueList: FieldValueList): Record = {
    columns
      .map(col => {
        try {
          col match {
            case c: BoolColumn     => fieldValueList.get(col.name).getStringValue.toBoolean
            case c: Int32Column    => fieldValueList.get(col.name).getStringValue.toInt
            case c: Int64Column    => fieldValueList.get(col.name).getLongValue
            case c: DoubleColumn   => fieldValueList.get(col.name).getDoubleValue
            case c: DateColumn     => parseDateTime(fieldValueList.get(col.name).getStringValue)
            case c: DateTimeColumn => parseDateTime(fieldValueList.get(col.name).getStringValue)
            case _                 => fieldValueList.get(col.name).getStringValue
          }
        } catch {
          case e: Throwable => null
        }
      })
      .toArray
  }

  private def parseDateTime(dateStr: String): Timestamp = {
    try {
      val time: Long = dateFormat.parse(dateStr).getTime
      new Timestamp(time)
    } catch {
      case e: Throwable => null
    }
  }

}
