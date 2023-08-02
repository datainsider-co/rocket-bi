package co.datainsider.jobworker.hubspot.service

import co.datainsider.jobworker.hubspot.client.{APIKetHubspotClient, HubspotClient}
import co.datainsider.jobworker.hubspot.engagement.{Engagement, EngagementClient}

/**
 * Created by phg on 6/29/21.
 **/
case class EngagementService(client: HubspotClient with EngagementClient) extends HsService {
  def fetchRecent(since: Long, offset: Option[Long] = None)(result: Seq[Engagement] => Unit, failure: String => Unit): Unit = {
    exec {
      client.getRecentEngagement(since = Some(since), offset = offset)
    }(res => {
      result(res.results)
      if (res.hasMore) fetchRecent(since, Some(res.offset))(result, failure)
    }, failure)
  }
}

object EngagementService {
  def apply(apiKey: String): EngagementService = new EngagementService(
    new APIKetHubspotClient(apiKey) with EngagementClient
  )
}
