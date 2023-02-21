package datainsider.ingestion.domain

import datainsider.client.domain.user.UserProfile
case class PageResult[T](total: Long, data: Seq[T])

case class SharingInfo(
    id: String,
    username: String,
    resourceId: String,
    resourceType: String,
    createdAt: Option[Long] = None,
    updatedAt: Option[Long] = None,
    createdBy: Option[String] = None,
    isDeleted: Boolean = false
) {
  def createUserSharingInfo(user: UserProfile, permissions: Seq[String]): UserSharingInfo = {
    UserSharingInfo(
      id = id,
      user = user,
      permissions = permissions,
      createdAt = createdAt,
      updatedAt = updatedAt,
      createdBy = createdBy,
      updatedBy = None
    )
  }

}

case class UserSharingInfo(
    id: String,
    user: UserProfile,
    permissions: Seq[String],
    createdAt: Option[Long] = None,
    updatedAt: Option[Long] = None,
    createdBy: Option[String] = None,
    updatedBy: Option[String] = None
)

case class ResourceInfo(
    owner: Option[UserProfile],
    totalUserSharing: Long,
    usersSharing: Seq[UserSharingInfo]
)
