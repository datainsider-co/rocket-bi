package co.datainsider.caas.user_profile.service.verification

import co.datainsider.bi.util.LoggerUtils
import co.datainsider.caas.user_profile.domain.Implicits._
import co.datainsider.caas.user_profile.domain.profile.VerifyCodeInfo
import co.datainsider.caas.user_profile.repository.KeyValueRepository
import co.datainsider.caas.user_profile.repository.SSDBKeyValueRepository.KeyValueRepositoryAsync
import co.datainsider.caas.user_profile.service.UserProfileService
import co.datainsider.caas.user_profile.util.{JsonParser, Utils}
import com.google.inject.name.Named
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import co.datainsider.caas.user_profile.domain.user.UserProfile
import datainsider.client.exception.{InternalError, QuotaExceedError, VerificationCodeInvalidError}
import co.datainsider.bi.util.ZConfig

import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.UUID
import javax.inject.Inject

/**
  * @author sonpn
  * @since 01/12/2020 andy
  */
case class VerificationConfig(
    verifyUrl: String,
    defaultTestCode: String,
    expireTimeInSecond: Int,
    quota: Int,
    quotaCountdown: Int
)

case class EmailVerifyService @Inject() (
    @Named("token_code_repo") tokenRepository: KeyValueRepository[String, String],
    @Named("quota_repo") quotaRepository: KeyValueRepository[String, Int],
    emailFactory: EmailFactory,
    emailChannel: ChannelService,
    verificationConfig: VerificationConfig,
    profileService: UserProfileService
) extends VerifyService
    with Logging {

  private val trackLogger = LoggerUtils.getLogger("SendCodeViaEmailLogger")

  override def resendVerifyCode(organizationId: Long, email: String): Future[Boolean] = {
    profileService
      .getUserProfileByEmail(organizationId, email)
      .flatMap(sendVerifyCode(email, _))
  }

  override def sendVerifyCode(email: String, userProfile: UserProfile): Future[Boolean] = {
    for {
      code <- genCode(email)
      verifyUrl = createDirectVerifyUrl(email, code)
      (title, msg) = emailFactory.buildRegisterVerificationEmail(userProfile, code, verifyUrl)
      _ <- sendVerifyCodeToEmail(email, code, title, msg).rescue {
        case ex => throw InternalError(s"Can't send email verify code at the moment.", ex)
      }
      _ <- incrQuota(email)
    } yield {
      true
    }
  }

  private def createDirectVerifyUrl(email: String, code: String): String = {
    val token = Utils.encrypt(
      JsonParser.toJson(
        VerifyCodeInfo(
          email,
          code,
          System.currentTimeMillis()
        ),
        false
      )
    )
    s"${verificationConfig.verifyUrl}/user/auth/verify_link?token=${URLEncoder.encode(token, StandardCharsets.UTF_8.toString())}"
  }

  override def isExceedQuota(email: String): Future[Boolean] = {
    val key = buildQuotaKey(email)
    for {
      r <- quotaRepository.asyncGet(key)
      count = r.getOrElse(0)
    } yield count > verificationConfig.quota
  }

  override def incrQuota(email: String): Future[Unit] = {
    val quotaKey = buildQuotaKey(email)
    for {
      count <-
        quotaRepository
          .asyncIncr(quotaKey, 1)
          .transform({
            case Return(r) => Future.value(r)
            case Throw(e) =>
              logger.error(s"Error to incr quota for $email", e)
              Future.exception(e)
          })
    } yield count >= verificationConfig.quota match {
      case true =>
        quotaRepository.expire(quotaKey, verificationConfig.quotaCountdown)
      case _ =>
    }
  }

  override def sendForgotPasswordCode(organizationId: Long, email: String): Future[Boolean] = {
    for {
      code <- genCode(email)
      userProfile <- profileService.getUserProfileByEmail(organizationId, email)
      (subject, msg) = emailFactory.buildForgotPasswordVerificationEmail(userProfile, code)
      r <- sendVerifyCodeToEmail(email, code, subject, msg).transform({
        case Return(r) => Future.True
        case Throw(e) =>
          logger.error(s"Can't send code $code to $email", e)
          Future.False
      })
      _ <- if (r) incrQuota(email) else Future.Unit
    } yield r match {
      case true => r
      case _    => throw InternalError(Some(s"Can't send email to $email."))
    }
  }

  private def sendVerifyCodeToEmail(email: String, code: String, subject: String, msg: String): Future[Unit] = {

    val uuid = UUID.randomUUID().toString

    val codeInfo = VerifyCodeInfo(email, code, System.currentTimeMillis())
    val data: String = JsonParser.toJson[VerifyCodeInfo](codeInfo)
    emailChannel
      .sendHtmlMessage(email, subject, msg)
      .onSuccess(_ => trackLogger.info(s"1\t$uuid"))
      .onFailure(fn => trackLogger.info(s"-1\t$uuid\t${fn.getMessage}"))
      .map(f => {
        tokenRepository
          .asyncPut(buildMessageKey(uuid), data)
          .onFailure(fn => logger.error(s"Failed to save verify code info: [$data]", fn))
      })
  }

  private def genCode(email: String): Future[String] = {
    val codeKey = buildVerifyCodeKey(email)
    for {
      isExceedQuota <- isExceedQuota(email)
      code = isExceedQuota match {
        case true => {
          val quotaKey = buildQuotaKey(email)
          val timeLeft = quotaRepository.timeLeft(quotaKey)
          throw QuotaExceedError("Please try after : " + timeLeft.get + " seconds")
        }
        case _ => generateNewCode()
      }
      _ = tokenRepository.put(codeKey, code, Some(verificationConfig.expireTimeInSecond))
    } yield {
      code
    }
  }

  private def generateNewCode(): String = {
    if (ZConfig.isDevMode)
      verificationConfig.defaultTestCode
    else
      Utils.randomInt(100000, 999999).toString
  }

  /**
    * Raise an exception if fail
    */
  override def verifyCode(email: String, requestedCode: String, delete: Boolean): Future[Unit] = {
    val key = buildVerifyCodeKey(email)
    tokenRepository
      .asyncGet(key)
      .map {
        case Some(code) =>
          code.equals(requestedCode) match {
            case true => if (delete) tokenRepository.delete(key)
            case _ =>
              error(s"Your requested code ${requestedCode} != $code")
              throw VerificationCodeInvalidError(s"The code is invalid.")
          }
        case _ =>
          throw VerificationCodeInvalidError(s"No code was found.")
      }
  }

  override def deleteVerifyCode(phoneNum: String): Future[Unit] = {
    val key = buildVerifyCodeKey(phoneNum)
    tokenRepository.delete(key)
  }

  override def genTokenWithEmail(email: String): Future[String] = {
    val token = UUID.randomUUID().toString
    val key = buildTokenKey(token)
    for {
      _ <- tokenRepository.asyncPut(key, email)
      _ <-
        tokenRepository
          .asyncExpire(key, 3 * verificationConfig.expireTimeInSecond)
          .onFailure(ex => {
            tokenRepository.asyncDelete(key)
            throw ex
          })
    } yield token
  }

  override def verifyEmailToken(token: String, delete: Boolean): Future[String] = {
    val key = buildTokenKey(token)
    tokenRepository
      .asyncGet(key)
      .map {
        case Some(x) =>
          if (delete)
            tokenRepository.asyncDelete(key).onFailure(ex => logger.error("Failed to delete token phone info", ex))
          x
        case None => throw InternalError("Invalid token.")
      }
  }

  override def deleteEmailToken(token: String): Future[Unit] = {
    val key = buildTokenKey(token)
    tokenRepository.asyncDelete(key).onFailure(ex => logger.error("Failed to delete token phone info", ex))
  }

  private def buildQuotaKey(email: String): String = s"quota-$email"

  private def buildVerifyCodeKey(email: String): String = s"verify-$email"

  private def buildTokenKey(token: String): String = s"token-email-$token"

  private def buildMessageKey(id: String): String = s"email-$id"

}
