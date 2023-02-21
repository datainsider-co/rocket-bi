package datainsider.data_cook.domain

import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}

/**
  * @author tvc12 - Thien Vi
  * @created 11/20/2021 - 3:06 PM
  */
case class EtlInPreviewData(organizationId: OrganizationId, etlJobId: EtlJobId)
