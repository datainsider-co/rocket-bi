package datainsider.data_cook.domain.response

import datainsider.data_cook.domain.Ids.EtlJobId

case class EtlQueryResponse(id: EtlJobId, query: String)
