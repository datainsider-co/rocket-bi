package co.datainsider.jobworker.repository.reader.factory

import co.datainsider.jobworker.domain.job.Ga4Job
import co.datainsider.jobworker.domain.source.GoogleServiceAccountSource
import co.datainsider.jobworker.exception.CreateReaderException
import co.datainsider.jobworker.repository.reader.{Ga4Reader, Reader}
import co.datainsider.bi.util.Using
import com.google.analytics.data.v1beta.{BetaAnalyticsDataClient, BetaAnalyticsDataSettings}
import com.google.api.gax.core.FixedCredentialsProvider
import com.google.auth.oauth2.GoogleCredentials

import java.io.ByteArrayInputStream

class Ga4ServiceAccountReaderFactory(batchSize: Int = 10000) extends ReaderFactory[GoogleServiceAccountSource, Ga4Job] {

  override def create(source: GoogleServiceAccountSource, job: Ga4Job): Reader = {
    ensureSourceExisted(source)
    Using(new ByteArrayInputStream(source.credential.getBytes()))(inputStream => {
      val credentials = GoogleCredentials.fromStream(inputStream)
      val settings = BetaAnalyticsDataSettings
        .newBuilder()
        .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
        .build()
      val client: BetaAnalyticsDataClient = BetaAnalyticsDataClient.create(settings)
      new Ga4Reader(client, job, batchSize)
    })
  }

  private def ensureSourceExisted(source: GoogleServiceAccountSource): Unit = {
    if (source == null) {
      throw CreateReaderException("credential is empty")
    }
  }

}
