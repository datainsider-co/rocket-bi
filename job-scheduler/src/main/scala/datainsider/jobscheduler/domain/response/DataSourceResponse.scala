package datainsider.jobscheduler.domain.response

import datainsider.client.domain.user.ShortUserProfile
import datainsider.jobscheduler.domain.DataSource

case class DataSourceResponse(dataSource: DataSource, creator: Option[ShortUserProfile])
