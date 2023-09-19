package co.datainsider.jobworker.repository.reader.googlesearchconsole

import co.datainsider.jobscheduler.domain.job.GoogleSearchConsoleType
import co.datainsider.jobworker.domain.job.GoogleSearchConsoleJob
import co.datainsider.jobworker.domain.source.GoogleSearchConsoleSource
import co.datainsider.jobworker.exception.CreateReaderException
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.factory.ReaderFactory
import co.datainsider.jobworker.util.{GoogleCredentialUtils, GoogleOAuthConfig}
import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.googleapis.util.Utils
import com.google.api.client.http.HttpRequestInitializer
import com.google.api.services.searchconsole.v1.SearchConsole

/**
  * created 2023-09-05 6:31 PM
  *
  * @author tvc12 - Thien Vi
  */
class SearchConsoleReaderFactory(
    googleOAuthConfig: GoogleOAuthConfig,
    applicationName: String,
    connTimeoutMs: Int,
    readTimeoutMs: Int
) extends ReaderFactory[GoogleSearchConsoleSource, GoogleSearchConsoleJob] {
  override def create(source: GoogleSearchConsoleSource, job: GoogleSearchConsoleJob): Reader = {
    val console: SearchConsole = buildSearchConsole(source)
    job.tableType match {
      case GoogleSearchConsoleType.SearchAnalytics  => new SearchAnalyticReader(console, job)
      case GoogleSearchConsoleType.SearchAppearance => new SearchAppearanceReader(console, job)
      case _                                        => throw CreateReaderException(s"Unsupported table type ${job.tableType}")
    }
  }

  private def buildSearchConsole(source: GoogleSearchConsoleSource): SearchConsole = {
    val credential: Credential =
      GoogleCredentialUtils.buildCredentialFromToken(source.accessToken, source.refreshToken, googleOAuthConfig)
    val initializer: HttpRequestInitializer =
      GoogleCredentialUtils.withHttpTimeout(credential, connTimeoutMs, readTimeoutMs)
    val builder = new SearchConsole.Builder(
      GoogleNetHttpTransport.newTrustedTransport(),
      Utils.getDefaultJsonFactory,
      initializer
    )
    builder.setApplicationName(applicationName)
    builder.build()
  }

}
