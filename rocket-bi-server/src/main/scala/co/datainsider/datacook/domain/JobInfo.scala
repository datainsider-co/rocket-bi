package co.datainsider.datacook.domain

import co.datainsider.datacook.domain.Ids.JobHistoryId

case class JobInfo[Job](historyId: JobHistoryId, job: Job)
