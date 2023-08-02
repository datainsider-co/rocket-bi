package co.datainsider.jobworker.repository.reader.palexy

import co.datainsider.jobworker.client.HttpClientImpl
import co.datainsider.jobworker.client.palexy.PalexyClientImpl
import co.datainsider.jobworker.domain.job.PalexyJob
import co.datainsider.jobworker.domain.source.PalexySource
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.factory.ReaderFactory

/**
  * created 2023-07-10 5:39 PM
  *
  * @author tvc12 - Thien Vi
  */
class PalexyReaderFactory(apiUrl: String, windowDays: Int = 30, maxRetryTimes: Int = 3, retryIntervalMs: Int = 1000) extends ReaderFactory[PalexySource, PalexyJob] {
  override def create(source: PalexySource, job: PalexyJob): Reader = {
    val httpClient = new HttpClientImpl(apiUrl)
    val client = new PalexyClientImpl(httpClient)
    new PalexyReader(
      client = client,
      apiKey = source.apiKey,
      palexyJob = job,
      windowDays = windowDays,
      maxRetryTimes = maxRetryTimes,
      retryIntervalMs = retryIntervalMs
    )
  }
}
