package datainsider.jobworker.controller.http

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.common.profiler.Profiler
import datainsider.jobworker.service.WorkerService

class WorkerController @Inject() (workerService: WorkerService) extends Controller {

  put("/worker/start") { request: Request =>
    workerService.start()
  }

  put("/worker/stop") { request: Request =>
    workerService.stop()
  }

  get("/worker/status") { request: Request =>
    workerService.status()
  }

}
