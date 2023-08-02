package co.datainsider.caas.user_profile.domain

case class PagingResult[T](total: Long, data: Seq[T])
