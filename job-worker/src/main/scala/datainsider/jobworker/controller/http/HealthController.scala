package datainsider.jobworker.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.common.profiler.Profiler

import scala.util.parsing.json.JSONObject

/**
  * Created by SangDang on 9/18/16.
  */
class HealthController extends Controller {
  get("/ping") { request: Request =>
    {
      logger.info("ping")
      Map("status" -> "ok", "data" -> "pong")
    }
  }

  get("/_profiler") { _: Request =>
    {
      response.ok(Profiler.report())
    }
  }

  get("/_profiler_html") { request: Request =>
    {
      val refreshTime = request.getIntParam("refresh_time", 10)
      response.ok.html(Profiler.reportAsHtml(refreshTime))
    }
  }
}
