package co.datainsider.jobworker.controller.http

import co.datainsider.jobworker.service.WorkerService
import co.datainsider.jobworker.service.worker.VersioningWorker
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

class WorkerController @Inject() (
    workerService: WorkerService,
    versioningWorker: VersioningWorker
) extends Controller {

  put("/worker/start") { request: Request =>
    workerService.start()
  }

  put("/worker/stop") { request: Request =>
    workerService.stop()
  }

  get("/worker/status") { request: Request =>
    workerService.status()
  }

  get("/versioning_worker/status") { request: Request =>
    versioningWorker.status()
  }

}
