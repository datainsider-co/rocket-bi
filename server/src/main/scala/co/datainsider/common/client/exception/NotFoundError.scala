package co.datainsider.common.client.exception

case class NotFoundError(message: String = "Not Found", cause: Throwable = null) extends DIException(message, cause) {
  override val reason = DIErrorReason.NotFound
  override def getStatus = com.twitter.finagle.http.Status.NotFound
}

case class ProfileNotFoundError(message: String = "Profilee Not Found", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.UserProfileNotFound
  override def getStatus = com.twitter.finagle.http.Status.NotFound
}

case class NotOrganizationMemberError(message: String = "Not A Member Of This Organization", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.NotOrganizationMember
  override def getStatus = com.twitter.finagle.http.Status.NotFound
}

case class OrganizationNotFoundError(message: String = "Organization Not Found", cause: Throwable = null)
    extends DIException(message, cause) {
  override val reason = DIErrorReason.OrganizationNotFound
  override def getStatus = com.twitter.finagle.http.Status.NotFound
}
