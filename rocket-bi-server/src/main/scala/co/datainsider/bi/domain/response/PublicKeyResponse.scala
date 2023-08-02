package co.datainsider.bi.domain.response

/**
  * created 2023-07-28 11:44 AM
  * @author tvc12 - Thien Vi
  */
case class PublicKeyResponse(
    isExists: Boolean,
    publicKey: Option[String] = None
)
