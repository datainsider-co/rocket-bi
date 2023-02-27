package datainsider.jobscheduler.controller.http


import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

import scala.util.parsing.json.JSONObject

/**
  * Created by SangDang on 9/18/16.
  */
class HealthController extends Controller {
  get("/ping") {
    request: Request => {
      logger.info("ping")
      Map("status"->"ok","data"->"pong")
    }
  }
}
