package co.datainsider.bi.domain

import co.datainsider.bi.domain.Ids.{Date, DirectoryId, UserId}
import co.datainsider.bi.domain.DirectoryType.DirectoryType
import co.datainsider.bi.domain.request.CreateDirectoryRequest
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

object Directory {
  val MyData = -1L
  val Shared = -2L

  def getSharedDirectory(orgId: Long, username: String): Directory = {
    Directory(
      orgId = orgId,
      id = Directory.Shared,
      name = "root",
      creatorId = username,
      ownerId = username,
      createdDate = System.currentTimeMillis(),
      parentId = -999
    )
  }
}

case class Directory(
    orgId: Long,
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
    data: Option[Map[String, Any]] = None
) {
  def toCreateDirRequest(parentId: DirectoryId): CreateDirectoryRequest = {
    CreateDirectoryRequest(
      name = this.name,
      parentId = parentId,
      directoryType = this.directoryType,
      dashboardId = this.dashboardId,
      isRemoved = this.isRemoved,
      data = this.data
    )
  }
}
