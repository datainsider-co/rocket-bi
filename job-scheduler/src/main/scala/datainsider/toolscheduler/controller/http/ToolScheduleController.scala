package datainsider.toolscheduler.controller.http

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.toolscheduler.domain.{NextJobInfo, ToolJobHistory}
import datainsider.toolscheduler.service.ToolScheduleService

class ToolScheduleController @Inject() (toolScheduleService: ToolScheduleService) extends Controller {

  get("/tool/schedule/next") { request: Request =>
    toolScheduleService.next().map(nextJobResp => NextJobInfo(hasNext = nextJobResp.isDefined, data = nextJobResp))
  }

  post("/tool/schedule/report") { toolJobHistory: ToolJobHistory =>
    toolScheduleService.report(toolJobHistory).map(result => Map("is_success" -> result))
  }

}
