package datainsider.user_profile.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.filter.common.TestFilter

import scala.concurrent.ExecutionContext.Implicits.global

class PingController extends Controller {

  filter[TestFilter]
    .get("/user/ping") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/ping") {
        response.ok(Map("status" -> "ok", "data" -> "pong"))
      }
    }

  get("/user/_profiler") { _: Request =>
    {
      response.ok(Profiler.report())
    }
  }

  get("/user/_profiler_html") { _: Request =>
    {
      response.ok.html(Profiler.reportAsHtml())
    }
  }
}
