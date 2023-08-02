package co.datainsider.datacook.domain.response

import co.datainsider.datacook.domain.Ids.EtlJobId

/**
  * @author tvc12 - Thien Vi
  * @created 10/26/2021 - 4:08 PM
  */
case class EtlDatabaseNameResponse(
    id: EtlJobId,
    databaseName: String
)
