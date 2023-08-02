package co.datainsider.jobworker.exception

/**
  * created 2022-09-12 5:04 PM
  *
  * @author tvc12 - Thien Vi
  */
case class CreateJobProgressException(message: String, cause: Throwable = null)
    extends ReaderException(message, cause) {
  override val reason: String = BaseException.CreateJobProgressException
}
