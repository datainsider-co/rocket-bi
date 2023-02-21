package datainsider.analytics.repository

import com.twitter.util.Future
import datainsider.client.exception.InternalError
import datainsider.client.util.ZConfig
import datainsider.ingestion.domain.{Column, DatabaseSchema, TableSchema}
import datainsider.ingestion.repository.SchemaRepository
import datainsider.ingestion.util.Implicits.ImplicitString

@deprecated("this is old tracking mechanism")
trait OrgSchemaRepository {
  def getDatabase(organizationId: Long): Future[DatabaseSchema]

  def existsDatabase(organizationId: Long): Future[Boolean]

  def createDatabase(organizationId: Long): Future[Unit]

  def getTable(organizationId: Long, tblName: String): Future[Option[TableSchema]]

  def multiGetTable(organizationId: Long, tableNames: Seq[String]): Future[Map[String, TableSchema]]
}

trait TrackingSchemaRepository extends OrgSchemaRepository {

  def createEventTable(organizationId: Long, event: String, columns: Seq[Column]): Future[TableSchema]

  def createProfileTable(organizationId: Long, columns: Seq[Column]): Future[TableSchema]

  def getProfileTable(organizationId: Long): Future[TableSchema]

  def getEventTable(organizationId: Long): Future[TableSchema]

  def getEventDetailTable(organizationId: Long, event: String): Future[Option[TableSchema]]

  def multiGetEventDetailTables(organizationId: Long, events: Seq[String]): Future[Map[String, TableSchema]]
}

case class TrackingSchemaRepositoryImpl(
    schemaRepository: SchemaRepository
) extends TrackingSchemaRepository {

  private def getTrackingDbName(orgId: Long): String = {
    val trackingDbPrefix = ZConfig.getString("analytics.tracking_db_prefix")
    trackingDbPrefix + orgId
  }

  override def getDatabase(organizationId: Long): Future[DatabaseSchema] = {
    schemaRepository.getDatabaseSchema(organizationId, getTrackingDbName(organizationId))
  }

  override def existsDatabase(organizationId: Long): Future[Boolean] = {
    val dbName = getTrackingDbName(organizationId)
    schemaRepository.isDatabaseExists(organizationId, dbName)
  }

  override def createDatabase(organizationId: Long): Future[Unit] = {
    val dbName = getTrackingDbName(organizationId)
    schemaRepository
      .createDatabase(organizationId, dbName, "Analytics")
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

  override def createEventTable(
      organizationId: Long,
      eventName: String,
      columns: Seq[Column]
  ): Future[TableSchema] = {
    val schema = TableSchema(
      name = eventName,
      dbName = getTrackingDbName(organizationId),
      organizationId = organizationId,
      displayName = eventName.asPrettyDisplayName,
      columns = columns,
      partitionBy = Seq(s"tuple()")
    )
    createOrUpdateSchema(schema)
  }

  override def createProfileTable(organizationId: Long, columns: Seq[Column]): Future[TableSchema] = {
    ???
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

  override def getProfileTable(organizationId: Long): Future[TableSchema] = {
    ???
  }

  override def getEventTable(organizationId: Long): Future[TableSchema] = {
    ???
  }

  override def getEventDetailTable(organizationId: Long, event: String): Future[Option[TableSchema]] = {
    getTable(organizationId, event)
  }

  override def multiGetEventDetailTables(
      organizationId: Long,
      events: Seq[String]
  ): Future[Map[String, TableSchema]] = {
    multiGetTable(organizationId, events)
  }

}
