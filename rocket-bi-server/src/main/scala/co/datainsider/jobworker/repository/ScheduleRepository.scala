package co.datainsider.jobworker.repository

import co.datainsider.jobworker.client.HttpClient
import co.datainsider.jobworker.domain.JobProgress
import co.datainsider.jobworker.domain.response.NextJobResponse
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future

trait ScheduleRepository {
  def getJob: Future[NextJobResponse]

  def reportJob(jobProgress: JobProgress): Future[Boolean]
}

class HttpScheduleRepository @Inject() (client: HttpClient, @Named("access-token") accessToken: String)
    extends ScheduleRepository {
  override def getJob: Future[NextJobResponse] =
    Future {
      client.get[NextJobResponse]("/schedule/job/next", Seq(("access-token", accessToken)))
    }

  override def reportJob(jobProgress: JobProgress): Future[Boolean] = {
    Future {
      val resp: Map[String, Boolean] = client
        .post[Map[String, Boolean], JobProgress](
          "/schedule/job/report",
          jobProgress,
          Seq(("access-token", accessToken))
        )
      resp("success")
    }
  }
}
