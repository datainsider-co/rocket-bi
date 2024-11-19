package co.datainsider.schema.client

import co.datainsider.schema.domain.responses.TableExpressionsResponse
import co.datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo, TableSchema}
import com.google.common.cache.{CacheBuilder, CacheLoader}
import com.twitter.util.Future
import co.datainsider.bi.util.Implicits.{FutureEnhance, async}
import co.datainsider.schema.domain.requests.TableFromQueryInfo

import java.util.concurrent.TimeUnit
import javax.inject.Inject

class SchemaClientServiceWithCache @Inject() (
    schemaClientService: SchemaClientService,
    maxCacheSize: Long = 1000,
    maxExpireTime: Long = 60
) extends SchemaClientService {
  override def getDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]] = {
    schemaClientService.getDatabases(organizationId)
  }

  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    schemaClientService.getDatabaseSchema(organizationId, dbName)
  }

  override def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] = {
    schemaClientService.getTable(organizationId, dbName, tblName)
  }

  override def ensureDatabaseCreated(organizationId: Long, name: String, displayName: Option[String]): Future[Unit] = {
    schemaClientService.ensureDatabaseCreated(organizationId, name, displayName)
  }

  override def createOrMergeTableSchema(schema: TableSchema): Future[TableSchema] = {
    schemaClientService.createOrMergeTableSchema(schema)
  }

  override def renameTableSchema(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    schemaClientService.renameTableSchema(organizationId, dbName, tblName, newTblName)
  }

  override def deleteTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    schemaClientService.deleteTableSchema(organizationId, dbName, tblName)
  }

  override def getTemporaryTables(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    schemaClientService.getTemporaryTables(organizationId, dbName)
  }
  private case class MergeSchemaRequest(orgId: Long, dbName: String, tblName: String, properties: Map[String, Any]) {
    override def equals(that: Any): Boolean = {
      that match {
        case that: MergeSchemaRequest => orgId == that.orgId && dbName == that.dbName && tblName == that.tblName
        case _                        => false
      }
    }

    override def hashCode(): Int = {
      s"$orgId.$dbName.$tblName".hashCode
    }
  }

  private val mergeSchemaLoader = new CacheLoader[MergeSchemaRequest, TableSchema]() {
    override def load(key: MergeSchemaRequest): TableSchema = {
      schemaClientService.mergeSchemaByProperties(key.orgId, key.dbName, key.tblName, key.properties).syncGet()
    }
  }

  private val mergeSchemaCache = CacheBuilder
    .newBuilder()
    .maximumSize(maxCacheSize)
    .expireAfterWrite(maxExpireTime, TimeUnit.SECONDS)
    .build[MergeSchemaRequest, TableSchema](mergeSchemaLoader)

  override def mergeSchemaByProperties(
      organizationId: Long,
      dbName: String,
      tblName: String,
      properties: Map[String, Any]
  ): Future[TableSchema] =
    async {
      mergeSchemaCache.getUnchecked(MergeSchemaRequest(organizationId, dbName, tblName, properties))
    }

  private case class TableRequest(dbName: String, tblName: String)

  private val getExpressionsLoader = new CacheLoader[TableRequest, TableExpressionsResponse]() {
    override def load(key: TableRequest): TableExpressionsResponse = {
      schemaClientService.getExpressions(key.dbName, key.tblName).syncGet()
    }
  }

  private val getExpressionsCache = CacheBuilder
    .newBuilder()
    .maximumSize(maxCacheSize)
    .expireAfterWrite(maxExpireTime, TimeUnit.SECONDS)
    .build[TableRequest, TableExpressionsResponse](getExpressionsLoader)

  override def getExpressions(dbName: String, tblName: String): Future[TableExpressionsResponse] =
    async {
      getExpressionsCache.getUnchecked(TableRequest(dbName, tblName))
    }

  override def isDbExists(organizationId: Long, dbName: String, useDdlQuery: Boolean): Future[Boolean] = {
    schemaClientService.isDbExists(organizationId, dbName, useDdlQuery)
  }

  override def isTblExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnNames: Seq[String]
  ): Future[Boolean] = {
    schemaClientService.isTblExists(organizationId, dbName, tblName, columnNames)
  }

  override def deleteDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    schemaClientService.deleteDatabase(organizationId, dbName)
  }

  override def createTableSchema(schema: TableSchema): Future[TableSchema] = {
    schemaClientService.createTableSchema(schema)
  }

  override def createTableFromQueryInfo(orgId: Long, tableInfo: TableFromQueryInfo): Future[TableSchema] = {
    schemaClientService.createTableFromQueryInfo(orgId, tableInfo)
  }

  override def createDatabaseFromSchema(db: DatabaseSchema): Future[DatabaseSchema] = {
    schemaClientService.createDatabaseFromSchema(db)
  }
}
