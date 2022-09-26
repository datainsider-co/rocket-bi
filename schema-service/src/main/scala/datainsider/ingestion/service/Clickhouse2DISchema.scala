package datainsider.ingestion.service

import com.twitter.util.Future
import com.twitter.util.logging.Logging

import datainsider.ingestion.domain.RefreshStatus.RefreshStatus
import datainsider.ingestion.domain._
import datainsider.ingestion.repository.{ClickhouseMetaDataHandler, SchemaMetadataStorage}
import datainsider.ingestion.util.Implicits.FutureEnhance
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * created 2022-07-19 11:21 AM
  *
  * @author tvc12 - Thien Vi
  */

/**
  * Class dam nhiem vu lay schema tu clickhouse convert ve schema cua DI System
  */
class Clickhouse2DISchema(
   organizationId: Long,
   clickhouseMetaDataHandler: ClickhouseMetaDataHandler,
   storage: SchemaMetadataStorage,
   refreshConfig: RefreshConfig,
   setRefreshStatus: (RefreshStatus, Option[String]) => Future[Unit]
) extends Logging {

  def run(): Unit =
    Profiler("[Clickhouse2DISchema].run") {
      try {
        val clickhouseDbNames = clickhouseMetaDataHandler.getDatabaseNames()
        dropUnknownDatabase(organizationId, clickhouseDbNames)
        clickhouseDbNames.foreach(dbName => {
          try {
            val tableSchemas: Seq[TableSchema] = clickhouseMetaDataHandler.getTables(organizationId, dbName, refreshConfig.ignoredEngines)
            ensureDatabase(organizationId, dbName, tableSchemas)
          } catch {
            case ex: Throwable =>
              logger.error("Error when getting tables from clickhouse", ex)
            // ignore tables
          }
        })
        setRefreshStatus(RefreshStatus.Success, None).syncGet()
      } catch {
        case ex: Throwable =>
          logger.error("Error when getting databases from clickhouse", ex)
          setRefreshStatus(RefreshStatus.Error, Some(ex.getMessage)).syncGet()
      }
    }

  /**
    * Drop all unknown databases in di-system
    */
  private def dropUnknownDatabase(organizationId: Long, clickhouseDbNames: Seq[String]): Unit = {
    try {
      val databaseSchemas: Seq[DatabaseSchema] = storage.getDatabases(organizationId).syncGet()
      val unknownDatabases = databaseSchemas.map(_.name).diff(clickhouseDbNames)
      val result: Seq[Future[Boolean]] = unknownDatabases.map(dbName => storage.deleteDatabaseSchema(organizationId, dbName))
      logger.info(s"find tables ${databaseSchemas.size}, drop ${unknownDatabases.size} unknown databases")
      Future.collect(result).syncGet()
    } catch {
      case ex: Throwable => logger.error("Error when drop unknown databases in di-system", ex)
    }
  }

  private def ensureDatabase(
      organizationId: Long,
      dbName: String,
      clickhouseTableSchemas: Seq[TableSchema]
  ): Unit = {
    val isDatabaseExisted = storage.hasDatabaseSchema(organizationId, dbName).syncGet()
    if (isDatabaseExisted) {
      val diDatabaseSchema: DatabaseSchema = storage.getDatabaseSchema(organizationId, dbName).syncGet()
      val finalDatabaseSchema: DatabaseSchema = diDatabaseSchema.copy(
        tables = mergeTableSchemas(clickhouseTableSchemas, diDatabaseSchema.tables),
        updatedTime = System.currentTimeMillis()
      )
      storage.addDatabase(organizationId, finalDatabaseSchema).syncGet()
    } else {
      storage
        .addDatabase(
          organizationId,
          DatabaseSchema(
            dbName,
            organizationId,
            displayName = dbName,
            createdTime = System.currentTimeMillis(),
            updatedTime = System.currentTimeMillis(),
            tables = clickhouseTableSchemas
          )
        )
        .syncGet()
    }
  }

  private def mergeTableSchemas(
      clickhouseTableSchemas: Seq[TableSchema],
      diTableSchemas: Seq[TableSchema]
  ): Seq[TableSchema] = {
    val clickhouseTableSchemaAsMap: Map[String, TableSchema] = clickhouseTableSchemas.map(tableSchema => tableSchema.name -> tableSchema).toMap
    val diTableSchemaAsMap = diTableSchemas.map(tableSchema => tableSchema.name -> tableSchema).toMap
    val allTableNames: Set[String] = clickhouseTableSchemaAsMap.keys.toSet.union(diTableSchemaAsMap.keys.toSet)
    val tableSchemas: Seq[TableSchema] = allTableNames
      .map(tableName => {
        val clickhouseTableSchema: Option[TableSchema] = clickhouseTableSchemaAsMap.get(tableName)
        val diTableSchema: Option[TableSchema] = diTableSchemaAsMap.get(tableName)
        (clickhouseTableSchema, diTableSchema) match {
          case (Some(clickhouseTableSchema), Some(diTableSchema)) =>
            logger.info(s"find table in both clickhouse and di-system ${clickhouseTableSchema.name}")
            Some(mergeTableSchema(clickhouseTableSchema, diTableSchema))
          case (Some(tableSchema), None) =>
            logger.info(s"find table in clickhouse ${tableSchema.name}")
            Some(tableSchema)
          case (None, Some(tableSchema)) =>
            logger.info(s"Table schema ${tableName} not found in clickhouse, but found in DI System, will remove it")
            None
          case (None, None) =>
            logger.warn(s"Table ${tableName} not found in clickhouse and di system")
            None
        }
      })
      .filter(_.isDefined)
      .map(_.get)
      .toSeq
    tableSchemas
  }

  /**
    * Merge 2 table schemas
    * @param clickhouseTableSchema from clickhouse
    * @param diTableSchema ssdb
    */
  private def mergeTableSchema(clickhouseTableSchema: TableSchema, diTableSchema: TableSchema): TableSchema = {
    diTableSchema.copy(
      columns = mergeColumns(clickhouseTableSchema.columns, diTableSchema.columns)
    )
  }

  /**
   * Merge columns from clickhouse to di-system, keep meta data from di-system
   */
  private def mergeColumns(clickhouseColumns: Seq[Column], diColumns: Seq[Column]): Seq[Column] = {
    val diColumnsMap: Map[String, Column] = diColumns.map(column => column.name -> column).toMap
    clickhouseColumns.map(clickhouseColumn => {
      diColumnsMap.get(clickhouseColumn.name) match {
        case Some(diColumn) => diColumn
        case _ => clickhouseColumn
      }
    })
  }
}
