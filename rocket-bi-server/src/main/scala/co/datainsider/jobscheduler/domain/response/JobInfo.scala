package co.datainsider.jobscheduler.domain.response

import co.datainsider.bi.domain.Connection
import co.datainsider.jobscheduler.domain.Ids.SyncId
import co.datainsider.jobscheduler.domain.job.Job
import co.datainsider.jobscheduler.domain.source.DataSource
import co.datainsider.caas.user_profile.domain.user.ShortUserProfile

case class JobInfo(job: Job, source: Option[DataSource], creator: Option[ShortUserProfile])

case class NextJobResponse(hasJob: Boolean, data: Option[SyncInfo])

case class SyncInfo(syncId: SyncId, job: Job, source: Option[DataSource], connection: Connection)
