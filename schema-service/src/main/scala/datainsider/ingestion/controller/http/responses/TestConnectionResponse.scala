package datainsider.ingestion.controller.http.responses

case class TestConnectionResponse(
    isSuccess: Boolean,
    errorMsg: Option[String]
)
