package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.Serializer
import co.datainsider.schema.domain.column.Column
import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.client.repository.SchemaManager
import co.datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo, TableSchema, TableStatus, TableType}
import datainsider.client.util.ByKeyAsyncMutex

import java.sql.ResultSet
import javax.inject.Named
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}
import scala.util.Try

class MySqlSchemaMetadataStorage @Inject() (@Named("mysql") val client: JdbcClient)
    extends SchemaMetadataStorage
    with SchemaManager {
  private val storeName: String = "di_schema"

  private val dbsMetadataTable = "dbs_metadata"
  private val dbsMetadataRequiredFields: Seq[String] =
    Seq("org_id", "db_name", "display_name", "creator_id", "created_time", "updated_time")

  private val tablesMetadataTable: String = "tables_metadata"
  private val tablesMetadataRequiredFields: Seq[String] =
    Seq(
      "org_id",
      "db_name",
      "tbl_name",
      "display_name",
      "columns",
      "engine",
      "primary_keys",
      "partition_bys",
      "order_bys",
      "query",
      "table_type",
      "table_status",
      "ttl",
      "expression_cols",
      "calculated_cols"
    )

  implicit val ec: ExecutionContextExecutor = ExecutionContext.global
  private val mutex = ByKeyAsyncMutex()

  private def lockTable[T](dbName: String, tblName: String)(f: => Future[T]): Future[T] = {
    mutex.acquireAndRun(key = s"$dbName.$tblName") {
      f
    }
  }

  override def addDatabase(organizationId: Long, dbSchema: DatabaseSchema): Future[Boolean] =
    Future {
      val insertDbQuery =
        s"""
         |insert into $storeName.$dbsMetadataTable (org_id, db_name, display_name, creator_id, created_time, updated_time)
         |values (?, ?, ?, ?, ?, ?)
         |""".stripMargin

      client.executeUpdate(
        insertDbQuery,
        organizationId,
        dbSchema.name,
        dbSchema.name,
        dbSchema.creatorId,
        System.currentTimeMillis(),
        System.currentTimeMillis()
      ) > 0

      if (dbSchema.tables.nonEmpty) {
        val insertTableQuery =
          s"""
             |insert into $storeName.$tablesMetadataTable
             |( org_id, db_name, tbl_name, display_name, columns, engine, primary_keys, partition_bys,
             |  order_bys, query, table_type, table_status, ttl, expression_cols, calculated_cols )
             |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             |""".stripMargin

        client.executeBatchUpdate(
          insertTableQuery,
          dbSchema.tables.toArray.map(tableSchema => {
            Array(
              organizationId,
              dbSchema.name,
              tableSchema.name,
              tableSchema.displayName,
              Serializer.toJson(tableSchema.columns.toArray),
              tableSchema.engine.orNull,
              Serializer.toJson(tableSchema.primaryKeys),
              Serializer.toJson(tableSchema.partitionBy),
              Serializer.toJson(tableSchema.orderBys),
              tableSchema.query.orNull,
              tableSchema.tableType.getOrElse(TableType.Default).toString,
              tableSchema.tableStatus.getOrElse(TableStatus.Normal).toString,
              tableSchema.ttl.getOrElse(0L),
              Serializer.toJson(tableSchema.expressionColumns.toArray),
              Serializer.toJson(tableSchema.calculatedColumns.toArray)
            )
          })
        ) > 0
      } else true
    }

  override def isExists(organizationId: Long, dbName: String): Future[Boolean] =
    Future {
      val findDbQuery =
        s"""
         |select 1
         |from $storeName.$dbsMetadataTable
         |where org_id = ? and db_name = ?
         |""".stripMargin

      client.executeQuery(findDbQuery, organizationId, dbName)(_.next())
    }

  override def hardDelete(organizationId: Long, dbName: String): Future[Boolean] =
    Future {
      val deleteDbQuery =
        s"""
         |delete from $storeName.$dbsMetadataTable
         |where org_id = ? and db_name = ?
         |""".stripMargin

      client.executeUpdate(deleteDbQuery, organizationId, dbName) >= 0

      val deleteTablesQuery =
        s"""
           |delete from $storeName.$tablesMetadataTable
           |where org_id = ? and db_name = ?
           |""".stripMargin

      client.executeUpdate(deleteTablesQuery, organizationId, dbName) >= 0
    }

  override def hasDatabaseSchema(organizationId: Long, dbName: String): Future[Boolean] = {
    isExists(organizationId, dbName)
  }

  override def isExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      colNames: Seq[String] = Seq.empty
  ): Future[Boolean] =
    Future {
      val findTableQuery =
        s"""
           |select columns
           |from $storeName.$tablesMetadataTable
           |where org_id = ? and db_name = ? and tbl_name = ?
           |""".stripMargin

      client.executeQuery(findTableQuery, organizationId, dbName, tblName)(_.next())
    }

  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] =
    Future {
      val selectDbQuery =
        s"""
         |select * from $storeName.$dbsMetadataTable
         |where org_id = ? and db_name = ?
         |""".stripMargin

      val dbSchema: Option[DatabaseSchema] = client
        .executeQuery(
          selectDbQuery,
          organizationId,
          dbName
        )(toDatabaseSchemas)
        .headOption

      require(dbSchema.nonEmpty, s"Not found db with name $dbName in org $organizationId")

      val selectTablesQuery =
        s"""
         |select * from $storeName.$tablesMetadataTable
         |where org_id = ? and db_name = ?
         |""".stripMargin

      val tables: Seq[TableSchema] = client.executeQuery(selectTablesQuery, organizationId, dbName)(toTableSchemas)

      dbSchema.get.copy(tables = tables)
    }

  override def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]] = {
    Future.collect(dbNames.map(dbName => getDatabaseSchema(organizationId, dbName)))
  }

  override def getDatabaseSchema(dbName: String): Future[DatabaseSchema] =
    Future {
      val selectDbQuery =
        s"""
         |select * from $storeName.$dbsMetadataTable
         |where db_name = ?
         |""".stripMargin

      val dbSchema: Option[DatabaseSchema] = client
        .executeQuery(
          selectDbQuery,
          dbName
        )(toDatabaseSchemas)
        .headOption

      require(dbSchema.nonEmpty, s"Not found db with name $dbName")

      val selectTablesQuery =
        s"""
         |select * from $storeName.$tablesMetadataTable
         |where db_name = ?
         |""".stripMargin

      val tables: Seq[TableSchema] = client.executeQuery(selectTablesQuery, dbName)(toTableSchemas)

      dbSchema.get.copy(tables = tables)
    }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    val selectDbQuery =
      s"""
         |select * from $storeName.$dbsMetadataTable
         |where org_id = ?
         |""".stripMargin

    val dbSchemas: Seq[DatabaseSchema] = client
      .executeQuery(
        selectDbQuery,
        organizationId
      )(toDatabaseSchemas)

    getDatabaseSchemas(organizationId, dbSchemas.map(_.name))
  }

  override def getDatabaseShortInfos(organizationId: Long): Future[Seq[DatabaseShortInfo]] =
    Future {
      val selectDbQuery =
        s"""
         |select * from $storeName.$dbsMetadataTable
         |where org_id = ?
         |""".stripMargin

      client
        .executeQuery(
          selectDbQuery,
          organizationId
        )(toDatabaseSchemas)
        .asDatabaseShortInfos()
    }

  override def addTable(organizationId: Long, dbName: String, tableSchema: TableSchema): Future[Boolean] =
    Future {
      val insertTableQuery =
        s"""
         |insert into $storeName.$tablesMetadataTable
         |( org_id, db_name, tbl_name, display_name, columns, engine, primary_keys, partition_bys,
         |  order_bys, query, table_type, table_status, ttl, expression_cols, calculated_cols )
         |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         |""".stripMargin

      client.executeUpdate(
        insertTableQuery,
        organizationId,
        dbName,
        tableSchema.name,
        tableSchema.displayName,
        Serializer.toJson(tableSchema.columns.toArray),
        tableSchema.engine.orNull,
        Serializer.toJson(tableSchema.primaryKeys),
        Serializer.toJson(tableSchema.partitionBy),
        Serializer.toJson(tableSchema.orderBys),
        tableSchema.query.orNull,
        tableSchema.tableType.getOrElse(TableType.Default).toString,
        tableSchema.tableStatus.getOrElse(TableStatus.Normal).toString,
        tableSchema.ttl.getOrElse(0L),
        Serializer.toJson(tableSchema.expressionColumns.toArray),
        Serializer.toJson(tableSchema.calculatedColumns.toArray)
      ) >= 0
    }

  def getTable(orgId: Long, dbName: String, tblName: String): Future[TableSchema] =
    Future {
      val selectTableQuery =
        s"""
         |select * from $storeName.$tablesMetadataTable
         |where org_id = ? and db_name = ? and tbl_name = ?
         |""".stripMargin

      val tableSchema: Option[TableSchema] =
        client.executeQuery(selectTableQuery, orgId, dbName, tblName)(toTableSchemas).headOption

      require(tableSchema.nonEmpty, s"not found table schema $dbName.$tblName")

      tableSchema.head
    }

  override def dropTable(organizationId: Long, dbName: String, tblName: String): Future[Boolean] =
    Future {
      val deleteTableQuery =
        s"""
         |delete from $storeName.$tablesMetadataTable
         |where org_id = ? and db_name = ? and tbl_name = ?
         |""".stripMargin

      client.executeUpdate(deleteTableQuery, organizationId, dbName, tblName) > 0
    }

  override def renameTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    for {
      tblSchema <- getTable(organizationId, dbName, tblName)
      renameOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(name = newTblName))
    } yield renameOk
  }

  override def updateTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblSchema: TableSchema
  ): Future[Boolean] =
    Future {
      val updateTableQuery =
        s"""
         |update $storeName.$tablesMetadataTable
         |set tbl_name = ?, columns = ?, expression_cols = ?, calculated_cols = ?
         |where org_id = ? and db_name = ? and tbl_name = ?
         |""".stripMargin

      client.executeUpdate(
        updateTableQuery,
        newTblSchema.name,
        Serializer.toJson(newTblSchema.columns.toArray),
        Serializer.toJson(newTblSchema.expressionColumns.toArray),
        Serializer.toJson(newTblSchema.calculatedColumns.toArray),
        organizationId,
        dbName,
        tblName
      ) > 0
    }

  override def addColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newColumns: Seq[Column]
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        updatedCols = (tblSchema.columns ++ newColumns).distinct
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(columns = updatedCols))
      } yield updateOk
    }

  override def addOrUpdateColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        newTblSchema = tblSchema.copyAsMergeMultipleColumns(columns)
        updateOk <- updateTable(organizationId, dbName, tblName, newTblSchema)
      } yield updateOk
    }

  override def updateColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newColumn: Column
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        newColumns = tblSchema.columns.map(c => if (c.name.equals(newColumn.name)) newColumn else c)
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(columns = newColumns))
      } yield updateOk
    }

  override def dropColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        updatedCols = tblSchema.columns.filterNot(_.name == columnName)
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(columns = updatedCols))
      } yield updateOk
    }

  override def removeDatabase(organizationId: Long, dbName: String): Future[Boolean] = Future.True

  override def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean] = Future.True

  override def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]] = Future(Seq.empty)

  override def getExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Option[Column]] = {
    for {
      tblSchema <- getTable(organizationId, dbName, tblName)
    } yield findExprColumn(tblSchema, columnName)
  }

  override def addExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        _ = findExprColumn(tblSchema, newExpColumn.name) match {
          case Some(col) =>
            throw BadRequestError(
              s"expression column with name ${newExpColumn.name} already exists in ${tblSchema.dbName}.${tblSchema.name}"
            )
          case None =>
        }
        newExpressionCols = (tblSchema.expressionColumns :+ newExpColumn).distinct
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(expressionColumns = newExpressionCols))
      } yield updateOk
    }

  override def updateExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        _ = findExprColumn(tblSchema, newExpColumn.name) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"expression column with name ${newExpColumn.name} does not exist in ${tblSchema.dbName}.${tblSchema.name}"
            )
        }
        newExpressionCols =
          tblSchema.expressionColumns.map(c => if (c.name.equals(newExpColumn.name)) newExpColumn else c)
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(expressionColumns = newExpressionCols))
      } yield updateOk
    }

  override def dropExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        _ = findExprColumn(tblSchema, columnName) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"expression column with name $columnName does not exist in ${tblSchema.dbName}.${tblSchema.name}"
            )
        }
        newExpressionCols = tblSchema.expressionColumns.filterNot(_.name == columnName)
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(expressionColumns = newExpressionCols))
      } yield updateOk
    }

  override def addCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        _ = findCalcColumn(tblSchema, newCalcColumn.name) match {
          case Some(col) =>
            throw BadRequestError(
              s"calculated column with name ${newCalcColumn.name} already exists in ${tblSchema.dbName}.${tblSchema.name}"
            )
          case None =>
        }
        newCalcColumns = (tblSchema.calculatedColumns :+ newCalcColumn).distinct
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(calculatedColumns = newCalcColumns))
      } yield updateOk
    }

  override def updateCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        _ = findCalcColumn(tblSchema, newCalcColumn.name) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"calculated column with name ${newCalcColumn.name} does not exist in ${tblSchema.dbName}.${tblSchema.name}"
            )
        }
        newCalcColumns =
          tblSchema.calculatedColumns.map(c => if (c.name.equals(newCalcColumn.name)) newCalcColumn else c)
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(calculatedColumns = newCalcColumns))
      } yield updateOk
    }

  override def dropCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] =
    lockTable(dbName, tblName) {
      for {
        tblSchema <- getTable(organizationId, dbName, tblName)
        _ = findCalcColumn(tblSchema, columnName) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"calculated column with name $columnName does not exist in ${tblSchema.dbName}.${tblSchema.name}"
            )
        }
        newCalcColumns = tblSchema.calculatedColumns.filterNot(_.name.equals(columnName))
        updateOk <- updateTable(organizationId, dbName, tblName, tblSchema.copy(calculatedColumns = newCalcColumns))
      } yield updateOk
    }

  override def ensureSchema(): Future[Boolean] =
    Future {
      ensureDbCreated()
      ensureDbsMetadataSchema()
      ensureTablesMetadataSchema()

      true
    }

  private def ensureDbCreated(): Unit = {
    val query = s"create database if not exists $storeName"
    client.executeUpdate(query)
  }

  private def ensureDbsMetadataSchema(): Unit = {
    if (!existsSchema(dbsMetadataTable)) {
      createDbsMetadataTable()
    } else if (!isValidCols(dbsMetadataTable, dbsMetadataRequiredFields)) {
      throw new InternalError("invalid dbs metadata schema")
    }
  }

  private def existsSchema(tblName: String): Boolean = {
    val findTableQuery = s"show tables from $storeName like ?"
    client.executeQuery(findTableQuery, tblName)(_.next())
  }

  private def isValidCols(tblName: String, requiredFields: Seq[String]): Boolean = {
    val descQuery = s"desc $storeName.$tblName"
    val actualFields = ArrayBuffer[String]()
    client.executeQuery(descQuery)(rs => {
      while (rs.next()) {
        actualFields += rs.getString("Field")
      }
    })

    actualFields.toSet == requiredFields.toSet
  }

  private def createDbsMetadataTable(): Unit = {
    val createDbsTableQuery =
      s"""
         |create table if not exists $storeName.$dbsMetadataTable (
         |  org_id BIGINT NOT NULL,
         |  db_name VARCHAR(255) NOT NULL,
         |  display_name TEXT,
         |  creator_id TEXT,
         |  created_time BIGINT DEFAULT 0,
         |  updated_time BIGINT DEFAULT 0,
         |  PRIMARY KEY (org_id, db_name)
         |) engine=INNODB default charset=utf8mb4;
         |""".stripMargin

    client.executeUpdate(createDbsTableQuery)
  }

  private def ensureTablesMetadataSchema(): Unit = {
    if (!existsSchema(tablesMetadataTable)) {
      createTablesMetadataSchema()
    } else if (!isValidCols(tablesMetadataTable, tablesMetadataRequiredFields)) {
      throw new InternalError("invalid tables metadata schema")
    }
  }

  private def createTablesMetadataSchema(): Unit = {
    val createTablesTblQuery =
      s"""
         |create table if not exists $storeName.$tablesMetadataTable (
         |  org_id BIGINT NOT NULL,
         |  db_name VARCHAR(255) NOT NULL,
         |  tbl_name VARCHAR(255) NOT NULL,
         |  display_name TEXT,
         |  columns LONGTEXT,
         |  engine TINYTEXT,
         |  primary_keys TEXT,
         |  partition_bys TEXT,
         |  order_bys TEXT,
         |  query TEXT,
         |  table_type TINYTEXT,
         |  table_status TINYTEXT,
         |  ttl BIGINT,
         |  expression_cols LONGTEXT,
         |  calculated_cols LONGTEXT,
         |  PRIMARY KEY (org_id, db_name, tbl_name)
         |) engine=INNODB default charset=utf8mb4;
         |""".stripMargin

    client.executeUpdate(createTablesTblQuery)
  }

  private def toDatabaseSchemas(rs: ResultSet): Seq[DatabaseSchema] = {
    val dbSchemas = ArrayBuffer[DatabaseSchema]()

    while (rs.next()) {
      val dbSchema = DatabaseSchema(
        name = rs.getString("db_name"),
        organizationId = rs.getLong("org_id"),
        displayName = rs.getString("display_name"),
        creatorId = rs.getString("creator_id"),
        createdTime = rs.getLong("created_time"),
        updatedTime = rs.getLong("updated_time"),
        tables = Seq.empty
      )

      dbSchemas += dbSchema
    }

    dbSchemas
  }

  private def toTableSchemas(rs: ResultSet): Seq[TableSchema] = {
    val tablesSchemas = ArrayBuffer[TableSchema]()

    while (rs.next()) {
      val tableSchema = TableSchema(
        name = rs.getString("tbl_name"),
        dbName = rs.getString("db_name"),
        organizationId = rs.getLong("org_id"),
        displayName = rs.getString("display_name"),
        columns = Serializer.fromJson[Seq[Column]](rs.getString("columns")),
        engine = Try(rs.getString("engine")).toOption,
        primaryKeys = Serializer.fromJson[Seq[String]](rs.getString("primary_keys")),
        partitionBy = Serializer.fromJson[Seq[String]](rs.getString("partition_bys")),
        orderBys = Serializer.fromJson[Seq[String]](rs.getString("order_bys")),
        query = Try(rs.getString("query")).toOption,
        tableType = Option(TableType.withName(rs.getString("table_type"))),
        tableStatus = Option(TableStatus.withName(rs.getString("table_status"))),
        ttl = Try(rs.getLong("ttl")).toOption,
        expressionColumns = Serializer.fromJson[Seq[Column]](rs.getString("expression_cols")),
        calculatedColumns = Serializer.fromJson[Seq[Column]](rs.getString("calculated_cols"))
      )

      tablesSchemas += tableSchema
    }

    tablesSchemas
  }

  private def findExprColumn(tableSchema: TableSchema, colName: String): Option[Column] = {
    tableSchema.expressionColumns.find(_.name == colName)
  }

  private def findCalcColumn(tableSchema: TableSchema, colName: String): Option[Column] = {
    tableSchema.calculatedColumns.find(_.name == colName)
  }

}
