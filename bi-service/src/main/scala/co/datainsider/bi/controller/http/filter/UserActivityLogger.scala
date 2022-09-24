package co.datainsider.bi.controller.http.filter

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util
import com.twitter.util.{Duration, Future, Stopwatch}
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.util.LoggerUtils
import org.slf4j

class UserActivityLogger extends SimpleFilter[Request, Response] {
  val logger: slf4j.Logger = LoggerUtils.getLogger("co.datainsider.logger.CustomLogger")

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val elapsed: util.Stopwatch.Elapsed = Stopwatch.start()
    val requestMethod: String = request.method.toString()
    val requestURI: String = request.uri
    val requestContent: String = request.getContentString().replaceAll("\n", "").replaceAll("\t", " ")
    val username =
      if (request.isAuthenticated) {
        request.currentUsername
      } else {
        null
      }

    service(request)
      .rescue {
        case ex: Throwable =>
          val responseStatusCode: Int = 500
          val executeTime: Duration = elapsed()
          val message: String = ex.getMessage.replaceAll("\n", "").replaceAll("\t", " ")
          logger.info(
            s"$username\t$requestMethod\t$requestURI\t$requestContent\t$responseStatusCode\t${executeTime.inMillis}\t$message"
          )
          throw new Exception(ex)
      }
      .map(response => {
        val responseStatusCode: Int = response.statusCode
        val executeTime: Duration = elapsed()
        val message = null
        logger.info(
          s"$username\t$requestMethod\t$requestURI\t$requestContent\t$responseStatusCode\t${executeTime.inMillis}\t$message"
        )
        response
      })
  }
}
