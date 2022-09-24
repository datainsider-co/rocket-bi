package co.datainsider.bi.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.parsing.json.JSONObject

/**
  * Created by SangDang on 9/18/16.
  */
class HealthController extends Controller {
  get("/ping") { request: Request =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::/ping") {
      logger.info(s"ping")
      response.ok(JSONObject(Map("status" -> "ok", "data" -> "pong")).toString())
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
