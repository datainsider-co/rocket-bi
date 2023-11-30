package co.datainsider.jobworker.repository.reader.factory

import co.datainsider.jobworker.domain.job.Ga4Job
import co.datainsider.jobworker.domain.source.Ga4Source
import co.datainsider.jobworker.exception.CreateReaderException
import co.datainsider.jobworker.repository.reader.{Ga4Reader, Reader}
import com.google.analytics.data.v1beta.{BetaAnalyticsDataClient, BetaAnalyticsDataSettings}
import com.google.api.gax.core.FixedCredentialsProvider
import com.google.auth.oauth2.{AccessToken, UserCredentials}

class Ga4ReaderFactory(clientId: String, clientSecret: String, batchSize: Int = 10000)
    extends ReaderFactory[Ga4Source, Ga4Job] {

  override def create(source: Ga4Source, job: Ga4Job): Reader = {
    ensureSourceExisted(source)
    val credentials: UserCredentials = UserCredentials
      .newBuilder()
      .setClientId(clientId)
      .setClientSecret(clientSecret)
      .setRefreshToken(source.refreshToken)
      .build()
    val analyticsDataSettings = BetaAnalyticsDataSettings
      .newBuilder()
      .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
      .build()
    val client = BetaAnalyticsDataClient.create(analyticsDataSettings)
    new Ga4Reader(client, job, batchSize)
  }

  private def ensureSourceExisted(source: Ga4Source): Unit = {
    if (source == null) {
      throw CreateReaderException("Ga4Source is null")
    }
  }

}
