package co.datainsider.bi.domain

import com.fasterxml.jackson.core.`type`.TypeReference

import scala.util.matching.Regex

/** *
  * Ids alias for our system
  */
object Ids {
  type DashboardId = Long
  type DirectoryId = Long

  /** *
    * WidgetId used for ChartId, FilterId ...
    */
  type WidgetId = Long

  type UserId = String

  type Date = Long

  type TableRelationshipId = Long

  type Geocode = String

  type CohortId = Long

  type OrganizationId = Long

}

object DirectoryType extends Enumeration {
  type DirectoryType = Value
  val Directory: DirectoryType = Value("directory")
  val Dashboard: DirectoryType = Value("dashboard")
  val Queries: DirectoryType = Value("queries")
  val PathExplorer: DirectoryType = Value("path_explorer")
  val EventAnalysis: DirectoryType = Value("event_analysis")
  val FunnelAnalysis: DirectoryType = Value("funnel_analysis")
  val RetentionAnalysis: DirectoryType = Value("retention_analysis")

}

class DirectoryTypeRef extends TypeReference[DirectoryType.type]

object Order extends Enumeration {
  type Order = Value
  val ASC: Order = Value("ASC")
  val DESC: Order = Value("DESC")
}

class OrderType extends TypeReference[Order.type]

object SqlRegex extends Enumeration {
  type SqlRegex = Regex
  val SelectRegex: SqlRegex = """select\s""".r
  val FromRegex: SqlRegex = """\sfrom\s""".r
  val WhereRegex: SqlRegex = """\swhere\s""".r
  val GroupByRegex: SqlRegex = """\sgroup by\s""".r
  val HavingRegex: SqlRegex = """\shaving\s""".r
  val OrderByRegex: SqlRegex = """\sorder by\s""".r
  val LimitRegex: SqlRegex = """\slimit\s""".r
}

object CompareMode extends Enumeration {
  type CompareMode = Value
  val RawValues: CompareMode = Value("RawValues")
  val ValuesDiff: CompareMode = Value("ValuesDifference")
  val PercentageDiff: CompareMode = Value("PercentageDifference")
}

class CompareModeType extends TypeReference[CompareMode.type]
