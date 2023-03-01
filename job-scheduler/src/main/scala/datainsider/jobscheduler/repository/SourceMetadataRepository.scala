package datainsider.jobscheduler.repository

import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{DateTimeColumn, StringColumn}
import datainsider.jobscheduler.client.HttpClient
import datainsider.jobscheduler.domain.request.GetTableSchemaRequest
import datainsider.jobscheduler.domain.response.SyncInfo

trait SourceMetadataRepository {
  def getTableSchema(syncInfo: SyncInfo): Future[TableSchema]
}

class HttpSourceMetadataRepository @Inject() (client: HttpClient, @Named("access-token") accessToken: String)
    extends SourceMetadataRepository {
  override def getTableSchema(syncInfo: SyncInfo): Future[TableSchema] = {
    Future {
      val data = GetTableSchemaRequest(syncInfo)
      client.post[TableSchema, GetTableSchemaRequest]("/job/get_table_schema", data, Seq(("access-token", accessToken)))
    }
  }
}

class MockSourceMetadataRepository extends SourceMetadataRepository {
  override def getTableSchema(syncInfo: SyncInfo): Future[TableSchema] =
    Future {
      TableSchema(
        "transaction",
        "1001_database1",
        1001,
        "Transaction",
        Seq(
          DateTimeColumn("created_date", "Created Date"),
          StringColumn("location", "Location"),
          StringColumn("shop", "Shop"),
          StringColumn("sale", "Sale")
        )
      )
    }
}
