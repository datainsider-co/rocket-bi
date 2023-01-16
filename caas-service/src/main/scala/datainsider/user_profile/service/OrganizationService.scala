package datainsider.user_profile.service

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.admin.service.AdminUserService
import datainsider.client.domain.org.Organization
import datainsider.client.exception.{BadRequestError, InternalError, NotFoundError}
import datainsider.client.util.ZConfig
import datainsider.user_caas.domain.Page
import datainsider.user_caas.repository.UserRepository
import datainsider.user_profile.controller.http.request.{CreateOrganizationRequest, RegisterOrgRequest}
import datainsider.user_profile.domain.Implicits._
import datainsider.user_profile.repository.OrganizationRepository
import datainsider.user_profile.service.verification.ChannelService
import datainsider.user_profile.util.JsonParser
import education.x.commons.I32IdGenerator
import org.nutz.ssdb4j.spi.SSDB
import scalaj.http.{Http, HttpResponse}

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.matching.Regex

/**
  * @author andy
  * @since 8/17/20
  * */
trait OrganizationService {

  def isExists(organizationId: Long): Future[Boolean]

  def createOrganization(request: CreateOrganizationRequest): Future[Organization]

  def getOrganization(organizationId: Long): Future[Option[Organization]]

  def getOrganizations(organizationIds: Seq[Long]): Future[Map[Long, Organization]]

  def deleteOrganization(organizationId: Long): Future[Boolean]

  def isOrganizationMember(organizationId: Long, username: String): Future[Boolean]

  def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]]

  def getByDomain(domain: String): Future[Organization]

  def register(request: RegisterOrgRequest): Future[Organization]

  def isDomainValid(domain: String): Future[Boolean]

  def updateDomain(orgId: Long, newDomain: String): Future[Boolean]

  def update(orgId: Long, name: String, thumbnailUrl: String, updatedBy: String): Future[Organization]
}

case class OrganizationServiceImpl(
    idGenerator: I32IdGenerator,
    organizationRepository: OrganizationRepository,
    userRepository: UserRepository,
    adminUserService: AdminUserService,
    client: SSDB,
    emailChannel: ChannelService,
    defaultOrganizationId: Long
) extends OrganizationService
    with Logging {

  private val CDP_DOMAIN_PREFIX = ZConfig.getString("org_setting.cdp_domain_prefix", "cdp-")

  override def isExists(organizationId: Long): Future[Boolean] = {
    Future {
      organizationRepository.isExists(organizationId)
    }
  }

  override def createOrganization(request: CreateOrganizationRequest): Future[Organization] = {
    val organization: Organization = request.buildOrganization()
    val isCreated: Boolean = organizationRepository.insertOrganization(organization)
    if (isCreated) {
      organization
    } else {
      throw InternalError(s"Fail to create organization: $organization")
    }
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
      org <- organizationRepository.getOrganization(organizationId)
      deleted <-
        organizationRepository
          .deleteOrganization(organizationId)
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
      _ <- isRecaptchaValid(request.reCaptchaToken)
      _ <- isDomainValid(request.subDomain)
      org <- doRegister(request)
    } yield org
  }

  override def updateDomain(orgId: Long, newDomain: String): Future[Boolean] = {
    for {
      _ <- isDomainValid(newDomain)
      org = organizationRepository.getOrganization(orgId)
      orgUpdated = organizationRepository.update(org.copy(domain = newDomain))
    } yield orgUpdated
  }

  private def doRegister(request: RegisterOrgRequest): Future[Organization] = {
    for {
      orgId <- idGenerator.getNextId().map(generatedIdShouldExists).asTwitter
      ownerId <- adminUserService.createAdminAccount(orgId, request.toCreateAdminAccountReq)
      organization <- createOrganization(request.toCreateOrganizationReq(orgId, ownerId, request.subDomain))
      permissionAdded <- adminUserService.assignAdminPermissions(organization.organizationId, ownerId)
    } yield {
      if (permissionAdded) organization
      else throw InternalError(s"assign admin permission failed for user $ownerId, org $organization")
    }
  }

  override def isDomainValid(domain: String): Future[Boolean] = {
    if (domain.startsWith(CDP_DOMAIN_PREFIX)) {
      throw BadRequestError(s"Invalid domain name, domain can not start with '$CDP_DOMAIN_PREFIX' word.")
    }

    organizationRepository.getByDomain(domain) match {
      case None      => true
      case Some(org) => throw BadRequestError(s"domain $domain is already existed")
    }
  }

  private def isRecaptchaValid(token: Option[String]): Future[Boolean] = {
    token match {
      case Some(value) =>
        validateRecaptchaToken(value).map(isTokenValid =>
          if (!isTokenValid) {
            throw BadRequestError("invalid recaptcha token")
          } else true
        )
      case None => throw BadRequestError("missing recaptcha token")
    }
  }

  private def validateRecaptchaToken(token: String): Future[Boolean] =
    Future {
      try {
        val path = ZConfig.getString("recaptcha.host")
        val secret = ZConfig.getString("recaptcha.secret")
        val response: HttpResponse[String] = Http(path)
          .postData("")
          .param("secret", secret)
          .param("response", token)
          .asString

        val jsonResp: JsonNode = JsonParser.fromJson[JsonNode](response.body)
        jsonResp.get("success").booleanValue()
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
          thumbnailUrl = thumbnailUrl,
          updatedBy = updatedBy
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
}
