package datainsider.ingestion.controller.http.responses

import datainsider.client.domain.user.UserProfile
import datainsider.ingestion.domain.{DatabaseSchema, DatabaseShortInfo}

case class ShortSchemaInfo(database: DatabaseShortInfo, owner: Option[UserProfile])

case class ListDatabaseResponse(data: Seq[ShortSchemaInfo], total: Int)

case class FullSchemaInfo(database: DatabaseSchema, owner: Option[UserProfile])