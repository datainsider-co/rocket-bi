package datainsider.schema.repository

import com.twitter.util.Future
import datainsider.client.exception._
import datainsider.schema.domain.column.Column
import datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo, TableSchema}
import datainsider.schema.util.Implicits.ScalaFutureLike
import education.x.commons.{KVS, SsdbSortedSet}
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

/**
  * @author andy
  * @since 7/15/20
  */

/**
  * Manage schema use ssdb
  */
trait SchemaMetadataStorage {

  def addDatabase(organizationId: Long, dbSchema: DatabaseSchema): Future[Boolean]

  def hasOwnership(organizationId: Long, dbName: String): Future[Boolean]

  def deleteDatabaseSchema(organizationId: Long, dbName: String): Future[Boolean]

  def hasDatabaseSchema(organizationId: Long, dbName: String): Future[Boolean]

  def hasTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean]

  @throws[DbNotFoundError]
  def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema]

  def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]]

  @throws[DbNotFoundError]
  def getDatabaseSchema(dbName: String): Future[DatabaseSchema]

  def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]]

  def getDatabaseShortInfos(organizationId: Long): Future[Seq[DatabaseShortInfo]]

  def addTable(organizationId: Long, dbName: String, tableSchema: TableSchema): Future[Boolean]

  def dropTable(organizationId: Long, dbName: String, tblName: String): Future[Boolean]

  def renameTable(organizationId: Long, dbName: String, tblName: String, newTblName: String): Future[Boolean]

  def addColumns(organizationId: Long, dbName: String, tblName: String, newColumns: Seq[Column]): Future[Boolean]

  def addOrUpdateColumns(organizationId: Long, dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean]

  def updateColumn(organizationId: Long, dbName: String, tblName: String, newColumn: Column): Future[Boolean]

  def dropColumn(organizationId: Long, dbName: String, tblName: String, columnName: String): Future[Boolean]

  def removeDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseSchema]]

  def getExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Option[Column]]

  def addExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean]

  def updateExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean]

  def dropExpressionColumn(organizationId: Long, dbName: String, tblName: String, columnName: String): Future[Boolean]

  def addCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean]

  def updateCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean]

  def dropCalculatedColumn(organizationId: Long, dbName: String, tblName: String, columnName: String): Future[Boolean]

}

/**
  * @param client ssdb client
  * @param dbKVS Chứa toàn bộ database của hệ thống, không phân chia theo org
  */
