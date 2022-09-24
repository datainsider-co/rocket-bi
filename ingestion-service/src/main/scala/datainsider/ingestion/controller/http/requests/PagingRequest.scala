package datainsider.ingestion.controller.http.requests

trait PagingRequest {
  val from: Int
  val size: Int
}