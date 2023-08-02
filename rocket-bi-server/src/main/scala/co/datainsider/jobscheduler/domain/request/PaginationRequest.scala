package co.datainsider.jobscheduler.domain.request

import co.datainsider.jobscheduler.domain.request.SortOrder.SortOrder
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.validation.constraints.{Max, Min}
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest

import javax.inject.Inject

object SortOrder extends Enumeration {
  type SortOrder = Value
  val ASC: SortOrder = Value("ASC")
  val DESC: SortOrder = Value("DESC")
}

class SortOrderRef extends TypeReference[SortOrder.type]

case class SortRequest(field: String, @JsonScalaEnumeration(classOf[SortOrderRef]) order: SortOrder)

case class PaginationRequest(
    @Min(0) from: Int,
    @Max(1000) size: Int,
    sorts: Seq[SortRequest] = Seq.empty,
    keyword: Option[String] = None,
    currentStatuses: Seq[String] = Seq.empty,
    @Inject request: Request
) extends LoggedInRequest

case class PaginationResponse[T](data: Seq[T], total: Long)
