package com.ptl.hubspot.company

import com.fasterxml.jackson.databind.annotation.JsonNaming

/**
 * Created by phg on 6/29/21.
 **/
@JsonNaming
case class Company(
  portalId: Long,
  companyId: Long,
  isDeleted: Boolean,
  properties: Map[String, CompanyProperty]
)

@JsonNaming
case class CompanyProperty(
  value: String,
  timestamp: Long,
  source: String,
  sourceId: String,
  version: Seq[CompanyProperty]
)

@JsonNaming
case class GetRecentCompanyResponse(
  results: Seq[Company],
  hasMore: Boolean,
  offset: Long,
  total: Long
)