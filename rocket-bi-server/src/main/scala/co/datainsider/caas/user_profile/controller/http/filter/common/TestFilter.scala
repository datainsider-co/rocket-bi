package co.datainsider.caas.user_profile.controller.http.filter.common

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future

/**
  * @author anhlt
  */
class TestFilter extends SimpleFilter[Request, Response] {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    service(request).map(resp => {
      println("filter done")
      resp
    })
  }
}
