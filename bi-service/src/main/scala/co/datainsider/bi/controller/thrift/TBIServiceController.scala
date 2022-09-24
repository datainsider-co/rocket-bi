package co.datainsider.bi.controller.thrift

import co.datainsider.bi.service.TBIService.{DeleteUserData, MigrateUserData}
import co.datainsider.bi.service.{DirectoryService, TBIService}
import com.google.inject.Inject
import com.twitter.finatra.thrift.Controller

class TBIServiceController @Inject() (directoryService: DirectoryService) extends Controller(TBIService) {

  handle(MigrateUserData) { request: MigrateUserData.Args =>
    directoryService.migrateUserData(request.fromUserId, request.toUserId)
  }

  handle(DeleteUserData) { request: DeleteUserData.Args =>
    directoryService.deleteUserData(request.userId)
  }

}
