package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.Implicits.async
import co.datainsider.bi.util.ZConfig
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column.{ArrayColumn, Column, NestedColumn}
import co.datainsider.schema.domain.{TableSchema, TableType}
import co.datainsider.schema.misc.ColumnDetector.RawColumnData
import co.datainsider.schema.misc.{ClickHouseDDLConverter, ColumnDetector}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.{BadRequestError, DbExecuteError, InternalError}

import java.sql.{BatchUpdateException, ResultSet, ResultSetMetaData}
import scala.collection.mutable.ListBuffer
import scala.util.matching.Regex

/**
  * @author andy
  * @since 7/10/20
  */
trait DDLExecutor {

  /**
    * check if database exists
    * @param dbName database name
    * @return true if exists, otherwise false
    */
  def existsDatabaseSchema(dbName: String): Future[Boolean]

  /**
    * check if table exists
    * @param dbName database name
    * @param tblName table name
    * @param colNames column names
    * @return true if exists, otherwise false
    */
  def existTableSchema(dbName: String, tblName: String, colNames: Seq[String] = Seq.empty): Future[Boolean]

  /**
    * get all database names
    * @return
    */
  def getDbNames(): Future[Seq[String]]

  def dropDatabase(dbName: String): Future[Boolean]

  def getTableNames(dbName: String): Future[Seq[String]]

  @throws[DbExecuteError]
  def scanTables(organizationId: Long, dbName: String): Future[Seq[TableSchema]]

  @deprecated("use dropTable with table type instead of")
  def dropTable(dbName: String, tblName: String): Future[Boolean]

  def dropTable(dbName: String, tblName: String, tableType: TableType): Future[Boolean]

  /**
    * @return list columns name of table
    * @throws NotFoundError when table not exists
    */
  def getColumnNames(dbName: String, tblName: String): Future[Set[String]]

  /**
    * @throws InternalError if internal error occurs
    * @return true if success, otherwise false
    */
  def createDatabase(dbName: String): Future[Boolean]

  /**
    * @throws InternalError if internal error occurs
    * @throws UnsupportedError if unsupported create this table type
    * @return true if success, otherwise false
    */
  def createTable(tableSchema: TableSchema): Future[Boolean]

