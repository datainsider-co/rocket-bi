package co.datainsider.schema.domain.responses

import co.datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo}
import co.datainsider.caas.user_profile.domain.user.UserProfile

case class ShortSchemaInfo(database: DatabaseShortInfo, owner: Option[UserProfile])

case class ListDatabaseResponse(data: Seq[ShortSchemaInfo], total: Int)

case class FullSchemaInfo(database: DatabaseSchema, owner: Option[UserProfile])
