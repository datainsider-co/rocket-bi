package co.datainsider.bi.controller.http

import co.datainsider.bi.util.profiler.Profiler
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

/**
  * Created by SangDang on 9/18/16.
  */
class HealthController extends Controller {
  get("/ping") { request: Request =>
    Profiler("/ping") {
      response.ok(Map("status" -> "ok", "data" -> "pong"))
    }
  }

  post("/status") { request: Request =>
    response.ok(Map("status" -> "ok"))
  }

  get("/_profiler") { _: Request =>
    {
      response.ok(Profiler.report())
    }
  }

  get("/_profiler_html") { request: Request =>
    {
      response.ok.html(Profiler.reportAsHtml())
    }
  }
}
