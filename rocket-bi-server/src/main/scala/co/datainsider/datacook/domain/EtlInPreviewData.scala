package co.datainsider.datacook.domain

import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}

/**
  * @author tvc12 - Thien Vi
  * @created 11/20/2021 - 3:06 PM
  */
case class EtlInPreviewData(organizationId: OrganizationId, etlJobId: EtlJobId)
