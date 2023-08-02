package co.datainsider.schema.domain.requests

trait PagingRequest {
  val from: Int
  val size: Int
}
