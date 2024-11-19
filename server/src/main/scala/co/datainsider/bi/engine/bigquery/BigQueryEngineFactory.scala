package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.client.BigQueryClient
import co.datainsider.bi.domain.BigQueryConnection
import co.datainsider.bi.engine.factory.{CreateEngineException, EngineFactory}
import co.datainsider.bi.util.Using
import com.google.auth.oauth2.ServiceAccountCredentials
import com.google.cloud.bigquery.{BigQuery, BigQueryOptions}
import org.nutz.lang.stream.StringInputStream

/**
  * created 2023-12-13 5:14 PM
  *
  * @author tvc12 - Thien Vi
  */
class BigQueryEngineFactory(
    maxQueryRows: Int = 10000,
    defaultTimeoutMs: Long = 30000,
    testConnTimeoutMs: Long = 30000
) extends EngineFactory[BigQueryConnection] {
  override def create(connection: BigQueryConnection): BigQueryEngine = {
    try {
      val client = new BigQueryClient(
        bigquery = createBigquery(connection),
        maxQueryRows = maxQueryRows,
        defaultTimeoutMs = defaultTimeoutMs
      )
      new BigQueryEngine(client, connection)
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create BigqueryEngine cause ${ex.getMessage}", ex)
    }
  }

  override def createTestEngine(connection: BigQueryConnection): BigQueryEngine = {
    try {
      val client = new BigQueryClient(
        bigquery = createBigquery(connection),
        maxQueryRows = maxQueryRows,
        defaultTimeoutMs = testConnTimeoutMs
      )
      new BigQueryEngine(client, connection)
    } catch {
      case ex: Throwable => throw CreateEngineException(s"Cannot create BigqueryEngine cause ${ex.getMessage}", ex)
    }

  }

  private def createBigquery(connection: BigQueryConnection): BigQuery = {
    Using(new StringInputStream(connection.credentials))(credentialStream => {
      val credentials = ServiceAccountCredentials.fromStream(credentialStream)
      BigQueryOptions
        .newBuilder()
        .setCredentials(credentials)
        .setProjectId(connection.projectId)
        .setLocation(connection.location.orNull)
        .build()
        .getService
    })
  }

}
