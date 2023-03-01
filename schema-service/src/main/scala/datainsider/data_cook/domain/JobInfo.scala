package datainsider.data_cook.domain

import datainsider.data_cook.domain.Ids.JobHistoryId

case class JobInfo[Job](historyId: JobHistoryId, job: Job)