  /**
    * @return true if success, otherwise false
    * @throws InternalError if internal error occurs
    */
  def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean]

  /**
    * @return true if success, otherwise false
    * @throws NotFoundError when table not exists
    */
  def addColumn(dbName: String, tblName: String, column: Column): Future[Boolean]

  /**
    * @return true if success, otherwise false
    * @throws NotFoundError when table not exists
    */
  def addColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean]

  /**
    * @return true if success, otherwise false
    * @throws NotFoundError when table not exists
    * @throws InternalError if internal error occurs
    */
  def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean]

  /**
    * @return true if success, otherwise false
    * @throws NotFoundError when table not exists
    */
  def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean]

  /**
    * @throws DbExecuteError when sql execute error like syntax error
    */
  def detectColumns(query: String): Future[Seq[Column]]

  @deprecated("Method is supported only in clickhouse engine")
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
case class ClusteredDDLExecutor(
    client: JdbcClient,
    clusterName: String,
    handler: ClickhouseMetaDataHandler
) extends DDLExecutor
    with Logging {

  override def existsDatabaseSchema(dbName: String): Future[Boolean] =
    async {
      isDbExisted(dbName)
    }

  override def existTableSchema(dbName: String, tblName: String, colNames: Seq[String]): Future[Boolean] =
    async {
      isTblExisted(dbName, tblName, colNames)
    }

  override def getDbNames(): Future[Seq[String]] =
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
    val createDbSql = ClickHouseDDLConverter.toCreateDatabaseDDL(dbName, Some(clusterName))
    executeUpdateWithRetries(createDbSql)
  }

  override def dropDatabase(dbName: String): Future[Boolean] = {
    val dropQuery = ClickHouseDDLConverter.toDropDatabaseDDL(dbName, Some(clusterName))
    executeUpdateWithRetries(dropQuery)
  }

  override def getTableNames(dbName: String): Future[Seq[String]] =
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
    val createViewSql: String = ClickHouseDDLConverter.toCreateViewDDL(tableSchema, Some(clusterName))
    executeUpdateWithRetries(createViewSql)
  }

  /**
    * create etl only one node, high performance
    */
  private def createEtlView(tableSchema: TableSchema): Future[Boolean] = {
    val createViewSql: String = ClickHouseDDLConverter.toCreateEtlViewDDL(tableSchema)
    executeUpdateWithRetries(createViewSql)
  }

  private def createInMemoryTable(tableSchema: TableSchema): Future[Boolean] = {
    val createViewSql: String = ClickHouseDDLConverter.toCreateInMemoryDDL(tableSchema)
    executeUpdateWithRetries(createViewSql)
  }

  private def createMaterializeView(tableSchema: TableSchema): Future[Boolean] = {
    val createMaterializedViewSql = ClickHouseDDLConverter.toCreateMaterializedViewDDL(tableSchema, Some(clusterName))
    executeUpdateWithRetries(createMaterializedViewSql)
  }

  private def createDistributedMergeTable(tableSchema: TableSchema): Future[Boolean] = {
    val createShardTblSql = ClickHouseDDLConverter.toCreateShardTableDDL(tableSchema, Some(clusterName))
    val createDistributedTblSql = ClickHouseDDLConverter.toCreateDistributedTableDDL(tableSchema, Some(clusterName))

    executeUpdateWithRetries(createShardTblSql).flatMap(tblShardCreated => {
      if (tblShardCreated) {
        executeUpdateWithRetries(createDistributedTblSql)
      } else throw BadRequestError("create shard table failed")
    })
  }

  def createDistributedReplacingTable(tableSchema: TableSchema): Future[Boolean] = {
    val createShardTblSql = ClickHouseDDLConverter.toCreateShardReplacingTableDDL(tableSchema, Some(clusterName))
    val createDistributedTblSql =
      ClickHouseDDLConverter.toCreateReplacingDistributedTableDDL(tableSchema, Some(clusterName))

    executeUpdateWithRetries(createShardTblSql).flatMap(createShardTableOk => {
      if (createShardTableOk) {
        executeUpdateWithRetries(createDistributedTblSql)
      } else throw BadRequestError(s"create shard table failed, query: $createShardTblSql")
    })
  }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] = {
    val shardTblName: Option[String] = findShardTblName(dbName, tblName)

    if (shardTblName.isDefined) {
      val dropShardTableQuery = ClickHouseDDLConverter.toDropTableDDL(dbName, shardTblName.get, Some(clusterName))
      executeUpdateWithRetries(dropShardTableQuery)
    }

    val dropTblQuery = ClickHouseDDLConverter.toDropTableDDL(dbName, tblName, Some(clusterName))
    executeUpdateWithRetries(dropTblQuery)
  }

  override def dropTable(dbName: String, tblName: String, tableType: TableType): Future[Boolean] = dropTable(dbName, tblName)

  // rename for table schema only rename distributed table in clickhouse
  // DO NOT renamed shard table because path of distributed table to shard table can not be updated
  override def renameTable(
      dbName: String,
      oldTblName: String,
      newTblName: String
  ): Future[Boolean] = {
    val renameSql = ClickHouseDDLConverter.toRenameTableDDL(dbName, oldTblName, newTblName, Some(clusterName))
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
      val updateShardColumnSql =
        ClickHouseDDLConverter.toAddColumnDLL(dbName, shardTblName.get, column, Some(clusterName))
      executeUpdateWithRetries(updateShardColumnSql)
    }

    val updateColumnSql = ClickHouseDDLConverter.toAddColumnDLL(dbName, tblName, column, Some(clusterName))
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

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] = {
    val shardTblName: Option[String] = findShardTblName(dbName, tblName)

    if (shardTblName.isDefined) {
      val deleteShardColQuery =
        ClickHouseDDLConverter.toDropColumnDDL(dbName, shardTblName.get, columnName, Some(clusterName))
      executeUpdateWithRetries(deleteShardColQuery)
    }

    val deleteColQuery = ClickHouseDDLConverter.toDropColumnDDL(dbName, tblName, columnName, Some(clusterName))
    executeUpdateWithRetries(deleteColQuery)
  }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] = {
    val shardTblName: Option[String] = findShardTblName(dbName, tblName)

    if (shardTblName.isDefined) {
      val updateShardColQuery =
        ClickHouseDDLConverter.toUpdateColumnDLL(dbName, shardTblName.get, column, Some(clusterName))
      executeUpdateWithRetries(updateShardColQuery)
    }

    val updateColQuery = ClickHouseDDLConverter.toUpdateColumnDLL(dbName, tblName, column, Some(clusterName))
    executeUpdateWithRetries(updateColQuery)
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
          client.executeUpdate(updateQuery)
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

  override def scanTables(organizationId: Long, dbName: String): Future[Seq[TableSchema]] = {
    handler.getTables(organizationId, dbName, Seq.empty)
  }

  override def detectColumns(query: String): Future[Seq[Column]] =
    Future {
      val detectQuery: String =
        s"""
         |SELECT *
         |FROM (
         |  $query
         |)
         |WHERE 1 = 0""".stripMargin
      client.executeQuery(detectQuery)(rs => {
        val metaData = rs.getMetaData
        Range(1, rs.getMetaData.getColumnCount + 1)
          .map(index => {
            val isNullable = metaData.isNullable(index) == ResultSetMetaData.columnNullable;
            val columnData = RawColumnData(
              name = metaData.getColumnName(index),
              displayName = metaData.getColumnLabel(index),
              idType = metaData.getColumnType(index),
              isNullable = isNullable
            )
            ColumnDetector.createColumn(columnData);
          })
      })
    }
}
