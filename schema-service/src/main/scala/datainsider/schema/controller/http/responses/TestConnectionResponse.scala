package datainsider.schema.controller.http.responses

case class TestConnectionResponse(
    isSuccess: Boolean,
    errorMsg: Option[String]
)
