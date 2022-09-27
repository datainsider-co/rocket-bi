package datainsider.schema.repository

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.exception.{BadRequestError, DbExecuteError}
import datainsider.client.util.{JdbcClient, JsonParser, ZConfig}
import datainsider.profiler.Profiler
import datainsider.schema.domain.Types.DBName
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.misc.DDLConverter
import datainsider.schema.util.Implicits.ImplicitString

import java.sql.ResultSet
import scala.collection.mutable.ListBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.control.Breaks.{break, breakable}
import scala.util.matching.Regex

/**
  * @author andy
  * @since 7/10/20
  */
trait DDLExecutor {

  def existsDatabaseSchema(dbName: String): Future[Boolean]

  def existTableSchema(dbName: String, tblName: String): Future[Boolean]

  def getDatabases(): Future[Seq[String]]

  def createDatabase(dbName: String, force: Boolean = false): Future[Boolean]

  def dropDatabase(dbName: String): Future[Boolean]

  def getTables(dbName: String): Future[Seq[String]]

  def createTable(tableSchema: TableSchema): Future[Boolean]

  def dropTable(dbName: String, tblName: String): Future[Boolean]

  def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean]

  def getColumnNames(dbName: String, tblName: String): Future[Set[String]]

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
  val waitTimeMs: Int = ZConfig.getInt("cluster_ddl.wait_time_ms", 500)

  override def existTableSchema(dbName: String, tblName: String): Future[Boolean] =
    Future {
      try {
        val query = s"SELECT name FROM system.tables WHERE (database = ?) AND (name = ?)"
        client.executeQuery(query, dbName, tblName)(_.next())
      } catch {
        case ex: Throwable =>
          logger.error(s"isTableExists($dbName, $tblName)", ex)
          throw DbExecuteError("Query error")
      }
    }

  override def getDatabases(): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"show databases")(getNames)
      } catch {
        case ex: Throwable =>
          logger.error("getDatabases", ex)
          throw DbExecuteError("Query error")
      }
    }

  override def createDatabase(dbName: String, force: Boolean = false): Future[Boolean] =
    Future {
      try {
        val createDbSql = force match {
          case true => s"CREATE DATABASE $dbName ON CLUSTER $clusterName"
          case _    => s"CREATE DATABASE IF NOT EXISTS $dbName ON CLUSTER $clusterName"
        }
        logger.info(createDbSql)
        client.execute(createDbSql)
      } catch {
        case ex: Throwable =>
          logger.error(s"createDatabase($dbName)", ex)
          throw DbExecuteError("Query error")
      }
    }

  override def dropDatabase(dbName: String): Future[Boolean] =
    Future {
      val dropQuery = s"DROP DATABASE IF EXISTS $dbName ON CLUSTER $clusterName SYNC"
      logger.info(s"dropDatabase:: ${dropQuery}")
      client.execute(dropQuery)
      waitUtilDatabaseDropped(dbName)
    }

  private def waitUtilDatabaseDropped(dbName: DBName): Boolean = {
    var retryCount = 0
    breakable {
      do {
        if (!this.existsDatabaseSchema(dbName).syncGet()) {
          break
        } else {
          retryCount += 1
          info(s"waitUtilDatabaseDropped:: ${dbName} retry ${retryCount}")
          Thread.sleep(waitTimeMs)
        }
      } while (retryCount < maxRetryTimes)
    }
    if (retryCount >= maxRetryTimes) {
      error(s"drop database $dbName in cluster failed!")
      false
    } else {
      info(s"drop database succeeded:: ${dbName}")
      true
    }
  }

  override def existsDatabaseSchema(dbName: String): Future[Boolean] =
    Future {
      try {
        val query = s"SELECT name FROM system.databases WHERE name = ?"
        client.executeQuery(query, dbName)(_.next())
      } catch {
        case ex: Throwable =>
          logger.error(s"isDatabaseExists($dbName)", ex)
          throw DbExecuteError("Error: can't check database is exists or not ")
      }
    }

  override def getTables(dbName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"show tables from $dbName")(getNames)
      } catch {
        case ex: Throwable =>
          logger.error(s"getTables($dbName)", ex)
          throw DbExecuteError("Query error")
      }
    }

  private def getNames(rs: ResultSet): Seq[String] = {
    val nameBuffer = ListBuffer.empty[String]
    while (rs.next()) {
      nameBuffer.append(rs.getString(1))
    }
    nameBuffer
  }

  override def createTable(tableSchema: TableSchema): Future[Boolean] = {
    tableSchema.getTableType match {
      case TableType.View         => createView(tableSchema)
      case TableType.Materialized => createMaterializeView(tableSchema)
      case TableType.Default      => createDistributedTable(tableSchema)
      case TableType.InMemory     => createInMemoryTable(tableSchema)
      case TableType.EtlView      => createEtlView(tableSchema)
      case TableType.Replacing    => createDistributedReplacingTable(tableSchema)
      case _                      => Future.False
    }

  }

  def createDistributedReplacingTable(tableSchema: TableSchema): Future[Boolean] =
    Future {
      try {
        val createShardTblSql = dllConverter.toCreateShardReplacingTableDDL(tableSchema, clusterName)
        val createDistributedTblSql = dllConverter.toCreateReplacingDistributedTableDDL(tableSchema, clusterName)

        info(s"createDistributedReplacingTable::createShardTblSql ${createShardTblSql}")
        client.executeUpdate(createShardTblSql)

        info(s"createDistributedReplacingTable::createDistributedTblSql ${createDistributedTblSql}")
        client.executeUpdate(createDistributedTblSql)

        waitUntilTableReady(tableSchema.dbName, tableSchema.name, Seq.empty)
      } catch {
        case ex: Throwable =>
          logger.error(s"createDistributedReplacingTable: ${JsonParser.toJson(tableSchema)}", ex)
          throw DbExecuteError("Create replacing table error")
      }
    }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] = {
    Future {
      dropSharedTable(dbName, tblName)
      dropDistributedTable(dbName, tblName)
    }
  }

  private def dropSharedTable(dbName: String, tblName: String): Unit = {
    try {
      val dropShardTableQuery =
        s"DROP TABLE IF EXISTS `$dbName`.${findShardTableName(dbName, tblName)} ON CLUSTER $clusterName SYNC"
      logger.info(s"dropShardTableQuery:: ${dropShardTableQuery}")
      client.execute(dropShardTableQuery)
    } catch {
      case ex: Throwable => error(s"dropSharedTable::error:: ${ex.getMessage}")
    }
  }

  private def dropDistributedTable(dbName: String, tblName: String): Boolean = {
    val dropDistributedTblQuery = s"DROP TABLE IF EXISTS `$dbName`.`$tblName` ON CLUSTER $clusterName SYNC"
    logger.info(s"dropDistributedTblQuery::${dropDistributedTblQuery}")
    client.execute(dropDistributedTblQuery)
  }

  // rename for table schema only rename distributed table in clickhouse
  // DO NOT renamed shard table because path of distributed table to shard table can not be updated
  override def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean] = {
    Future {
      try {
        val renameSql = s"RENAME TABLE $dbName.$oldTblName to $dbName.$newTblName ON CLUSTER $clusterName"
        val result: Boolean = client.execute(renameSql)
        info(s"renameTable:: ${renameSql} - result: ${result}")
        result
      } catch {
        case ex: Throwable =>
          logger.error(s"rename table: $dbName.$oldTblName to $newTblName ", ex)
          false
      }
    }
  }

  override def getColumnNames(dbName: String, tblName: String): Future[Set[String]] = {

    Future {
      client.executeQuery(
        s"""
           |SELECT * FROM system.columns
           |WHERE database=? AND table=?
           |""".stripMargin,
        dbName,
        tblName
      )(readColumnNames)
    }
  }

  private def readColumnNames(rs: ResultSet): Set[String] = {
    val nameBuffer = ListBuffer.empty[String]
    while (rs.next()) {
      nameBuffer.append(rs.getString("name"))
    }
    nameBuffer.toSet
  }

  override def addColumn(
      dbName: String,
      tblName: String,
      column: Column
  ): Future[Boolean] = {
    addColumns(dbName, tblName, Seq(column))
  }

  override def addColumns(
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean] = {
    Future {
      try {
        if (columns.nonEmpty) {
          val shardTblUpdated: Boolean = execAddingColumns(dbName, s"${findShardTableName(dbName, tblName)}", columns)
          val distributedTblUpdated: Boolean = execAddingColumns(dbName, tblName, columns)
          shardTblUpdated && distributedTblUpdated
        } else true
      } catch {
        case ex: Throwable =>
          logger.error(s"addColumns: $dbName, $tblName, ${JsonParser.toJson(columns, false)}", ex)
          throw DbExecuteError("Query error")
      }

    }
  }

  private def execAddingColumns(
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Boolean = {
    flattenNestedColumns(columns)
      .map(column => {
        val updateColumnSql = dllConverter.toAddColumnDLL(dbName, tblName, column, clusterName)
        info(updateColumnSql)
        client.execute(updateColumnSql)
      })
      .forall(_ == true)

    waitUntilTableReady(dbName, tblName, columns.map(_.name))
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

  /**
    * this is due to create table in cluster mode is async
    * @param dbName name of db
    * @param tblName name of table
    * @param colNames if empty, check table status, else check column status
    * @return
    */
  private def waitUntilTableReady(dbName: String, tblName: String, colNames: Seq[String]): Boolean =
    Profiler("[DDLExecutor]::waitUntilTableReady") {
      var retryCount = 0
      breakable {
        do {
          if (isTableReady(dbName, tblName, colNames)) {
            break
          } else {
            retryCount += 1
            info(s"waitUntilTableReady:: ${dbName}.${tblName} retry ${retryCount}")
            Thread.sleep(waitTimeMs)
          }
        } while (retryCount < maxRetryTimes)
      }
      if (retryCount >= maxRetryTimes) {
        error(s"create table $dbName.$tblName in cluster failed!")
        false
      } else {
        info(s"waitUntilTableReady:: ${dbName}.${tblName} completed")
        true
      }
    }

  private def isTableReady(dbName: String, tblName: String, colNames: Seq[String]): Boolean = {
    val fieldStr = if (colNames.isEmpty) "*" else colNames.map(_.escape).mkString(", ")
    val query = s"select $fieldStr from $dbName.$tblName limit 0"

    try {
      client.executeQuery(query)(_ => true)
    } catch {
      case e: Throwable => false
    }
  }

  private def findShardTableName(dbName: String, tblName: String): String = {
    val showCreateTableQuery = s"show create table $dbName.$tblName"
    val createStatement: String = client.executeQuery(showCreateTableQuery)(rs => {
      if (rs.next()) rs.getString(1)
      else ""
    })

    val engineRegex: Regex = """ENGINE = Distributed\('\w+', '\w+', '(\w+)', .+\)""".r
    engineRegex.findFirstMatchIn(createStatement) match {
      case Some(value) => value.group(1)
      case None        => throw BadRequestError(s"fail to find shard table name from create statement: $createStatement")
    }
  }

  override def execute[T](query: String)(converter: ResultSet => T): Future[T] = {
    Future {
      client.executeQuery(query)(converter)
    }
  }

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] = {
    Future {
      val shardTableUpdated: Boolean = client.execute(
        dllConverter.toDeleteColumnDDL(dbName, s"${findShardTableName(dbName, tblName)}", columnName, clusterName)
      )
      val distributedTableUpdated: Boolean = client.execute(
        dllConverter.toDeleteColumnDDL(dbName, tblName, columnName, clusterName)
      )
      shardTableUpdated && distributedTableUpdated
    }
  }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    Profiler(s"[Schema] ${this.getClass.getName}::updateColumn") {
      Future {
        val shardTableUpdated: Boolean = client.execute(
          dllConverter.toUpdateColumnDLL(dbName, s"${findShardTableName(dbName, tblName)}", column, clusterName)
        )
        val distributedTableUpdated: Boolean = client.execute(
          dllConverter.toUpdateColumnDLL(dbName, tblName, column, clusterName)
        )
        shardTableUpdated && distributedTableUpdated
      }
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
      client.execute(s"""
        |OPTIMIZE TABLE `$dbName`.`$tableName`
        |ON CLUSTER ${clusterName} ${finalState}
        |DEDUPLICATE ${columnsDeduplication}
        |""".stripMargin)
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

      client.executeUpdate(query) > 0
    }

  private def createView(tableSchema: TableSchema): Future[Boolean] =
    Future {
      try {
        val createViewSql: String = dllConverter.toCreateViewDDL(tableSchema, clusterName)
        logger.info(createViewSql)

        client.executeUpdate(createViewSql)
        waitUntilTableReady(tableSchema.dbName, tableSchema.name, Seq.empty)
      } catch {
        case ex: Throwable =>
          logger.error(s"createView: ${JsonParser.toJson(tableSchema)}", ex)
          throw DbExecuteError(s"Create view error: ${tableSchema.name}")
      }
    }

  /**
    * create etl only one node, high performance
    */
  private def createEtlView(tableSchema: TableSchema): Future[Boolean] =
    Future {
      try {
        val createViewSql: String = dllConverter.toCreateEtlViewDDL(tableSchema, clusterName)
        info(s"createEtlView:: ${createViewSql}")
        client.executeUpdate(createViewSql) >= 0
      } catch {
        case ex: Throwable =>
          logger.error(s"createEtlView: ${JsonParser.toJson(tableSchema)}", ex)
          throw DbExecuteError(s"Create view error: ${tableSchema.name}")
      }
    }

  private def createInMemoryTable(tableSchema: TableSchema): Future[Boolean] =
    Future {
      try {
        val createViewSql: String = dllConverter.toCreateInMemoryDDL(tableSchema, clusterName)
        info(s"createInMemoryTable:: ${createViewSql}")
        client.executeUpdate(createViewSql) >= 0
      } catch {
        case ex: Throwable =>
          error(s"createView: ${JsonParser.toJson(tableSchema)}", ex)
          throw DbExecuteError(s"Create view error: ${tableSchema.name}")
      }
    }

  private def createMaterializeView(tableSchema: TableSchema): Future[Boolean] =
    Future {
      try {
        val createMaterializedViewSql = dllConverter.toCreateMaterializedViewDDL(tableSchema, clusterName)
        logger.info(createMaterializedViewSql)

        // create materialized view may take long time to execute, leading to read time out exception
        // currently this case is handled by simply ignore Read timed out exception
        // clickhouse jdbc lib version: 0.3.2-patch7 https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc/0.3.2-patch7
        try {
          client.executeUpdate(createMaterializedViewSql)
        } catch {
          case e: Throwable =>
            if (e.getMessage.contains("Read timed out")) {
              error(s"${this.getClass.getSimpleName}::createMaterializeView read time out exception: $e")
            } else throw e
        }

        waitUntilTableReady(tableSchema.dbName, tableSchema.name, Seq.empty)
      } catch {
        case ex: Throwable =>
          logger.error(s"createMaterializeView: ${JsonParser.toJson(tableSchema)}", ex)
          throw DbExecuteError(s"Create materialize view error: ${tableSchema.name}")
      }
    }

  private def createDistributedTable(tableSchema: TableSchema): Future[Boolean] =
    Future {
      try {
        val createShardTblSql = dllConverter.toCreateShardTableDDL(tableSchema, clusterName)
        val createDistributedTblSql = dllConverter.toCreateDistributedTableDDL(tableSchema, clusterName)

        info(s"createShardTblSql:: ${createShardTblSql}")
        client.executeUpdate(createShardTblSql)

        info(s"createDistributedTblSql:: ${createDistributedTblSql}")
        client.executeUpdate(createDistributedTblSql)

        waitUntilTableReady(tableSchema.dbName, tableSchema.name, Seq.empty)
      } catch {
        case ex: Throwable =>
          logger.error(s"createTable: ${JsonParser.toJson(tableSchema)}", ex)
          throw DbExecuteError("Create table error")
      }
    }
}
