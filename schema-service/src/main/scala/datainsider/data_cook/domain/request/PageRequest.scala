package datainsider.data_cook.domain.request

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.request.Order.Order

trait PageRequest {
  val from: Int
  val size: Int
}

trait SortRequest {
  val sorts: Array[Sort]
}

case class Sort(field: String, @JsonScalaEnumeration(classOf[OrderType]) order: Order)

object Order extends Enumeration {
  type Order = Value
  val ASC: Order = Value("ASC")
  val DESC: Order = Value("DESC")
}

class OrderType extends TypeReference[Order.type]
