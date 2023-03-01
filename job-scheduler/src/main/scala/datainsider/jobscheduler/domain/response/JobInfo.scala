package datainsider.jobscheduler.domain.response

import datainsider.client.domain.user.ShortUserProfile
import datainsider.jobscheduler.domain.DataSource
import datainsider.jobscheduler.domain.Ids.SyncId
import datainsider.jobscheduler.domain.job.Job

case class JobInfo(job: Job, source: Option[DataSource], creator: Option[ShortUserProfile])

case class NextJobResponse(hasJob: Boolean, data: Option[SyncInfo])

case class SyncInfo(syncId: SyncId, job: Job, source: Option[DataSource])
