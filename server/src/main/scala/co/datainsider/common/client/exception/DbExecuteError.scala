package co.datainsider.common.client.exception

case class DbExecuteError(
    message: String,
    cause: Throwable = null
) extends DIException(message, cause) {

  override val reason = DIErrorReason.DbExecuteError
  override def getStatus = com.twitter.finagle.http.Status.InternalServerError
}

case class DbExistError(
    message: String,
    cause: Throwable = null
) extends DIException(message, cause) {
  override val reason = DIErrorReason.DbExisted
  override def getStatus = com.twitter.finagle.http.Status.NotFound
}

case class DbNotFoundError(
    message: String,
    cause: Throwable = null
) extends DIException(message, cause) {

  override val reason = DIErrorReason.DbNotFound
  override def getStatus = com.twitter.finagle.http.Status.NotFound
}

case class TableNotFoundError(
    message: String,
    cause: Throwable = null
) extends DIException(message, cause) {

  override val reason = DIErrorReason.TableNotFound
  override def getStatus = com.twitter.finagle.http.Status.NotFound
}
