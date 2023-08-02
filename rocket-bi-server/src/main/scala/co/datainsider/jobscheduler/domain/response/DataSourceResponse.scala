package co.datainsider.jobscheduler.domain.response

import co.datainsider.jobscheduler.domain.source.DataSource
import co.datainsider.caas.user_profile.domain.user.ShortUserProfile

case class DataSourceResponse(dataSource: DataSource, creator: Option[ShortUserProfile])
