package co.datainsider.schema.domain.responses

case class TestConnectionResponse(
    isSuccess: Boolean,
    errorMsg: Option[String]
)
