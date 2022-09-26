package datainsider.analytics.service

import akka.actor.{Actor, ActorRef, Cancellable}
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.analytics.domain.JobInfo
import datainsider.analytics.repository.JobFactory
import datainsider.analytics.service.JobScheduler.{
  CreateNextScheduleAllOrg,
  CreateNextScheduleEvent,
  ScheduleAllOrgReports,
  WarmupUncompletedJobEvent
}
import datainsider.analytics.service.actors.StartSchedulerEvent
import datainsider.client.domain.Page
import datainsider.client.domain.org.Organization
import datainsider.client.service.OrgClientService
import datainsider.ingestion.util.Implicits.FutureEnhance
import datainsider.ingestion.util.TimeUtils

import java.util.TimeZone
import javax.inject.Named

@deprecated("no longer used")
object JobScheduler {
  case class SetupOrganizationReportSchedulerEvent()

  case class WarmupUncompletedJobEvent()

  case class CreateNextScheduleAllOrg()

  case class CreateNextScheduleEvent(organizationId: Long)

  case class ScheduleAllOrgReports(organizationId: Long)

}

trait OnScheduledTrigger {
  def onScheduled(id: String, scheduleTime: Long): Unit
}

case class OrganizationReportsTrigger @Inject() (@Named("job_scheduler_actor") jobSchedulerActor: ActorRef)
    extends OnScheduledTrigger
    with Logging {
  override def onScheduled(id: String, scheduleTime: Long): Unit = {
    info(s"onScheduled: $id schedule time= $scheduleTime")
    jobSchedulerActor ! ScheduleAllOrgReports(id.toLong)
  }
}

@deprecated("no longer used")
case class JobScheduler(
    jobFactory: JobFactory,
    organizationService: OrgClientService,
    jobInfoService: JobInfoService,
    queue: BaseScheduleQueue,
    jobRunnerActor: ActorRef
) extends Actor
    with Logging {
  import context._
  private var resetScheduler: Option[akka.actor.Cancellable] = None

  override def receive: Receive = {
    case _: StartSchedulerEvent                  => setupScheduler()
    case WarmupUncompletedJobEvent()             => rescheduleUncompletedJobs()
    case CreateNextScheduleAllOrg()              => startNextScheduleForAllOrg()
    case CreateNextScheduleEvent(organizationId) => createNextSchedule(organizationId)
    case ScheduleAllOrgReports(organizationId)   => scheduleAllOrgReports(organizationId)
    case x                                       => logger.error(s"Received an unknown message: $x")
  }

  private def setupScheduler(): Unit = {
    def createScheduler(): Cancellable = {
      import scala.concurrent.duration.DurationLong
      val (delay, _) = TimeUtils.durationToTomorrowCheckpoint(1, 0)
      val interval = 24.hours
      system.scheduler.scheduleAtFixedRate(delay.millis, interval)(() => {
        self ! CreateNextScheduleAllOrg()
      })
    }
    resetScheduler.foreach(_.cancel())
    resetScheduler = Some(createScheduler())

    self ! CreateNextScheduleAllOrg()
  }

  private def rescheduleUncompletedJobs(): Unit = {
    var from: Int = 0
    val size: Int = 500
    var response: Page[JobInfo] = Page.empty
    do {
      response = jobInfoService.getUncompletedJobInfos(from, size).syncGet()
      response.data.foreach(jobInfo => {
        jobRunnerActor ! JobRunnerActor.RunJobEvent(jobInfo)
      })
      from += response.data.size
    } while (from < response.total)
  }

  private def startNextScheduleForAllOrg(): Unit = {
    var from: Int = 0
    val size: Int = 500
    var organizationResponse: Page[Organization] = Page.empty
    do {
      organizationResponse = organizationService.getAllOrganizations(from, size).syncGet()
      organizationResponse.data.foreach(createNextSchedule(_))
      from += organizationResponse.data.size
    } while (from < organizationResponse.total)
  }

  private def createNextSchedule(organizationId: Long): Unit = {
    val organization = organizationService.getOrganization(organizationId).syncGet()
    createNextSchedule(organization)
  }

  private def createNextSchedule(organization: Organization): Unit = {
    val reportTimeZone = organization.reportTimeZoneId.map(TimeZone.getTimeZone(_))
    val (duration, checkpointTime) = TimeUtils.durationToTomorrowCheckpoint(1, 0, reportTimeZone)
    queue.enqueue(organization.organizationId.toString, checkpointTime)
  }

  /**
    * Currently only schedule Active User Report
    * @param organizationId
    */
  private def scheduleAllOrgReports(organizationId: Long): Unit = {
    val fn = for {
      organization <- organizationService.getOrganization(organizationId)
      jobInfo = createActiveUserJobInfo(organization)
      _ <- jobInfoService.addJobInfo(jobInfo)
    } yield {
      jobRunnerActor ! JobRunnerActor.RunJobEvent(jobInfo)
    }

    fn.rescue {
        case ex: Exception =>
          error(s"scheduleAllReports: $organizationId", ex)
          Future.Unit
      }
      .syncGet()
  }

  private def createActiveUserJobInfo(organization: Organization): JobInfo = {
    val reportTimeZone = organization.reportTimeZoneId.map(TimeZone.getTimeZone(_))
    val reportTime = TimeUtils.calcBeginOfSpecifiedDayInMills(-1, reportTimeZone)
    jobFactory.createActiveUserJobInfo(organization, reportTime)
  }
}