case class SchemaMetadataStorageImpl(client: SSDB, dbKVS: KVS[String, DatabaseSchema], prefixDb: String)
    extends SchemaMetadataStorage {

  implicit val ec: ExecutionContextExecutor = ExecutionContext.global

  /**
    * Add database to SSDB KVS
    * Add database's name to database list of the current organization
    * @return
    */
  override def addDatabase(organizationId: Long, dbSchema: DatabaseSchema): Future[Boolean] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    for {
      addOK <- dbKVS.add(dbSchema.name, dbSchema).asTwitter
      addOrgDbOK <- databaseAsSet.add(dbSchema.name, System.currentTimeMillis()).asTwitter
    } yield (addOK && addOrgDbOK)
  }

  override def getDatabaseShortInfos(organizationId: Long): Future[Seq[DatabaseShortInfo]] = {
    getDatabases(organizationId).map(_.asDatabaseShortInfo())
  }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    getDbNames(organizationId)
      .flatMap(getDatabaseSchemas)
  }

  /**
    * Get the list of database in this org
    * @param organizationId
    * @return a list of database name
    */
  private def getDbNames(organizationId: Long): Future[Seq[String]] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    databaseAsSet
      .size()
      .map(_.getOrElse(0))
      .flatMap(databaseAsSet.range(0, _, true))
      .map(_.getOrElse(Array.empty).map(_._1).toSeq)
      .asTwitter
  }

  /**
    * Get database details for each and every db in the given list
    * @param dbNames
    * @return
    */
  private def getDatabaseSchemas(dbNames: Seq[String]): Future[Seq[DatabaseSchema]] = {
    dbKVS
      .multiGet(dbNames.toArray)
      .map(_.getOrElse(Map.empty))
      .map(dbMap => {
        dbNames
          .map(dbMap.get)
          .filter(_.isDefined)
          .map(_.get)
      })
      .asTwitter
  }

  override def hasDatabaseSchema(organizationId: Long, dbName: String): Future[Boolean] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    databaseAsSet
      .get(dbName)
      .map(_.isDefined)
      .asTwitter
  }

  /**
    * chứa thông tin danh sách database theo từng org
    */
  private def getDatabaseSet(organizationId: Long): SsdbSortedSet = {
    SsdbSortedSet(s"$prefixDb.$organizationId.databases", client)
  }

  override def hasTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    getDatabaseSchema(organizationId, dbName)
      .map(_.findTableAsOption(tblName))
      .map(_.isDefined)
  }

  override def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    for {
      databaseSchemas <- databaseAsSet.mget(dbNames.toArray).map(_.getOrElse(Map.empty)).asTwitter
      databaseNamesExisted = databaseSchemas.keys.toArray
      databaseSchema <- dbKVS.multiGet(databaseNamesExisted).map(_.getOrElse(Map.empty)).asTwitter
    } yield databaseSchema.values.toSeq
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(dbName: String): Future[DatabaseSchema] = {
    dbKVS
      .get(dbName)
      .map {
        case None           => throw DbNotFoundError(s"this database was not found: $dbName")
        case Some(dbSchema) => dbSchema
      }
      .asTwitter
  }

  override def hasOwnership(organizationId: Long, dbName: String): Future[Boolean] = {
    dbKVS.get(dbName).map(_.isDefined).asTwitter
  }

  override def deleteDatabaseSchema(organizationId: Long, dbName: String): Future[Boolean] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    val trashAsSet = getTrashDatabaseSet(organizationId)
    val result = for {
      _ <- databaseAsSet.remove(dbName)
      _ <- trashAsSet.remove(dbName)
      isRemoved <- dbKVS.remove(dbName)
    } yield isRemoved
    result.asTwitter
  }

  /**
    * chứa thông tin danh sách trash database theo từng org
    */
  private def getTrashDatabaseSet(organizationId: Long): SsdbSortedSet = {
    SsdbSortedSet(s"$prefixDb.$organizationId.deleted_databases", client)
  }

  override def addTable(organizationId: Long, dbName: String, tableSchema: TableSchema): Future[Boolean] = {
    getDatabaseSchema(organizationId, dbName)
      .map(_addTable(_, tableSchema))
      .flatMap(dbKVS.add(dbName, _).asTwitter)
  }

  override def dropTable(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    getDatabaseSchema(organizationId, dbName)
      .map(removeTable(_, tblName))
      .flatMap(dbKVS.add(dbName, _).asTwitter)
  }

  private def removeTable(dbSchema: DatabaseSchema, tblName: String): DatabaseSchema = {
    val newTables = dbSchema.tables.filterNot(_.name.equals(tblName))
    dbSchema.copy(
      tables = newTables
    )
  }

  override def renameTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    getDatabaseSchema(organizationId, dbName)
      .map(updateTblName(_, tblName, newTblName))
      .flatMap(dbKVS.add(dbName, _).asTwitter)
  }

  private def updateTblName(dbSchema: DatabaseSchema, tblName: String, newTblName: String): DatabaseSchema = {
    val newTables: Seq[TableSchema] = dbSchema.tables.map(table => {
      if (table.name.trim == tblName.trim) {
        table.copy(
          name = newTblName.trim,
          displayName = newTblName.trim
        )
      } else table
    })

    dbSchema.copy(
      tables = newTables
    )
  }

  override def addColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newColumns: Seq[Column]
  ): Future[Boolean] = {
    for {
      dbSchema <- getDatabaseSchema(organizationId, dbName)
      tableSchema = dbSchema.findTableAsOption(tblName) match {
        case Some(value) => value
        case _ =>
          throw TableNotFoundError(s"the schema not found for table `$tblName` in  database `${dbSchema.name}`.")
      }
      newTableSchema = tableSchema.copy(columns = tableSchema.columns ++ newColumns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  override def addOrUpdateColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean] = {
    for {
      dbSchema <- getDatabaseSchema(organizationId, dbName)
      tableSchema = dbSchema.findTableAsOption(tblName) match {
        case Some(value) => value
        case _ =>
          throw TableNotFoundError(s"the schema not found for table `$tblName` in  database `${dbSchema.name}`.")
      }
      newTableSchema = tableSchema.copyAsMergeMultipleColumns(columns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  override def dropColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    for {
      dbSchema <- getDatabaseSchema(organizationId, dbName)
      tableSchema = dbSchema.findTableAsOption(tblName) match {
        case Some(value) => value
        case _ =>
          throw TableNotFoundError(s"the schema not found for table `$tblName` in  database `${dbSchema.name}`.")
      }
      newColumns = tableSchema.columns.filterNot(_.name.equals(columnName))
      newTableSchema = tableSchema.copy(columns = newColumns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  /***
    * update column display name, default expression
    * do not change column's name because column name is served as key to find which column to update
    * @param organizationId organization id
    * @param dbName name of db
    * @param tblName name of tbl
    * @param newCol column to be updated
    * @return
    */
  override def updateColumn(organizationId: Long, dbName: String, tblName: String, newCol: Column): Future[Boolean] = {
    for {
      dbSchema <- getDatabaseSchema(organizationId, dbName)
      tableSchema = dbSchema.findTableAsOption(tblName) match {
        case Some(value) => value
        case _ =>
          throw TableNotFoundError(s"the schema not found for table `$tblName` in  database `${dbSchema.name}`.")
      }
      newColumns = tableSchema.columns.map(c => if (c.name.equals(newCol.name)) newCol else c)
      newTableSchema = tableSchema.copy(columns = newColumns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  override def removeDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    val trashDatabaseAsSet = getTrashDatabaseSet(organizationId)
    val databaseAsSet = getDatabaseSet(organizationId)
    for {
      removeOK <- databaseAsSet.remove(dbName).asTwitter
      addOrgTrashDbOK <- trashDatabaseAsSet.add(dbName, System.currentTimeMillis()).asTwitter
    } yield (removeOK && addOrgTrashDbOK)
  }

  override def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    val trashDatabaseAsSet = getTrashDatabaseSet(organizationId)
    val databaseAsSet = getDatabaseSet(organizationId)
    for {
      removeTrashOK <- trashDatabaseAsSet.remove(dbName).asTwitter
      addOrgDbOK <- databaseAsSet.add(dbName, System.currentTimeMillis()).asTwitter
    } yield (removeTrashOK && addOrgDbOK)
  }

  override def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    getDeletedDbNames(organizationId).flatMap(getDatabaseSchemas)
  }

  private def getDeletedDbNames(organizationId: Long): Future[Seq[String]] = {
    val trashDatabaseAsSet = getTrashDatabaseSet(organizationId)
    trashDatabaseAsSet
      .size()
      .map(_.getOrElse(0))
      .flatMap(trashDatabaseAsSet.range(0, _, true))
      .map(_.getOrElse(Array.empty).map(_._1).toSeq)
      .asTwitter
  }

  override def getExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Option[Column]] = {
    for {
      tableSchema <- getTableSchema(organizationId, dbName, tblName)
    } yield findExprColumn(tableSchema, columnName)
  }

  private def getTableSchema(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] = {
    for {
      dbSchema <- getDatabaseSchema(organizationId, dbName)
      tableSchema = dbSchema.findTableAsOption(tblName) match {
        case Some(value) => value
        case _ =>
          throw TableNotFoundError(s"the schema not found for table `$tblName` in  database `${dbSchema.name}`.")
      }
    } yield tableSchema
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    databaseAsSet
      .get(dbName)
      .flatMap {
        case Some(_) => dbKVS.get(dbName)
        case _       => concurrent.Future.successful(None)
      }
      .map {
        case None           => throw DbNotFoundError(s"this database was not found: $dbName")
        case Some(dbSchema) => dbSchema
      }
      .asTwitter
  }

  private def findExprColumn(tableSchema: TableSchema, colName: String): Option[Column] = {
    tableSchema.expressionColumns.find(_.name == colName)
  }

  override def addExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean] = {
    for {
      tableSchema <- getTableSchema(organizationId, dbName, tblName)
      isColExisted = findExprColumn(tableSchema, newExpColumn.name) match {
        case Some(col) =>
          throw BadRequestError(
            s"expression column with name ${newExpColumn.name} already exists in ${tableSchema.dbName}.${tableSchema.name}"
          )
        case None =>
      }
      newTableSchema = tableSchema.copy(expressionColumns = tableSchema.expressionColumns :+ newExpColumn)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  override def updateExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean] = {
    for {
      tableSchema <- getTableSchema(organizationId, dbName, tblName)
      isColExisted = findExprColumn(tableSchema, newExpColumn.name) match {
        case Some(col) =>
        case None =>
          throw BadRequestError(
            s"expression column with name ${newExpColumn.name} does not exist in ${tableSchema.dbName}.${tableSchema.name}"
          )
      }
      newExprColumns = tableSchema.expressionColumns.map(c => if (c.name.equals(newExpColumn.name)) newExpColumn else c)
      newTableSchema = tableSchema.copy(expressionColumns = newExprColumns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  override def dropExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    for {
      tableSchema <- getTableSchema(organizationId, dbName, tblName)
      isColExisted = findExprColumn(tableSchema, columnName) match {
        case Some(col) =>
        case None =>
          throw BadRequestError(
            s"expression column with name $columnName does not exist in ${tableSchema.dbName}.${tableSchema.name}"
          )
      }
      newExprColumns = tableSchema.expressionColumns.filterNot(_.name.equals(columnName))
      newTableSchema = tableSchema.copy(expressionColumns = newExprColumns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  override def addCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean] =
    for {
      tableSchema <- getTableSchema(organizationId, dbName, tblName)
      isColExisted = findCalcColumn(tableSchema, newCalcColumn.name) match {
        case Some(col) =>
          throw BadRequestError(
            s"calculated column with name ${newCalcColumn.name} already exists in ${tableSchema.dbName}.${tableSchema.name}"
          )
        case None =>
      }
      newTableSchema = tableSchema.copy(calculatedColumns = tableSchema.calculatedColumns :+ newCalcColumn)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r

  override def updateCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean] = {
    for {
      tableSchema <- getTableSchema(organizationId, dbName, tblName)
      isColExisted = findCalcColumn(tableSchema, newCalcColumn.name) match {
        case Some(col) =>
        case None =>
          throw BadRequestError(
            s"calculated column with name ${newCalcColumn.name} does not exist in ${tableSchema.dbName}.${tableSchema.name}"
          )
      }
      newExprColumns =
        tableSchema.calculatedColumns.map(c => if (c.name.equals(newCalcColumn.name)) newCalcColumn else c)
      newTableSchema = tableSchema.copy(calculatedColumns = newExprColumns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r
  }

  override def dropCalculatedColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] =
    for {
      tableSchema <- getTableSchema(organizationId, dbName, tblName)
      isColExisted = findCalcColumn(tableSchema, columnName) match {
        case Some(col) =>
        case None =>
          throw BadRequestError(
            s"calculated column with name $columnName does not exist in ${tableSchema.dbName}.${tableSchema.name}"
          )
      }
      newExprColumns = tableSchema.calculatedColumns.filterNot(_.name.equals(columnName))
      newTableSchema = tableSchema.copy(calculatedColumns = newExprColumns)
      r <- addTable(organizationId, dbName, newTableSchema)
    } yield r

  private def _addTable(dbSchema: DatabaseSchema, tableInfo: TableSchema): DatabaseSchema = {
    dbSchema.copy(
      tables = dbSchema.tables.filterNot(_.name == tableInfo.name) ++ Seq(tableInfo)
    )
  }

  private def findCalcColumn(tableSchema: TableSchema, colName: String): Option[Column] = {
    tableSchema.calculatedColumns.find(_.name == colName)
  }
}
