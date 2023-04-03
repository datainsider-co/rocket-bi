package datainsider.ingestion.repository

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception._
import datainsider.client.util.ByKeyAsyncMutex
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.ingestion.domain.{Column, DatabaseSchema, DatabaseShortInfo, TableSchema}
import datainsider.ingestion.util.Implicits.ScalaFutureLike
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

  def isExists(organizationId: Long, dbName: String): Future[Boolean]

  def hardDelete(organizationId: Long, dbName: String): Future[Boolean]

  def hasDatabaseSchema(organizationId: Long, dbName: String): Future[Boolean]

  def isExists(organizationId: Long, dbName: String, tblName: String, colNames: Seq[String]): Future[Boolean]

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
  * @param allDatabaseMap Chứa toàn bộ database của hệ thống, không phân chia theo org
  */
case class SchemaMetadataStorageImpl(client: SSDB, allDatabaseMap: KVS[String, DatabaseSchema], prefixDb: String)
    extends SchemaMetadataStorage
    with Logging {

  implicit val ec: ExecutionContextExecutor = ExecutionContext.global
  private val mutex = ByKeyAsyncMutex()

  /**
    * chứa thông tin danh sách database theo từng org
    */
  private def getDatabaseSet(organizationId: Long): SsdbSortedSet = {
    SsdbSortedSet(s"$prefixDb.$organizationId.databases", client)
  }

  /**
    * chứa thông tin danh sách trash database theo từng org
    */
  private def getTrashDatabaseSet(organizationId: Long): SsdbSortedSet = {
    SsdbSortedSet(s"$prefixDb.$organizationId.deleted_databases", client)
  }

  /**
    * Add database to SSDB KVS
    * Add database's name to database list of the current organization
    * @return
    */
  override def addDatabase(organizationId: Long, dbSchema: DatabaseSchema): Future[Boolean] = {
    val databaseAsSet: SsdbSortedSet = getDatabaseSet(organizationId)
    val isSuccess = for {
      addOK <- allDatabaseMap.add(dbSchema.name, dbSchema)
      addOrgDbOK <- databaseAsSet.add(dbSchema.name, System.currentTimeMillis())
    } yield (addOK && addOrgDbOK)
    isSuccess.asTwitter
  }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    getDbNames(organizationId)
      .flatMap(getDatabaseSchemas)
  }

  override def getDatabaseShortInfos(organizationId: Long): Future[Seq[DatabaseShortInfo]] = {
    getDatabases(organizationId).map(_.asDatabaseShortInfo())
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
    allDatabaseMap
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

  override def isExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      colNames: Seq[String]
  ): Future[Boolean] = {
    getDatabaseSchema(organizationId, dbName)
      .map(_.findTableAsOption(tblName))
      .map {
        case Some(table) =>
          if (colNames.nonEmpty) {
            colNames.forall(table.columns.map(_.name).toSet.contains)
          } else true
        case None => false
      }
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    databaseAsSet
      .get(dbName)
      .flatMap {
        case Some(_) => allDatabaseMap.get(dbName)
        case _       => concurrent.Future.successful(None)
      }
      .map {
        case None           => throw DbNotFoundError(s"this database was not found: $dbName")
        case Some(dbSchema) => dbSchema
      }
      .asTwitter
  }

  override def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]] = {
    val databaseAsSet = getDatabaseSet(organizationId)
    for {
      databaseSchemas <- databaseAsSet.mget(dbNames.toArray).map(_.getOrElse(Map.empty)).asTwitter
      databaseNamesExisted = databaseSchemas.keys.toArray
      databaseSchema <- allDatabaseMap.multiGet(databaseNamesExisted).map(_.getOrElse(Map.empty)).asTwitter
    } yield databaseSchema.values.toSeq
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(dbName: String): Future[DatabaseSchema] = {
    allDatabaseMap
      .get(dbName)
      .map {
        case None           => throw DbNotFoundError(s"this database was not found: $dbName")
        case Some(dbSchema) => dbSchema
      }
      .asTwitter
  }

  override def isExists(organizationId: Long, dbName: String): Future[Boolean] = {
    allDatabaseMap.get(dbName).map(_.isDefined).asTwitter
  }

  override def hardDelete(organizationId: Long, dbName: String): Future[Boolean] = {
    lockDatabase(dbName) {
      val databaseAsSet: SsdbSortedSet = getDatabaseSet(organizationId)
      val trashAsSet: SsdbSortedSet = getTrashDatabaseSet(organizationId)
      val result = for {
        isDeleted <- databaseAsSet.remove(dbName)
        isTrashRemoved <- trashAsSet.remove(dbName)
        isRemoved <- allDatabaseMap.remove(dbName)
      } yield {
        logger.info(
          s"drop databases $dbName isDeleted: ${isDeleted}, trashDeleted ${isTrashRemoved}, isRemoved ${isRemoved}"
        )
        isRemoved
      }
      result.asTwitter
    }
  }

  private def lockDatabase[T](dbName: String)(f: => Future[T]): Future[T] = {
    mutex.acquireAndRun(key = dbName) {
      f
    }
  }

  override def addTable(organizationId: Long, dbName: String, tableSchema: TableSchema): Future[Boolean] =
    synchronized {
      lockDatabase(dbName) {
        for {
          dbSchema <- getDatabaseSchema(organizationId, dbName)
          newDbSchema: DatabaseSchema = dbSchema.addTable(tableSchema)
          isDatabaseUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
        } yield isDatabaseUpdated
      }
    }

  override def dropTable(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        newDbSchema: DatabaseSchema = dbSchema.remove(tblName)
        isDatabaseUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDatabaseUpdated
    }
  }

  override def renameTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        newDbSchema = updateTblName(dbSchema, tblName, newTblName)
        isDatabaseUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDatabaseUpdated
    }
  }

  private def updateTblName(dbSchema: DatabaseSchema, oldTblName: String, newTblName: String): DatabaseSchema = {
    val newTables: Seq[TableSchema] = dbSchema.tables.map(table => {
      if (table.name.trim == oldTblName.trim) {
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
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        newTableSchema: TableSchema = tableSchema.copy(columns = tableSchema.columns ++ newColumns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDatabaseUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDatabaseUpdated
    }
  }

  override def addOrUpdateColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        newTableSchema: TableSchema = tableSchema.copyAsMergeMultipleColumns(columns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  override def dropColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        newColumns: Seq[Column] = tableSchema.columns.filterNot(_.name.equals(columnName))
        newTableSchema: TableSchema = tableSchema.copy(columns = newColumns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
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
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        newColumns: Seq[Column] = tableSchema.columns.map(c => if (c.name.equals(newCol.name)) newCol else c)
        newTableSchema: TableSchema = tableSchema.copy(columns = newColumns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  override def removeDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    lockDatabase(dbName) {
      val trashDatabaseAsSet = getTrashDatabaseSet(organizationId)
      val databaseAsSet = getDatabaseSet(organizationId)
      for {
        removeOK <- databaseAsSet.remove(dbName).asTwitter
        addOrgTrashDbOK <- trashDatabaseAsSet.add(dbName, System.currentTimeMillis()).asTwitter
      } yield (removeOK && addOrgTrashDbOK)
    }
  }

  override def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    lockDatabase(dbName) {
      val trashDatabaseAsSet = getTrashDatabaseSet(organizationId)
      val databaseAsSet = getDatabaseSet(organizationId)
      for {
        removeTrashOK <- trashDatabaseAsSet.remove(dbName).asTwitter
        addOrgDbOK <- databaseAsSet.add(dbName, System.currentTimeMillis()).asTwitter
      } yield (removeTrashOK && addOrgDbOK)
    }
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
      organizationId: OrganizationId,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Option[Column]] = {
    for {
      dbSchema <- getDatabaseSchema(organizationId, dbName)
      tableSchema = dbSchema.findTable(tblName)
    } yield findExprColumn(tableSchema, columnName)
  }

  override def addExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        _ = findExprColumn(tableSchema, newExpColumn.name) match {
          case Some(col) =>
            throw BadRequestError(
              s"expression column with name ${newExpColumn.name} already exists in ${tableSchema.dbName}.${tableSchema.name}"
            )
          case None =>
        }
        newTableSchema: TableSchema =
          tableSchema.copy(expressionColumns = (tableSchema.expressionColumns :+ newExpColumn).distinct)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  override def updateExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        _ = findExprColumn(tableSchema, newExpColumn.name) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"expression column with name ${newExpColumn.name} does not exist in ${tableSchema.dbName}.${tableSchema.name}"
            )
        }
        newExprColumns: Seq[Column] =
          tableSchema.expressionColumns.map(c => if (c.name.equals(newExpColumn.name)) newExpColumn else c)
        newTableSchema: TableSchema = tableSchema.copy(expressionColumns = newExprColumns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  override def dropExpressionColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        _ = findExprColumn(tableSchema, columnName) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"expression column with name $columnName does not exist in ${tableSchema.dbName}.${tableSchema.name}"
            )
        }
        newExprColumns: Seq[Column] = tableSchema.expressionColumns.filterNot(_.name.equals(columnName))
        newTableSchema: TableSchema = tableSchema.copy(expressionColumns = newExprColumns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  override def addCalculatedColumn(
      organizationId: OrganizationId,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        _ = findCalcColumn(tableSchema, newCalcColumn.name) match {
          case Some(col) =>
            throw BadRequestError(
              s"calculated column with name ${newCalcColumn.name} already exists in ${tableSchema.dbName}.${tableSchema.name}"
            )
          case None =>
        }
        newTableSchema: TableSchema =
          tableSchema.copy(calculatedColumns = (tableSchema.calculatedColumns :+ newCalcColumn).distinct)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  override def updateCalculatedColumn(
      organizationId: OrganizationId,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        _ = findCalcColumn(tableSchema, newCalcColumn.name) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"calculated column with name ${newCalcColumn.name} does not exist in ${tableSchema.dbName}.${tableSchema.name}"
            )
        }
        newExprColumns: Seq[Column] =
          tableSchema.calculatedColumns.map(c => if (c.name.equals(newCalcColumn.name)) newCalcColumn else c)
        newTableSchema: TableSchema = tableSchema.copy(calculatedColumns = newExprColumns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  override def dropCalculatedColumn(
      organizationId: OrganizationId,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    lockDatabase(dbName) {
      for {
        dbSchema <- getDatabaseSchema(organizationId, dbName)
        tableSchema: TableSchema = dbSchema.findTable(tblName)
        _ = findCalcColumn(tableSchema, columnName) match {
          case Some(col) =>
          case None =>
            throw BadRequestError(
              s"calculated column with name $columnName does not exist in ${tableSchema.dbName}.${tableSchema.name}"
            )
        }
        newExprColumns: Seq[Column] = tableSchema.calculatedColumns.filterNot(_.name.equals(columnName))
        newTableSchema: TableSchema = tableSchema.copy(calculatedColumns = newExprColumns)
        newDbSchema: DatabaseSchema = dbSchema.addTable(newTableSchema)
        isDbUpdated <- allDatabaseMap.add(dbName, newDbSchema).asTwitter
      } yield isDbUpdated
    }
  }

  private def findExprColumn(tableSchema: TableSchema, colName: String): Option[Column] = {
    tableSchema.expressionColumns.find(_.name == colName)
  }

  private def findCalcColumn(tableSchema: TableSchema, colName: String): Option[Column] = {
    tableSchema.calculatedColumns.find(_.name == colName)
  }
}
