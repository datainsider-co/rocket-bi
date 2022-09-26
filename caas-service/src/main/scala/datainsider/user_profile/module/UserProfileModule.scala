package datainsider.user_profile.module

import com.google.inject.{Provides, Singleton}
import com.sendgrid.SendGrid
import com.twitter.finatra.mustache.marshalling.MustacheService
import com.twitter.finatra.mustache.modules.MustacheFactoryModule
import com.twitter.inject.TwitterModule
import datainsider.admin.service.{AdminUserService, AdminUserServiceImpl}
import datainsider.client.util.{JdbcClient, ZConfig}
import datainsider.user_profile.repository.{OrganizationMemberRepository, _}
import datainsider.user_profile.service.verification._
import datainsider.user_profile.service.{OrganizationService, RegistrationService, _}
import education.x.commons.I32IdGenerator
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Named

/**
  * @author anhlt
  */

object UserProfileModule extends TwitterModule {

  override val modules = Seq(MustacheFactoryModule)

  protected override def configure(): Unit = {
    super.configure()

    bind[AuthService].to[AuthServiceImpl].asEagerSingleton()
    bind[RegistrationService].to[RegistrationServiceImpl].asEagerSingleton()
    bind[VerifyService].to[EmailVerifyService].asEagerSingleton()

    bind[UserProfileService].to[UserProfileServiceImpl].asEagerSingleton()
    bind[OrganizationService].to[OrganizationServiceImpl].asEagerSingleton()
    bind[DnsService].to[CloudflareDnsService].asEagerSingleton()

    //Admin services
    bind[AdminUserService].to[AdminUserServiceImpl].asEagerSingleton()
  }

  @Singleton
  @Provides
  def providesVerificationConfig(): VerificationConfig = {
    val verifyLinkHost = ZConfig.getString("verification.email.verify_link_host")
    val defaultTestCode = ZConfig.getString("verification.email.default_test_code", "1234")
    val expireTimeInSecond = ZConfig.getInt("verification.email.code_expire_time_in_second", 3 * 60)
    val quota = ZConfig.getInt("verification.email.limit_quota", 6)
    val quotaCountdown = ZConfig.getInt("verification.email.limit_countdown_in_second", 900)

    VerificationConfig(
      verifyLinkHost,
      defaultTestCode,
      expireTimeInSecond = expireTimeInSecond,
      quota,
      quotaCountdown
    )
  }

  @Singleton
  @Provides
  @Named("EnableSendSmsToPhone")
  def providesEnableSendSmsToPhoneConfig(): Boolean = ZConfig.getBoolean("sms.enable", default = true)

  @Singleton
  @Provides
  def providesUserProfileRepository(@Named("caas_jdbc_client") client: JdbcClient): UserProfileRepository = {
    MySqlUserProfileRepository(client)
  }

  @Singleton
  @Provides
  def providesOrganizationRepository(@Named("caas_jdbc_client") client: JdbcClient): OrganizationRepository = {
    MySqlOrganizationRepository(client)
  }

  @Singleton
  @Provides
  def providesUserOrganizationRepository(
      @Named("caas_jdbc_client") client: JdbcClient
  ): OrganizationMemberRepository = {
    MySqlOrganizationMemberRepository(client)
  }

  @Singleton
  @Provides
  @Named("email_to_user_id_mapping")
  def providesEmailUserMapping(ssdb: SSDB): UserIdMapping = {
    val emailKey = ZConfig.getString("db.ssdb.email_key")
    EmailUserMappingImpl(ssdb, emailKey)
  }

  @Singleton
  @Provides
  @Named("phone_to_user_id_mapping")
  def providesPhoneUserMapping(ssdb: SSDB): UserIdMapping = {
    val phoneNumberKey = ZConfig.getString("db.ssdb.phone_number_key")
    PhoneUserMappingImpl(ssdb, phoneNumberKey)
  }

  @Singleton
  @Provides
  def providesOrganizationIdGenerator(ssdb: SSDB): I32IdGenerator = {
    I32IdGenerator("datainsider.id_generator", "organization", ssdb)
  }

  @Singleton
  @Provides
  @Named("quota_repo")
  def providesPhoneQuotaRepo(ssdb: SSDB): KeyValueRepository[String, Int] = {
    new QuotaRepository(ssdb)
  }

  @Singleton
  @Provides
  @Named("token_code_repo")
  def providesTokenCodeRepo(ssdb: SSDB): KeyValueRepository[String, String] = {
    new TokenCodeRepository(ssdb)
  }

  @Singleton
  @Provides
  def providesEmailFactory(mustacheService: MustacheService): EmailFactory = {
    MustacheEmailFactory(
      mustacheService,
      ZConfig.getString("verification.email.email_title"),
      ZConfig.getString("verification.email.email_forgot_password_title"),
      "registration_confirm_email.mustache",
      ZConfig.getString("verification.email.password_reset_title"),
      "success_reset_password_email.mustache",
      ZConfig.getString("verification.email.forgot_password_message_template")
    )
  }

  @Singleton
  @Provides
  def providesChannelService(): ChannelService = {
    val apiKey = ZConfig.getString("verification.email.send_grid.api_key")
    val senderEmail = ZConfig.getString("verification.email.sender")
    SendGridEmailService(new SendGrid(apiKey), senderEmail)
  }

}
