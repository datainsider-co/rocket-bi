package co.datainsider.bi.domain

import co.datainsider.bi.domain.Ids.{Date, DirectoryId, UserId}
import co.datainsider.bi.domain.DirectoryType.DirectoryType
import co.datainsider.bi.domain.request.CreateDirectoryRequest
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

object Directory {
  val MyData = -1L
  val Shared = -2L

  def getSharedDirectory(username: String): Directory = {
    Directory(
      id = Directory.Shared,
      name = "root",
      creatorId = username,
      ownerId = username,
      createdDate = System.currentTimeMillis(),
      parentId = -999,
      isRemoved = false
    )
  }
}

case class Directory(
    id: DirectoryId,
    name: String,
    creatorId: UserId,
    ownerId: UserId,
    createdDate: Date,
    parentId: DirectoryId,
    isRemoved: Boolean = false,
    @JsonScalaEnumeration(classOf[DirectoryTypeRef])
    directoryType: DirectoryType = DirectoryType.Directory,
    dashboardId: Option[Long] = None,
    updatedDate: Option[Long] = None,
    // save cdp data
    data: Option[Map[String, Any]] = None
) {
  def toCreateDirRequest: CreateDirectoryRequest = {
    CreateDirectoryRequest(
      name = name,
      parentId = parentId,
      directoryType = directoryType,
      dashboardId = dashboardId
    )
  }
}
