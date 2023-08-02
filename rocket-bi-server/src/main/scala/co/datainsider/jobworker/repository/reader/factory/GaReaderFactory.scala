package co.datainsider.jobworker.repository.reader.factory

import co.datainsider.jobworker.domain.job.GaJob
import co.datainsider.jobworker.domain.source.{GaSource, MockDataSource}
import co.datainsider.jobworker.repository.reader.{Ga4Reader, Reader}
import co.datainsider.jobworker.repository.reader.ga.GaReader
import co.datainsider.jobworker.util.{GoogleCredentialUtils, GoogleOAuthConfig}
import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.googleapis.util.Utils
import com.google.api.client.http.HttpRequestInitializer
import com.google.api.services.analyticsreporting.v4.AnalyticsReporting
import co.datainsider.jobworker.domain.Ids.DummyId

/**
  * support
  */
class OldGaReaderFactory(baseReader: ReaderFactory[GaSource, GaJob]) extends ReaderFactory[MockDataSource, GaJob] {

  override def create(source: MockDataSource, job: GaJob): Reader = {
    val source = GaSource(
      orgId = job.orgId,
      id = DummyId,
      displayName = "Ga source",
      creatorId = "",
      lastModify = System.currentTimeMillis(),
      accessToken = job.accessToken,
      refreshToken = job.refreshToken
    )
    baseReader.create(source, job)
  }

}

class GaReaderFactory(
    googleOAuthConfig: GoogleOAuthConfig,
    applicationName: String,
    connTimeoutMs: Int,
    readTimeoutMs: Int,
    batchSize: Int
) extends ReaderFactory[GaSource, GaJob] {

  override def create(source: GaSource, job: GaJob): Reader = {
    val credential: Credential = GoogleCredentialUtils.buildCredentialFromToken(source.accessToken, source.refreshToken, googleOAuthConfig)
    val initializer: HttpRequestInitializer = GoogleCredentialUtils.withHttpTimeout(credential, connTimeoutMs, readTimeoutMs)
    val analyticsReporting: AnalyticsReporting = new AnalyticsReporting.Builder(
      GoogleNetHttpTransport.newTrustedTransport(),
      Utils.getDefaultJsonFactory,
      initializer
    ).setApplicationName(applicationName)
      .build()
    new GaReader(analyticsReporting, job, batchSize)
  }
}
