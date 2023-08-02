package co.datainsider.caas.user_caas.domain

object Page {
  def empty[T]: Page[T] = Page[T](0, Seq.empty[T])
}

case class Page[T](total: Long, data: Seq[T])
