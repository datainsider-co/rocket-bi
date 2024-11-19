package co.datainsider.common.client.exception

import com.twitter.finagle.http.Status

/**
  * @author anhlt
  */
object DIErrorReason {
  val InvalidCredentials = "invalid_credentials"
  val EmailExisted = "email_existed"
  val EmailNotExisted = "email_not_existed"
  val EmailInvalid = "email_invalid"
  val EmailRequired = "email_required"

  val EmailVerificationRequired = "email_verification_required"
  val AuthTypeUnsupported = "auth_type_unsupported"
  val PhoneExisted = "phone_existed"
  val PhoneInvalid = "phone_invalid"
  val PhoneNotExisted = "phone_not_existed"
  val PhoneRequired = "phone_required"
  val QuotaExceed = "quota_exceed"
  val RegistrationRequired = "registration_required"
  val VerificationCodeInvalid = "verification_code_invalid"

  val NotAuthenticated = "not_authenticated"
  val Unauthorized = "not_allowed"
  val NotFound = "not_found"
  val UserProfileNotFound = "profile_not_found"
  val OrganizationNotFound = "organization_not_found"
  val NotOrganizationMember = "not_organization_member"
  val AlreadyExisted = "already_existed"
  val NotSupported = "not_supported"
  val DbExecuteError = "db_execute_error"
  val DbExisted = "db_existed"
  val DbNotFound = "db_not_found"
  val TableNotFound = "table_not_found"
  val Expired = "expired"
  val InsufficientPermission = "insufficient_permission"
  val BadRequest = "bad_request"
  val InternalError = "internal_error"
}

abstract class DIException(
    message: String,
    cause: Throwable = null
) extends Exception(Option(message).getOrElse("Internal error"), cause) {

  val reason: String

  def getStatus: Status
}
