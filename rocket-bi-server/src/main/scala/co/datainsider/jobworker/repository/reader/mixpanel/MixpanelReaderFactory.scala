package co.datainsider.jobworker.repository.reader.mixpanel

import co.datainsider.jobworker.client.mixpanel.MixpanelClient
import co.datainsider.jobworker.domain.job.MixpanelJob
import co.datainsider.jobworker.domain.source.MixpanelSource
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.factory.ReaderFactory

class MixpanelReaderFactory extends ReaderFactory[MixpanelSource, MixpanelJob] {
  override def create(source: MixpanelSource, job: MixpanelJob): Reader = {
    val client: MixpanelClient = MixpanelClient.create(source)
    new ExportReader(client, source.projectId, job)
  }
}
