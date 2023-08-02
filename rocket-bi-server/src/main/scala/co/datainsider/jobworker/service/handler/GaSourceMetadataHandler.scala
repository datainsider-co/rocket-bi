package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.domain.source.GaSource
import co.datainsider.jobworker.util.{GoogleCredentialUtils, GoogleOAuthConfig}
import com.google.api.client.auth.oauth2.Credential
import com.twitter.util.Future
import com.twitter.util.logging.Logging

import scala.util.control.NonFatal

class GaSourceMetadataHandler(
    source: GaSource,
    googleOAuthConfig: GoogleOAuthConfig
) extends SourceMetadataHandler
    with Logging {

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        val credential: Credential = GoogleCredentialUtils.buildCredentialFromToken(source.accessToken, source.refreshToken, googleOAuthConfig)
        credential.refreshToken()
      } catch {
        case NonFatal(e) =>
          logger.error(s"test connection failed: ${e.getMessage}")
          false
      }
    }

  override def listDatabases(): Future[Seq[String]] = Future.Nil

  override def listTables(databaseName: String): Future[Seq[String]] = Future.Nil

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = Future.Nil

  override def testJob(job: Job): Future[Boolean] = Future.False
}
