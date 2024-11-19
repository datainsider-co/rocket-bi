package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.Order.Order
import co.datainsider.bi.domain.OrderType
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

trait PageRequest {
  val from: Int
  val size: Int
}

trait SortRequest {
  val sorts: Array[Sort]
}

case class Sort(field: String, @JsonScalaEnumeration(classOf[OrderType]) order: Order)
