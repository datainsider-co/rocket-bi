package datainsider.analytics.service.actors

import akka.actor.Actor
import com.fasterxml.jackson.databind.JsonNode
import com.github.nscala_time.time.Imports.richInt
import com.twitter.inject.Logging
import datainsider.analytics.domain.commands.{TrackingEvent, TrackProfileCommand}
import datainsider.analytics.domain.EventColumnIds
import datainsider.analytics.service.actors.SampleDatasetGeneratorActor.GenerateTrackingDatasetEvent
import datainsider.analytics.service.tracking.TrackingService
import datainsider.client.util.JsonParser
import datainsider.ingestion.util.Implicits.{FutureEnhance, ImplicitString}
import org.apache.commons.io.FileUtils
import org.nutz.ssdb4j.spi.SSDB

import java.io.File
import scala.jdk.CollectionConverters.asScalaIteratorConverter
import scala.util.Random

@deprecated("no longer used")
object SampleDatasetGeneratorActor {
  case class GenerateTrackingDatasetEvent()
}

@deprecated("no longer used")
case class SampleDatasetGeneratorActor(
    client: SSDB,
    trackingApiKey: String,
    trackingService: TrackingService
) extends Actor
    with Logging {

  override def receive: Receive = {
    case GenerateTrackingDatasetEvent() =>
      if (isNeedGenerateUserAndEvents()) {
        generateUserAndEvents()
      }
    case x => logger.error(s"Received an unknown message: $x")
  }

  private def generateUserAndEvents() = {
    try {
      logger.info("Begin generateUserAndEvents")
      val userMapEvents = readUserAndEventData()
      generateUsers(userMapEvents.keys.toSeq)
      generateUserEvents(userMapEvents.values.toSeq.flatten)
      markUserAndEventGenerated(1)
    } catch {
      case _ => markUserAndEventGenerated(0)
    } finally {
      logger.info("End generateUserAndEvents")
    }
  }

  private def readUserAndEventData(): Map[TrackProfileCommand, Seq[TrackingEvent]] = {
    def parseTrackProfileCommand(node: JsonNode) = {
      val userId = node.at("/user_id").asText()
      val properties = JsonParser.fromJson[Map[String, Any]](node.at("/properties").toString)
      TrackProfileCommand(
        organizationId = 1,
        trackingApiKey = trackingApiKey,
        userId = userId,
        properties = properties
      )
    }

    val json = JsonParser.readTree(FileUtils.readFileToString(new File("sql/user.activities.json"), "UTF-8"))

    json
      .at("/users")
      .elements()
      .asScala
      .map(parseTrackProfileCommand)
      .map(command => command -> readEventCommands(json, command.userId))
      .toMap
  }

  private def readEventCommands(json: JsonNode, userId: String): Seq[TrackingEvent] = {
    def randomNextTime(time: Long): Long = {
      time + Random.nextInt(120).minutes.millis
    }

    def parseTrackEventCommand(node: JsonNode, time: Long) = {
      val event = node.at("/event").asText().asEventName
      val properties = JsonParser.fromJson[Map[String, Any]](node.at("/properties").toString) ++ Map(
        EventColumnIds.USER_ID -> userId,
        EventColumnIds.TIME -> time
      )
      TrackingEvent(
        name = event,
        properties = properties
      )
    }

    var time = System.currentTimeMillis() - 2.days.getMillis
    json
      .at("/events")
      .elements()
      .asScala
      .map(node => {
        time = randomNextTime(time)
        parseTrackEventCommand(node, time)
      })
      .toSeq
  }

  private def generateUsers(data: Seq[TrackProfileCommand]) = {
    logger.info(s"Begin generateUsers: ${data.size} users")
    data.foreach(command => {
      trackingService.trackProfile(command).syncGet()
      logger.info(s"Generated Users: $command")
    })
  }

  private def generateUserEvents(eventCommands: Seq[TrackingEvent]) = {
    logger.info(s"Begin generateUserEvents: ${eventCommands.size} events")
    eventCommands.foreach { command =>
      trackingService
        .track(0L, command)
        .syncGet()
      logger.info(s"Generated Event: ${command}")
    }
  }

  private def isNeedGenerateUserAndEvents(): Boolean = {
    val r = client.get("di.sample.dataset")
    r.notFound() || !r.ok() || r.asInt() <= 0
  }

  private def markUserAndEventGenerated(count: Int): Boolean = {
    client.set("di.sample.dataset", count).ok()
  }
}
