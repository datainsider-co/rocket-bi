package co.datainsider.datacook.domain.response

import co.datainsider.datacook.domain.Ids.EtlJobId

case class EtlQueryResponse(id: EtlJobId, query: String)
