package datainsider.analytics.domain

import datainsider.ingestion.domain.Column
import datainsider.ingestion.util.Implicits.ImplicitString

case class TrackingColumnConfig(
    defaultProfileColumns: Seq[Column],
    sharedEventColumns: Seq[Column],
    defaultEventDetailColumns: Seq[Column],
    sessionColumns: Seq[Column],
    pageViewColumns: Seq[Column]
) {

  def eventColumnNameSet = sharedEventColumns.map(column => column.name).toSet

  def eventColumnDisplayNameMap() = {
    sharedEventColumns.map(column => column.name -> column.displayName).toMap
  }

  def profileColumnDisplayNameMap() = {
    defaultProfileColumns.map(column => column.name -> column.displayName).toMap
  }
}

case class AnalyticsConfig(
    trackingDbPrefix: String,
    reportDbPrefix: String,
    trackingProfileTbl: String,
    trackingEventTbl: String,
    reportUserCollectionTbl: String,
    reportActiveUserMetricTbl: String,
    systemEventNameMap: Map[String, String]
) {

  def getTrackingDbName(organizationId: Long): String = s"$trackingDbPrefix$organizationId"

  def getReportDbName(organizationId: Long): String = s"$reportDbPrefix$organizationId"

  def isSystemEvent(event: String): Boolean = {
    systemEventNameMap.contains(event)
  }

  def getEventDisplayName(event: String): String = systemEventNameMap.getOrElse(event, event.asPrettyDisplayName)

}
