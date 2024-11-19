package co.datainsider.bi.domain.response

import co.datainsider.bi.domain.query.Query
import co.datainsider.bi.domain.{RelationshipInfo, RlsPolicy}

case class CsvResponse(data: String, lastQueryTime: Long = 0, lastProcessingTime: Long = 0) extends ChartResponse {
  override def setTime(queryTime: Long, processTime: Long): ChartResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class PrepareQueryResponse(
    relationshipInfo: RelationshipInfo,
    rlsPolicies: Seq[RlsPolicy],
    tableExpressions: Map[String, String],
    finalQuery: Query
)
