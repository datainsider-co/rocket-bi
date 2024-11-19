package co.datainsider.common.client.exception

case class AlreadyExistError(message: String, cause: Throwable = null) extends DIException(message, cause) {

  override val reason = DIErrorReason.AlreadyExisted

  override def getStatus = com.twitter.finagle.http.Status.Conflict
}
