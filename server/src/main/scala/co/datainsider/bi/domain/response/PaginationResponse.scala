package co.datainsider.bi.domain.response

case class PaginationResponse[T](data: Array[T], total: Long)
