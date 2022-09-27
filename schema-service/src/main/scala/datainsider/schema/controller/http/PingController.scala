package datainsider.schema.controller.http

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

class PingController @Inject() () extends Controller {

  get("/ping") { request: Request =>
    {
      "pong"
    }
  }
}
