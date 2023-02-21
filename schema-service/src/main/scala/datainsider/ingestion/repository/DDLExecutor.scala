package datainsider.ingestion.repository

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.{BadRequestError, DbExecuteError, InternalError}
import datainsider.client.util.{JdbcClient, JsonParser, ZConfig}
import datainsider.ingestion.domain._
import datainsider.ingestion.misc.DDLConverter
import datainsider.ingestion.util.Implicits.async
import datainsider.profiler.Profiler

import java.sql.{BatchUpdateException, ResultSet}
import scala.collection.mutable.ListBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.matching.Regex

/**
  * @author andy
  * @since 7/10/20
  */
trait DDLExecutor {

  def existsDatabaseSchema(dbName: String): Future[Boolean]

  def existTableSchema(dbName: String, tblName: String, colNames: Seq[String] = Seq.empty): Future[Boolean]

  def getDatabases(): Future[Seq[String]]

  def dropDatabase(dbName: String): Future[Boolean]

  def getTables(dbName: String): Future[Seq[String]]

  def dropTable(dbName: String, tblName: String): Future[Boolean]

  def getColumnNames(dbName: String, tblName: String): Future[Set[String]]

  def createDatabase(dbName: String): Future[Boolean]

  def createTable(tableSchema: TableSchema): Future[Boolean]

  def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean]

  def addColumn(dbName: String, tblName: String, column: Column): Future[Boolean]

  def addColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean]

  def updateColumn(dbName: String, tblName: String, columns: Column): Future[Boolean]

  def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean]

  def execute[T](query: String)(converter: ResultSet => T): Future[T]

  /**
    * Optimize table https://clickhouse.com/docs/en/sql-reference/statements/optimize/
    * @param dbName name of db
    * @param table name of table
    * @param primaryKeys primary key for optimize, use all columns if empty
    * @param isUseFinal - optimization is performed even when all the data is already in one part. Also merge is forced even if concurrent merges are performed.
    */
  def optimizeTable(dbName: String, table: String, primaryKeys: Array[String], isUseFinal: Boolean): Future[Boolean]

  def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumnNames: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean]
}

/**
  * all dll statement is affected on the whole cluster
  * clickhouse tables in cluster are organized with following rules:
  *   + shard table are actual table contains data, default name of shard table is: <distributed_table> + "_shard",
  *   shard table are handle automatically by clickhouse, we just need to handle creation part
  *   + distributed table is the main entry point to insert or query data,
  *   distributed is the part where we store in table schema
  */
