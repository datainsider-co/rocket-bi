package co.datainsider.caas.user_profile.service

import co.datainsider.bi.client.MailChimpClient
import co.datainsider.bi.util.{LoggerUtils, ZConfig}
import co.datainsider.caas.admin.service.AdminUserService
import co.datainsider.caas.user_caas.domain.Page
import co.datainsider.caas.user_caas.repository.UserRepository
import co.datainsider.caas.user_profile.controller.http.request.{CreateOrganizationRequest, RegisterOrgRequest}
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.repository.OrganizationRepository
import co.datainsider.caas.user_profile.service.verification.{ChannelService, EmailFactory, VerifyService}
import co.datainsider.caas.user_profile.util.JsonParser
import co.datainsider.license.service.LicenseClientService
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import co.datainsider.bi.util.Implicits.RichScalaFuture
import co.datainsider.common.client.exception.{BadRequestError, InternalError, NotFoundError}
import education.x.commons.I32IdGenerator
import scalaj.http.{Http, HttpResponse}

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.matching.Regex

/**
  * @author andy
  * @since 8/17/20
  */
trait OrganizationService {

  def isExists(organizationId: Long): Future[Boolean]

  def createOrganization(request: CreateOrganizationRequest): Future[Organization]

  def getOrganization(organizationId: Long): Future[Option[Organization]]

  def getOrganizations(organizationIds: Seq[Long]): Future[Map[Long, Organization]]

  def deleteOrganization(organizationId: Long): Future[Boolean]

  @deprecated("will be removed in next version")
  def isOrganizationMember(organizationId: Long, username: String): Future[Boolean]

  def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]]

  def getAllOrganizations(): Future[Seq[Organization]]

  def getByDomain(domain: String): Future[Organization]

  def getByLicenseKey(licenseKey: String): Future[Organization]

  def register(request: RegisterOrgRequest): Future[Organization]

  def sendVerifyCode(email: String): Future[Boolean]

  def verify(email: String, code: String, delete: Boolean): Future[Unit]

  def isDomainValid(domain: String): Future[Boolean]

  def updateDomain(orgId: Long, newDomain: String): Future[Boolean]

  def update(orgId: Long, name: String, thumbnailUrl: String, updatedBy: String): Future[Organization]
}

