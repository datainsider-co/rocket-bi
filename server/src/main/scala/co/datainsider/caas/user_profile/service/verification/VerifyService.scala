package co.datainsider.caas.user_profile.service.verification

import co.datainsider.caas.user_profile.domain.user.UserProfile
import com.twitter.finatra.mustache.marshalling.MustacheService
import com.twitter.util.Future
import co.datainsider.common.client.exception.{QuotaExceedError, VerificationCodeInvalidError}

/**
  * @author anhlt
  */
trait VerifyService {

  def isExceedQuota(receiver: String): Future[Boolean]

  def incrQuota(receiver: String): Future[Unit]

  def resendVerifyCode(organizationId: Long, receiver: String): Future[Boolean]

  @deprecated("unused code, will be removed in next release")
  def sendVerifyCode(receiver: String, userProfile: UserProfile): Future[Boolean]

  def sendForgotPasswordCode(organizationId: Long, receiver: String): Future[Boolean]

  @throws[QuotaExceedError]("when quota exceed")
  def createVerifyCode(receiver: String): Future[String]

  @throws[VerificationCodeInvalidError]("when code is invalid")
  def verifyCode(receiver: String, code: String, delete: Boolean): Future[Unit]

  def deleteVerifyCode(receiver: String): Future[Unit]
}

case class ResetPasswordMustacheData(name: String, new_password: String, login_url: String)

case class RegisterVerificationMustacheData(name: String, verification_code: String, direct_verify_url: String)

trait EmailFactory {

  def buildRegisterVerificationEmail(userProfile: UserProfile, verifyCode: String, verifyUrl: String): (String, String)

  def buildPasswordResetEmail(userProfile: UserProfile, password: String, loginUrl: String): (String, String)

  def buildForgotPasswordVerificationEmail(
      userProfile: UserProfile,
      verifyCode: String
  ): (String, String)

  def buildVerifyCodeEmail(verifyCode: String): (String, String)
}

case class MustacheEmailFactory(
    mustacheService: MustacheService,
    registerVerificationTitle: String,
    forgotPasswordVerificationEmailTitle: String,
    registerVerificationMustache: String,
    resetPasswordTitle: String,
    resetPasswordMustache: String,
    forgotPasswordCodeTemplate: String,
    newOrgVerifyEmailTitle: String,
    newOrgVerifyEmailTemplate: String,
) extends EmailFactory {

  override def buildRegisterVerificationEmail(
      userProfile: UserProfile,
      verifyCode: String,
      verifyUrl: String
  ): (String, String) = {
    val body = mustacheService.createString(
      registerVerificationMustache,
      RegisterVerificationMustacheData(
        userProfile.fullName.getOrElse(userProfile.firstName.getOrElse("")),
        verifyCode,
        direct_verify_url = verifyUrl
      )
    )

    (registerVerificationTitle, body)
  }

  override def buildPasswordResetEmail(
      userProfile: UserProfile,
      password: String,
      loginUrl: String
  ): (String, String) = {
    val body = mustacheService.createString(
      resetPasswordMustache,
      ResetPasswordMustacheData(
        userProfile.fullName.getOrElse(userProfile.firstName.getOrElse("")),
        password,
        login_url = loginUrl
      )
    )

    (resetPasswordTitle, body)
  }

  override def buildForgotPasswordVerificationEmail(userProfile: UserProfile, verifyCode: String): (String, String) = {
    val body = forgotPasswordCodeTemplate.replaceFirst("\\$code", verifyCode)
    (forgotPasswordVerificationEmailTitle, body)
  }

  override def buildVerifyCodeEmail(verifyCode: String): (String, String) = {
    val body = newOrgVerifyEmailTemplate.replaceFirst("\\$code", verifyCode)
    (newOrgVerifyEmailTitle, body)
  }
}
