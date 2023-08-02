package co.datainsider.jobworker.hubspot.company

import co.datainsider.jobworker.hubspot.client.{HubspotClient, ParamBuilder, Response}

/**
 * Created by phg on 6/29/21.
 **/
trait CompanyClient extends HubspotClient {
  private val companyUrl = s"$apiUrl/companies/v2/companies"

  def getRecent(since: Long, count: Option[Int] = None, offset: Option[Long]): Response[GetRecentCompanyResponse] = {
    http.GET[GetRecentCompanyResponse](s"$companyUrl/recent/modified",
      ParamBuilder()
        .add("since", since)
        .add("count", count)
        .add("offset", offset)
        .build()
    )
  }
}
