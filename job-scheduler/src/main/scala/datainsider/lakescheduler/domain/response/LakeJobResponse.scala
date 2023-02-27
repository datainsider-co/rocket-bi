package datainsider.lakescheduler.domain.response

import datainsider.client.domain.user.ShortUserProfile
import datainsider.jobscheduler.domain.Ids.RunId
import datainsider.lakescheduler.domain.job.LakeJob

case class NextLakeJobResponse(hasJob: Boolean, data: Option[LakeRunInfo])

case class LakeJobResponse(job: LakeJob, creator: Option[ShortUserProfile])

case class LakeRunInfo(runId: RunId, job: LakeJob)
