package datainsider.schema.module

//import com.google.common.net.MediaType._
import com.google.inject.Inject
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.marshalling
import com.twitter.finatra.http.marshalling.{DefaultMessageBodyWriter, WriterResponse}
import com.twitter.finatra.jackson.ScalaObjectMapper
import com.twitter.inject.Logging

case class ApiError(
    code: Int,
    reason: String,
    message: String,
    data: Option[Any] = None
)

class CustomResponseWriterImpl @Inject() (
    mapper: ScalaObjectMapper
) extends DefaultMessageBodyWriter
    with Logging {

  override def write(obj: Any): WriterResponse = {
    obj match {
      case ex: Throwable => {
        this.error(ex.getMessage)
        marshalling.WriterResponse(
          contentType = "UTF-8",
          body = mapper.writeValueAsString(
            ApiError(
              Status.InternalServerError.code,
              "internal_error",
              ex.getMessage
            )
          )
        )

      }

      case v: String =>
        marshalling.WriterResponse(
          contentType = "UTF-8",
          body = v
        )
      case v: Any =>
        marshalling.WriterResponse(
          contentType = "UTF-8",
          body = mapper.writeValueAsString(v)
        )

    }

  }
}
