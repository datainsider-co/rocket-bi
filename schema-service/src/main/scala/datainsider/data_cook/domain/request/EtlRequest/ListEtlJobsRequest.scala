package datainsider.data_cook.domain.request.EtlRequest

import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.request.{PageRequest, Sort, SortRequest}

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 2:21 PM
  */

/**
  * request for list etls
  * @param keyword list etl by keyword, if keyword is empty string, return full list etls
  * @param sorts sort etls by field name
  * @param from pagination from
  * @param size item size
  * @param request
  */
case class ListEtlJobsRequest(
    keyword: String = "",
    sorts: Array[Sort] = Array.empty,
    from: Int = 0,
    size: Int = 1000,
    @Inject request: Request = null
) extends LoggedInRequest
    with PageRequest
    with SortRequest
