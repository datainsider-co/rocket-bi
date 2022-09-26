package datainsider.analytics.repository

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.analytics.domain.{AnalyticsConfig, EventData, ProfileColumnIds, TrackingProfile}
import datainsider.analytics.misc
import datainsider.analytics.misc.TrackingProfileConverter
import datainsider.ingestion.domain._
import datainsider.ingestion.misc.parser.{ClickHouseDataParser, DataParser}
import datainsider.ingestion.repository.DataRepository

/**
  * @author andy
  * @since 7/10/20
  */

@deprecated("use TrackingRepository instead")
trait TrackingDataRepository {
  def exists(organizationId: Long, userId: String): Future[Boolean]

  def insertOrUpdateProfile(organizationId: Long, trackingProfile: TrackingProfile): Future[Boolean]

  def insertProfile(organizationId: Long, trackingProfile: TrackingProfile): Future[Boolean]

  def updateProfile(organizationId: Long, trackingProfile: TrackingProfile): Future[Boolean]

  /**
    * insert a single event to event table and event detail table
    * @param organizationId organization id
    * @param eventData tracked record
    * @return
    */
  def insertTrackingEvent(organizationId: Long, eventData: EventData): Future[Boolean]

  /**
    * write events into event table and specific event detail table, depend on name of event
    * IMPORTANT: this events list need to be the same type (same event.name) to be inserted
    * @param organizationId organization id, temporary set to 1
    * @param events list of events
    * @return
    */
  def insertTrackingEvent(organizationId: Long, events: Seq[EventData]): Future[Boolean]
}

@deprecated("no longer used")
case class ClickHouseTrackingDataRepository(
    config: AnalyticsConfig,
    dataRepository: DataRepository,
    trackingSchemaRepository: TrackingSchemaRepository
) extends TrackingDataRepository
    with Logging {

  override def exists(organizationId: Long, userId: String): Future[Boolean] = {
    dataRepository.exists(
      config.getTrackingDbName(organizationId),
      config.trackingProfileTbl,
      Map(
        ProfileColumnIds.USER_ID -> userId
      )
    )
  }

  override def insertOrUpdateProfile(organizationId: Long, trackingProfile: TrackingProfile): Future[Boolean] = {
    for {
      exists <- exists(organizationId, trackingProfile.userId)
      r <- exists match {
        case true => updateProfile(organizationId, trackingProfile)
        case _    => insertProfile(organizationId, trackingProfile)
      }
    } yield r
  }

  override def insertProfile(organizationId: Long, trackingProfile: TrackingProfile): Future[Boolean] = {
    for {
      schema <- trackingSchemaRepository.getProfileTable(organizationId)
      record = TrackingProfileConverter.toRecord(schema, trackingProfile)
      r <- dataRepository.writeRecords(schema, Seq(record), 500)
    } yield {
      r > 0
    }
  }

  override def updateProfile(organizationId: Long, trackingProfile: TrackingProfile): Future[Boolean] = {
    for {
      schema <- trackingSchemaRepository.getProfileTable(organizationId)
      updatingMap = misc.TrackingProfileConverter.toUpdatedColumnMap(schema, trackingProfile)
      _ <- dataRepository.update(
        schema.dbName,
        schema.name,
        Map(ProfileColumnIds.USER_ID -> trackingProfile.userId),
        updatingMap
      )
    } yield true
  }

  override def insertTrackingEvent(organizationId: Long, eventData: EventData): Future[Boolean] = {
    for {
      eventSchema <- trackingSchemaRepository.getEventTable(organizationId)
      eventDetailSchema <- trackingSchemaRepository.getEventDetailTable(organizationId, eventData.name)
      fns = Seq(
        writeEvent(eventSchema, eventData.properties),
        writeEvent(eventDetailSchema.get, eventData.detailProperties)
      )
      savedRows <- Future.collect(fns).map(_.sum)
    } yield savedRows > 0
  }

  private def writeEvent(schema: TableSchema, properties: Map[String, Any]): Future[Int] = {
    val result: DataParser.Result = ClickHouseDataParser(schema).parseRecord(properties)
    dataRepository.writeRecords(schema, result.records, 500)
  }

  override def insertTrackingEvent(organizationId: Long, events: Seq[EventData]): Future[Boolean] = {
    if (events.nonEmpty) {
      for {
        eventSchema <- trackingSchemaRepository.getEventTable(organizationId)
        eventDetailSchema <- trackingSchemaRepository.getEventDetailTable(organizationId, events.head.name)
        fns = Seq(
          writeEvent(eventSchema, events.map(_.properties)),
          writeEvent(eventDetailSchema.get, events.map(_.detailProperties))
        )
        savedRows <- Future.collect(fns).map(_.sum)
      } yield savedRows > 0
    } else {
      Future.True
    }
  }

  private def writeEvent(schema: TableSchema, eventsProps: Seq[Map[String, Any]]): Future[Int] = {
    val result: DataParser.Result = ClickHouseDataParser(schema).parseRecords(eventsProps)
    dataRepository.writeRecords(schema, result.records, 500)
  }
}
