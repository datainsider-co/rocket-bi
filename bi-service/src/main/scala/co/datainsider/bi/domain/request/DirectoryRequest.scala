package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.DirectoryType.DirectoryType
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.{DirectoryType, DirectoryTypeRef}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{Min, NotEmpty}
import datainsider.client.filter.LoggedInRequest

import javax.inject.Inject

case class ListDirectoriesRequest(
    parentId: Option[Long] = None,
    ownerId: Option[String] = None,
    isRemoved: Option[Boolean] = None,
    @deprecated("use dashboardIds instead")
    dashboardId: Option[Long] = None,
    dashboardIds: Seq[Long] = Seq.empty,
    @JsonScalaEnumeration(classOf[DirectoryTypeRef]) directoryType: Option[DirectoryType] = None,
    sorts: Array[Sort] = Array.empty,
    from: Int = 0,
    size: Int = 1000,
    @Inject request: Request = null
) extends LoggedInRequest
    with PageRequest
    with SortRequest

case class CreateDirectoryRequest(
    name: String,
    parentId: DirectoryId,
    isRemoved: Boolean = false,
    @JsonScalaEnumeration(classOf[DirectoryTypeRef])
    directoryType: DirectoryType = DirectoryType.Directory,
    dashboardId: Option[Long] = None,
    data: Option[Map[String, Any]] = None,
    @Inject request: Request = null
) extends LoggedInRequest

case class UpdateDirectoryRequest(
    @RouteParam @Min(0) id: DirectoryId,
    data: Option[Map[String, Any]] = None,
    @Inject request: Request = null
) extends LoggedInRequest

case class RenameDirectoryRequest(@RouteParam @Min(0) id: DirectoryId, toName: String, @Inject request: Request = null)
    extends LoggedInRequest

case class MoveDirectoryRequest(
    @RouteParam @Min(0) id: DirectoryId,
    toParentId: DirectoryId,
    @Inject request: Request = null
) extends LoggedInRequest

case class GetDirectoryRequest(@RouteParam id: DirectoryId, @Inject request: Request = null) extends LoggedInRequest

case class EditDirectoryRequest(@RouteParam @Min(0) id: DirectoryId, @Inject request: Request = null)
    extends LoggedInRequest

case class DeleteDirectoryRequest(@RouteParam @Min(0) id: DirectoryId, @Inject request: Request = null)
    extends LoggedInRequest

case class GetRootDirectoryRequest(@Inject request: Request = null) extends LoggedInRequest

case class DeleteUserDataRequest(
    @RouteParam @NotEmpty username: String,
    transferToEmail: Option[String] = None,
    @Inject request: Request = null
) extends LoggedInRequest
