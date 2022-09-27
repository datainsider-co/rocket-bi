package datainsider.schema.domain

/**
  * created 2022-07-19 11:31 AM
  *
  * @author tvc12 - Thien Vi
  */

@SerialVersionUID(20220719L)
case class RefreshConfig(
    // bo qua cac engine co trong list nay
    ignoredEngines: Seq[String]
)
