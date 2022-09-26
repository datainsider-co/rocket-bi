package datainsider.analytics.repository

import com.twitter.util.Future
import datainsider.analytics.domain.AnalyticsConfig
import datainsider.analytics.misc.TableFactory
import datainsider.client.exception.InternalError
import datainsider.ingestion.domain.{DatabaseSchema, TableSchema}
import datainsider.ingestion.repository.SchemaRepository

@deprecated("this is old tracking mechanism")
trait ReportSchemaRepository extends OrgSchemaRepository {

  def createUserCollectionTable(organizationId: Long): Future[TableSchema]

  def createReportActiveUserMetricTbl(organizationId: Long): Future[TableSchema]
}

@deprecated("no longer used")
case class ReportSchemaRepositoryImpl(
   config: AnalyticsConfig,
   tableFactory: TableFactory,
   schemaRepository: SchemaRepository
) extends ReportSchemaRepository {

  override def getDatabase(organizationId: Long): Future[DatabaseSchema] = {
    schemaRepository.getDatabaseSchema(organizationId, config.getReportDbName(organizationId))
  }

  override def existsDatabase(organizationId: Long): Future[Boolean] = {
    val dbName = config.getReportDbName(organizationId)
    schemaRepository.isDatabaseExists(organizationId, dbName)
  }

  override def createDatabase(organizationId: Long): Future[Unit] = {
    val dbName = config.getReportDbName(organizationId)
    schemaRepository
      .createDatabase(organizationId, dbName, "Analytics Report")
      .flatMap(_ => Future.Unit)
  }

  override def getTable(organizationId: Long, tblName: String): Future[Option[TableSchema]] = {
    getDatabase(organizationId).map(_.findTableAsOption(tblName))
  }

  override def multiGetTable(
      organizationId: Long,
      tableNames: Seq[String]
  ): Future[Map[String, TableSchema]] = {
    val getTableAsMap = (dbSchema: DatabaseSchema) => {
      tableNames
        .map(dbSchema.findTableAsOption(_))
        .filterNot(_.isEmpty)
        .map(_.get)
        .map(schema => schema.name -> schema)
        .toMap
    }
    getDatabase(organizationId).map(getTableAsMap)
  }

  override def createUserCollectionTable(
      organizationId: Long
  ): Future[TableSchema] = {
    val schema = tableFactory.buildUserCollectionTbl(organizationId)
    createOrUpdateSchema(schema)
  }

  override def createReportActiveUserMetricTbl(organizationId: Long): Future[TableSchema] = {
    val schema = tableFactory.buildReportActiveUserMetricTbl(organizationId)
    createOrUpdateSchema(schema)
  }

  private def createOrUpdateSchema(schema: TableSchema) = {
    schemaRepository.createTableOrOverrideSchema(schema).map {
      case true => schema
      case _ =>
        throw InternalError(
          s"Can't create table: ${schema.dbName}.${schema.name} for organization ${schema.organizationId}"
        )
    }
  }

}