case class DDLExecutorImpl(
    client: JdbcClient,
    dllConverter: DDLConverter,
    clusterName: String
) extends DDLExecutor
    with Logging {
  val maxRetryTimes: Int = ZConfig.getInt("cluster_ddl.max_retry_times", 60)
  val waitTimeMs: Int = ZConfig.getInt("cluster_ddl.wait_time_ms", 1000)

  override def existsDatabaseSchema(dbName: String): Future[Boolean] =
    async {
      isDbExisted(dbName)
    }

  override def existTableSchema(dbName: String, tblName: String, colNames: Seq[String]): Future[Boolean] =
    async {
      isTblExisted(dbName, tblName, colNames)
    }

  override def getDatabases(): Future[Seq[String]] =
    async {
      try {
        client.executeQuery(s"show databases")(getNames)
      } catch {
        case ex: Throwable =>
          logger.error("getDatabases", ex)
          throw DbExecuteError("Query error")
      }
    }

  override def createDatabase(dbName: String): Future[Boolean] = {
    val createDbSql = s"CREATE DATABASE IF NOT EXISTS `$dbName` ON CLUSTER $clusterName"
    executeUpdateWithRetries(createDbSql)
  }

  override def dropDatabase(dbName: String): Future[Boolean] = {
    val dropQuery = s"DROP DATABASE IF EXISTS $dbName ON CLUSTER $clusterName SYNC"
    executeUpdateWithRetries(dropQuery)
  }

  override def getTables(dbName: String): Future[Seq[String]] =
    async {
      try {
        client.executeQuery(s"show tables from $dbName")(getNames)
      } catch {
        case ex: Throwable =>
          logger.error(s"getTables($dbName)", ex)
          throw DbExecuteError("Query error")
      }
    }

  override def createTable(tableSchema: TableSchema): Future[Boolean] = {
    require(tableSchema.columns.nonEmpty, "can not create table without any column.")

    tableSchema.getTableType match {
      case TableType.View         => createView(tableSchema)
      case TableType.Materialized => createMaterializeView(tableSchema)
      case TableType.Default      => createDistributedMergeTable(tableSchema)
      case TableType.InMemory     => createInMemoryTable(tableSchema)
      case TableType.EtlView      => createEtlView(tableSchema)
      case TableType.Replacing    => createDistributedReplacingTable(tableSchema)
      case _                      => Future.False
    }

  }

  private def createView(tableSchema: TableSchema): Future[Boolean] = {
    val createViewSql: String = dllConverter.toCreateViewDDL(tableSchema, clusterName)
    executeUpdateWithRetries(createViewSql)
  }

  /**
    * create etl only one node, high performance
    */
  private def createEtlView(tableSchema: TableSchema): Future[Boolean] = {
    val createViewSql: String = dllConverter.toCreateEtlViewDDL(tableSchema, clusterName)
    executeUpdateWithRetries(createViewSql)
  }

  private def createInMemoryTable(tableSchema: TableSchema): Future[Boolean] = {
    val createViewSql: String = dllConverter.toCreateInMemoryDDL(tableSchema, clusterName)
    executeUpdateWithRetries(createViewSql)
  }

  private def createMaterializeView(tableSchema: TableSchema): Future[Boolean] = {
    val createMaterializedViewSql = dllConverter.toCreateMaterializedViewDDL(tableSchema, clusterName)
    executeUpdateWithRetries(createMaterializedViewSql)
  }

  private def createDistributedMergeTable(tableSchema: TableSchema): Future[Boolean] = {
    val createShardTblSql = dllConverter.toCreateShardTableDDL(tableSchema, clusterName)
    val createDistributedTblSql = dllConverter.toCreateDistributedTableDDL(tableSchema, clusterName)

    executeUpdateWithRetries(createShardTblSql).flatMap(tblShardCreated => {
      if (tblShardCreated) {
        executeUpdateWithRetries(createDistributedTblSql)
      } else throw BadRequestError("create shard table failed")
    })
  }

  def createDistributedReplacingTable(tableSchema: TableSchema): Future[Boolean] = {
    val createShardTblSql = dllConverter.toCreateShardReplacingTableDDL(tableSchema, clusterName)
    val createDistributedTblSql = dllConverter.toCreateReplacingDistributedTableDDL(tableSchema, clusterName)

    executeUpdateWithRetries(createShardTblSql).flatMap(createShardTableOk => {
      if (createShardTableOk) {
        executeUpdateWithRetries(createDistributedTblSql)
      } else throw BadRequestError(s"create shard table failed, query: $createShardTblSql")
    })
  }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] = {
    val shardTblName: Option[String] = findShardTblName(dbName, tblName)

    if (shardTblName.isDefined) {
      val dropShardTableQuery = s"DROP TABLE IF EXISTS `$dbName`.`${shardTblName.get}` ON CLUSTER $clusterName SYNC"
      executeUpdateWithRetries(dropShardTableQuery)
    }

    val dropTblQuery = s"DROP TABLE IF EXISTS `$dbName`.`$tblName` ON CLUSTER $clusterName SYNC"
    executeUpdateWithRetries(dropTblQuery)
  }

  // rename for table schema only rename distributed table in clickhouse
  // DO NOT renamed shard table because path of distributed table to shard table can not be updated
  override def renameTable(
      dbName: String,
      oldTblName: String,
      newTblName: String
  ): Future[Boolean] = {
    val renameSql = s"RENAME TABLE $dbName.$oldTblName to $dbName.$newTblName ON CLUSTER $clusterName"
    executeUpdateWithRetries(renameSql)
  }

  override def getColumnNames(dbName: String, tblName: String): Future[Set[String]] =
    async {
      client.executeQuery(
        s"""
           |SELECT * FROM system.columns
           |WHERE database=? AND table=?
           |""".stripMargin,
        dbName,
        tblName
      )(readColumnNames)
    }

  override def addColumn(
      dbName: String,
      tblName: String,
      column: Column
  ): Future[Boolean] = {
    val shardTblName = findShardTblName(dbName, tblName)
    if (shardTblName.isDefined) {
      val updateShardColumnSql = dllConverter.toAddColumnDLL(dbName, shardTblName.get, column, clusterName)
      executeUpdateWithRetries(updateShardColumnSql)
    }

    val updateColumnSql = dllConverter.toAddColumnDLL(dbName, tblName, column, clusterName)
    executeUpdateWithRetries(updateColumnSql)
  }

  override def addColumns(
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean] = {
    Future
      .collect(
        flattenNestedColumns(columns)
          .map(column => {
            addColumn(dbName, tblName, column)
          })
      )
      .map(_.forall(_ == true))
  }

  override def execute[T](query: String)(converter: ResultSet => T): Future[T] = {
    async {
      client.executeQuery(query)(converter)
    }
  }

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] = {
    val shardTblName: Option[String] = findShardTblName(dbName, tblName)

    if (shardTblName.isDefined) {
      val deleteShardColQuery = dllConverter.toDeleteColumnDDL(dbName, shardTblName.get, columnName, clusterName)
      executeUpdateWithRetries(deleteShardColQuery)
    }

    val deleteColQuery = dllConverter.toDeleteColumnDDL(dbName, tblName, columnName, clusterName)
    executeUpdateWithRetries(deleteColQuery)
  }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    Profiler(s"[Schema] ${this.getClass.getName}::updateColumn") {
      val shardTblName: Option[String] = findShardTblName(dbName, tblName)

      if (shardTblName.isDefined) {
        val updateShardColQuery = dllConverter.toUpdateColumnDLL(dbName, shardTblName.get, column, clusterName)
        executeUpdateWithRetries(updateShardColQuery)
      }

      val updateColQuery = dllConverter.toUpdateColumnDLL(dbName, tblName, column, clusterName)
      executeUpdateWithRetries(updateColQuery)
    }

  override def optimizeTable(
      dbName: String,
      tableName: String,
      primaryKeys: Array[String],
      isUseFinal: Boolean
  ): Future[Boolean] =
    Future {
      val finalState = if (isUseFinal) "FINAL" else ""
      val columnsDeduplication = if (primaryKeys.nonEmpty) {
        s"BY ${primaryKeys.mkString(", ")}"
      } else {
        ""
      }
      async {
        logger.info(s"optimize table: $dbName.$tableName")
        client.execute(s"""
             |OPTIMIZE TABLE `$dbName`.`$tableName`
             |ON CLUSTER ${clusterName} ${finalState}
             |DEDUPLICATE ${columnsDeduplication}
             |""".stripMargin)
      }.rescue {
        case e: Throwable => logger.error(s"createMaterializeView(${dbName}.${tableName})", e)
      }

      true
    }

  override def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumnNames: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean] =
    Future {
      val encryptMode = ZConfig.getString("db.clickhouse.encryption.mode")
      val privateKey = ZConfig.getString("db.clickhouse.encryption.key")
      val initialVector = ZConfig.getString("db.clickhouse.encryption.iv")

      val insertedColumns: String = destTable.columns.map(_.name).mkString(",")
      val selectedColumns: String = sourceTable.columns
        .map(column => {
          if (encryptedColumnNames.contains(column.name)) {
            s"encrypt('$encryptMode', ${column.name}, unhex('$privateKey'), unhex('$initialVector'))"
          } else if (decryptedColumns.contains(column.name)) {
            s"decrypt('$encryptMode', ${column.name}, unhex('$privateKey'), unhex('$initialVector'))"
          } else {
            column.name
          }
        })
        .mkString(",")

      val query: String =
        s"""
         |insert into `${destTable.dbName}`.`${destTable.name}` ($insertedColumns)
         |select $selectedColumns from `${sourceTable.dbName}`.`${sourceTable.name}`
         |""".stripMargin

      async {
        logger.info(s"${this.getClass.getSimpleName}::migrateDataWithEncryption query: $query")
        client.executeUpdate(query)
      }.rescue {
        case e: Throwable => logger.error(s"migrateDataWithEncryption(${sourceTable.dbName}, ${destTable.name})", e)
      }

      true
    }

  private def findShardTblName(dbName: String, tblName: String): Option[String] = {
    val showCreateTableQuery = s"show create table $dbName.$tblName"
    val createStatement: String = client.executeQuery(showCreateTableQuery)(rs => {
      if (rs.next()) {
        rs.getString(1)
      } else ""
    })

    val engineRegex: Regex = """ENGINE = Distributed\('\w+', '\w+', '(\w+)', .+\)""".r
    engineRegex.findFirstMatchIn(createStatement) match {
      case Some(value) => Some(value.group(1))
      case None        => None
    }
  }

  private def isTblExisted(dbName: String, tblName: String, expectedColumnNames: Seq[String] = Seq.empty): Boolean = {
    try {
      val query: String = s"desc `${dbName}`.`${tblName}`"
      client.executeQuery(query)((rs: ResultSet) => {
        if (expectedColumnNames.nonEmpty) {
          val columnNames = readColumnNames(rs)
          expectedColumnNames.forall(columnNames.contains)
        } else {
          true
        }
      })
    } catch {
      case e: Throwable => {
        // ignore exception
        false
      }
    }
  }

  private def isDbExisted(dbName: String): Boolean = {
    val query = s"show databases like ?"

    try {
      client.executeQuery(query, dbName)(rs => {
        if (rs.next()) {
          rs.getString(1)
          true
        } else false
      })
    } catch {
      case e: Throwable => {
        // ignore exception
        false
      }
    }
  }

  private def flattenNestedColumns(columns: Seq[Column]): Seq[Column] = {
    columns.flatMap {
      case column: NestedColumn =>
        column.nestedColumns.map(childColumn =>
          ArrayColumn(
            name = s"${column.name}.${childColumn.name}",
            displayName = childColumn.displayName,
            column = childColumn
          )
        )
      case column => Seq(column)
    }
  }

  private def getNames(rs: ResultSet): Seq[String] = {
    val nameBuffer = ListBuffer.empty[String]

    while (rs.next()) {
      nameBuffer.append(rs.getString(1))
    }

    nameBuffer
  }

  private def readColumnNames(rs: ResultSet): Set[String] = {
    val nameBuffer = ListBuffer.empty[String]

    while (rs.next()) {
      nameBuffer.append(rs.getString("name"))
    }

    nameBuffer.toSet
  }

  /**
    *
    * @param updateQuery
    * @param maxRetriesTimes
    * @return true if success else throw exception
    */
  private def executeUpdateWithRetries(updateQuery: String, maxRetriesTimes: Int = 3): Future[Boolean] =
    async {
      var retriesCount: Int = 0
      var cause: Throwable = null
      var isExecuteSuccess: Boolean = false

      while (!isExecuteSuccess && retriesCount < maxRetriesTimes) {
        try {
          retriesCount += 1
          client.execute(updateQuery)
          isExecuteSuccess = true
        } catch {
          case e: BatchUpdateException =>
            throw BadRequestError(s"execute update failed: query: $updateQuery, message: ${e.getMessage}", e)
          case e: Throwable =>
            cause = e
        }
      }

      if (isExecuteSuccess) {
        true
      } else {
        throw InternalError(s"execute update failed after $maxRetriesTimes retries", cause)
      }

    }.rescue {
      case e: Throwable => throw e
    }

}
