package co.datainsider.bi.domain.response

import co.datainsider.bi.domain.DirectoryType.DirectoryType
import co.datainsider.bi.domain.Ids.{Date, DirectoryId}
import co.datainsider.bi.domain.{Directory, DirectoryType, DirectoryTypeRef}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.user.ShortUserProfile

case class DirectoryResponse(
    id: DirectoryId,
    name: String,
    owner: Option[ShortUserProfile],
    createdDate: Date,
    parentId: DirectoryId,
    isRemoved: Boolean = false,
    @JsonScalaEnumeration(classOf[DirectoryTypeRef])
    directoryType: DirectoryType = DirectoryType.Directory,
    dashboardId: Option[Long] = None,
    updatedDate: Option[Long] = None,
    isStarred: Boolean = false,
    // save cdp data
    data: Option[Map[String, Any]] = None
)

case class ParentDirectoriesResponse(rootDirectory: Directory, isAll: Boolean, parentDirectories: Array[Directory])
