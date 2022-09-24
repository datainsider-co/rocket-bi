package datainsider.user_profile.service.verification

import com.twitter.finatra.mustache.marshalling.MustacheService
import com.twitter.util.Future
import datainsider.client.domain.user.UserProfile

/**
  * @author anhlt
  */
trait VerifyService {

  def isExceedQuota(receiver: String): Future[Boolean]

  def incrQuota(receiver: String): Future[Unit]

  def resendVerifyCode(organizationId: Long, receiver: String): Future[Boolean]

  def sendVerifyCode(receiver: String, userProfile: UserProfile): Future[Boolean]

  def sendForgotPasswordCode(organizationId: Long, receiver: String): Future[Boolean]

  def verifyCode(receiver: String, code: String, delete: Boolean): Future[Unit]

  def deleteVerifyCode(receiver: String): Future[Unit]

  def genTokenWithEmail(receiver: String): Future[String]

  def verifyEmailToken(token: String, delete: Boolean): Future[String]

  def deleteEmailToken(token: String): Future[Unit]
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
}

case class MustacheEmailFactory(
    mustacheService: MustacheService,
    registerVerificationTitle: String,
    forgotPasswordVerificationEmailTitle: String,
    registerVerificationMustache: String,
    resetPasswordTitle: String,
    resetPasswordMustache: String,
    forgotPasswordCodeTemplate: String
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

}