case class OrganizationServiceImpl(
    idGenerator: I32IdGenerator,
    organizationRepository: OrganizationRepository,
    userRepository: UserRepository,
    adminUserService: AdminUserService,
    defaultOrganizationId: Long,
    licenseClientService: LicenseClientService,
    verifyService: VerifyService,
    emailFactory: EmailFactory,
    channelService: ChannelService,
) extends OrganizationService
    with Logging {

  private val trackLogger = LoggerUtils.getLogger("SendCodeViaEmailLogger")

  private val CDP_DOMAIN_PREFIX = ZConfig.getString("org_setting.cdp_domain_prefix", "cdp-")
  private val enableNotify = ZConfig.getBoolean("org_setting.enable_notify_new_register", true)

  override def isExists(organizationId: Long): Future[Boolean] = {
    Future {
      organizationRepository.isExists(organizationId)
    }
  }

  override def createOrganization(request: CreateOrganizationRequest): Future[Organization] = {
    val organization: Organization = request.buildOrganization()
    Future(organizationRepository.insertOrganization(organization)).map(isCreated => {
      if (isCreated) {
        organization
      } else {
        throw InternalError(s"Fail to create organization: $organization")
      }
    })
  }

  private def generatedIdShouldExists(id: Option[Int]) = {
    id match {
      case Some(value) => value
      case None        => throw InternalError("Can't generate new id for organization")
    }
  }

  override def getOrganization(organizationId: Long): Future[Option[Organization]] =
    Future {
      organizationRepository.getOrganization(organizationId)
    }

  override def getOrganizations(organizationIds: Seq[Long]): Future[Map[Long, Organization]] =
    Future {
      organizationRepository.getOrganizations(organizationIds)
    }

  override def deleteOrganization(organizationId: Long): Future[Boolean] = {
    for {
      org <- Future(organizationRepository.getOrganization(organizationId))
      deleted <- Future(
        organizationRepository
          .deleteOrganization(organizationId)
      )
        .transform({
          case Return(r) => Future.True
          case Throw(e) =>
            error(s"Exception in deleteOrganization( $organizationId)", e)
            Future.False
        })
    } yield deleted
  }

  override def isOrganizationMember(organizationId: Long, username: String): Future[Boolean] =
    Future {
      userRepository.isExistUser(organizationId, username)
    }

  override def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]] =
    Future {
      organizationRepository.getAllOrganizations(from, size)
    }

  override def getAllOrganizations(): Future[Seq[Organization]] =
    Future {
      organizationRepository.getAllOrganizations()
    }

  override def getByDomain(domain: String): Future[Organization] =
    Future {
      val originalDomain: String = getOriginalDomain(domain)

      organizationRepository.getByDomain(originalDomain) match {
        case Some(organization) => organization
        case None =>
          logger.debug(s"Organization with domain $domain not found, use default organization")
          getDefaultOrganization()
      }
    }

  override def getByLicenseKey(licenseKey: String): Future[Organization] =
    Future {
      organizationRepository.list(licenseKey = Some(licenseKey)).headOption match {
        case Some(org) => org
        case _         => throw BadRequestError(s"not found org with license key $licenseKey")
      }
    }

  /**
    * get organization default for single tenant
    */
  @throws[NotFoundError]("if organization not found")
  private def getDefaultOrganization(): Organization = {
    organizationRepository.getOrganization(defaultOrganizationId) match {
      case Some(organization) => organization
      case None               => throw NotFoundError(s"Organization not found")
    }
  }

  override def register(request: RegisterOrgRequest): Future[Organization] = {
    for {
      _ <- ensureReCaptcha(request.reCaptchaToken)
      _ <- isDomainValid(request.subDomain)
      _ <- verify(request.workEmail, request.verifyCode, delete = true)
      org <- doRegister(request)
      _ <- onRegisterSuccess(org, request)
    } yield org
  }

  private def onRegisterSuccess(org: Organization, request: RegisterOrgRequest): Future[Unit] =
    Future {
      if (enableNotify) {
        licenseClientService.notify(s"New org registered:\n${JsonParser.toJson(org)}").rescue {
          case e =>
            error(e)
            Future.Unit
        }
        Future(MailChimpClient().subscribe(request.workEmail, request.firstName, request.lastName)).rescue {
          case e =>
            error(e)
            Future.Unit
        }
      }
    }

  override def updateDomain(orgId: Long, newDomain: String): Future[Boolean] = {
    for {
      _ <- isDomainValid(newDomain)
      org = organizationRepository.getOrganization(orgId).get
      orgUpdated = organizationRepository.update(org.copy(domain = newDomain))
    } yield orgUpdated
  }

  private def doRegister(request: RegisterOrgRequest): Future[Organization] = {
    for {
      orgId <- idGenerator.getNextId().map(generatedIdShouldExists).asTwitterFuture
      organization <- createOrganization(request.toCreateOrganizationReq(orgId, request.workEmail, request.subDomain))
      _ <- licenseClientService.createTrialSubscription(organization.licenceKey)
      ownerId <- adminUserService.createAdminAccount(orgId, request.toCreateAdminAccountReq)
      permissionAdded <- adminUserService.assignAdminPermissions(organization.organizationId, ownerId)
    } yield {
      if (permissionAdded) organization
      else throw InternalError(s"assign admin permission failed for user $ownerId, org $organization")
    }
  }

  override def isDomainValid(domain: String): Future[Boolean] =
    Future {
      if (domain.startsWith(CDP_DOMAIN_PREFIX)) {
        throw BadRequestError(s"Invalid domain name, domain can not start with '$CDP_DOMAIN_PREFIX' word.")
      }

      organizationRepository.getByDomain(domain) match {
        case None      => true
        case Some(org) => throw BadRequestError(s"domain $domain is already existed")
      }
    }

  private def ensureReCaptcha(token: Option[String]): Future[Unit] = {
    token match {
      case Some(value) =>
        validateRecaptchaToken(value).map(isTokenValid =>
          if (!isTokenValid) {
            throw BadRequestError("invalid recaptcha token")
          }
        )
      case None => throw BadRequestError("missing recaptcha token")
    }
  }

  private def validateRecaptchaToken(token: String): Future[Boolean] =
    Future {
      try {
        val path = ZConfig.getString("recaptcha.host")
        val secret = ZConfig.getString("recaptcha.secret")

        if (secret.nonEmpty) {
          val response: HttpResponse[String] = Http(path)
            .postData("")
            .param("secret", secret)
            .param("response", token)
            .asString

          val jsonResp: JsonNode = JsonParser.fromJson[JsonNode](response.body)
          jsonResp.get("success").booleanValue()
        } else true
      } catch {
        case e: Throwable => throw InternalError(s"error when validate recaptcha token: $e")
      }
    }

  override def update(
      orgId: Long,
      name: String,
      thumbnailUrl: String,
      updatedBy: String
  ): Future[Organization] =
    Future {
      try {
        val oldOrganization: Organization = fetch(orgId)
        val newOrganization: Organization = oldOrganization.copy(
          name = name,
          thumbnailUrl = Some(thumbnailUrl),
          updatedBy = Some(updatedBy)
        )
        organizationRepository.update(newOrganization)
        newOrganization
      } catch {
        case ex: NotFoundError => throw ex
        case ex: Throwable =>
          logger.error(s"Error when update organization metadata: $ex", ex)
          throw InternalError(s"error when update organization metadata: $ex")
      }
    }

  /**
    * @throws NotFoundError if organization not found
    */
  private def fetch(orgId: Long): Organization = {
    organizationRepository.getOrganization(orgId) match {
      case Some(organization) => organization
      case None               => throw NotFoundError(s"organization with id $orgId not found")
    }
  }

  private def getOriginalDomain(domain: String): String = {
    val cdpDomainRegex: Regex = raw"""^$CDP_DOMAIN_PREFIX\w+$$""".r

    cdpDomainRegex.findFirstMatchIn(domain) match {
      case Some(value) => domain.drop(CDP_DOMAIN_PREFIX.length) // remove 'cdp-'
      case None        => domain
    }
  }

  override def sendVerifyCode(email: String): Future[Boolean] = {
    for {
      code <- verifyService.createVerifyCode(email)
      _ <- sendVerifyCodeToEmail(email, code)
    } yield true
  }

  private def sendVerifyCodeToEmail(email: String, code: String): Future[Unit] = {
    val (title, msg) = emailFactory.buildVerifyCodeEmail(code)
    channelService.sendHtmlMessage(email, title, msg)
      .onSuccess(_ => trackLogger.info(s"Send verify code to $email success"))
      .onFailure(ex => trackLogger.info(s"Send verify code to $email failed", ex))
  }

  override def verify(email: String, code: String, delete: Boolean): Future[Unit] = {
    verifyService.verifyCode(email, code, delete)
  }
}
