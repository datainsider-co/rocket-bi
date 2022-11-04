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

  @deprecated("unused method", "since 2022-09-14")
  def removeMember(organizationId: Long, username: String): Future[Boolean]

  @deprecated("unused method", "since 2022-09-14")
  def addMember(organizationId: Long, username: String, addBy: String): Future[Boolean]

  @deprecated("unused method, method incompatible sass", "since 2022-09-14")
  def getJoinedOrganizationIds(username: String): Future[Seq[Long]]

  @deprecated("unused method", "since 2022-09-14")
  def getJoinedOrganizations(username: String): Future[Seq[Organization]]

  @deprecated("unused method", "since 2022-09-14")
  def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]]

  def getWithDomain(domain: String): Future[Organization]

  /**
    * check if email already exists
    * check if sub domain name exists
    * validate reCaptcha
    * send activation email (not supported now)
    * create organization and admin account
    * @param request registration information
    * @return
    */
  def register(request: RegisterOrgRequest): Future[Organization]

  def isSubDomainExisted(subDomain: String): Future[Boolean]

  def updateDomain(orgId: Long, subDomain: String): Future[Boolean]
}

case class OrganizationServiceImpl (
    idGenerator: I32IdGenerator,
    organizationRepository: OrganizationRepository,
    userRepository: UserRepository,
    adminUserService: AdminUserService,
    client: SSDB,
    dnsService: DnsService,
    emailChannel: ChannelService,
    defaultOrganizationId: Long
) extends OrganizationService
    with Logging {

  override def isExists(organizationId: Long): Future[Boolean] = {
    Future {
      organizationRepository.isExists(organizationId)
    }
  }

  override def createOrganization(request: CreateOrganizationRequest): Future[Organization] = {
    for {
      organization <- buildAndCreateOrganization(request)
      isMemberAdded <- addMember(organization.organizationId, organization.owner, organization.owner)
    } yield isMemberAdded match {
      case true => organization
      case _ =>
        organizationRepository.deleteOrganization(organization.organizationId)
        throw InternalError(Some("Can't create this organization."))
    }
  }

  private def buildAndCreateOrganization(request: CreateOrganizationRequest): Future[Organization] = {
    val organization = request.buildOrganization()
    val isCreated = organizationRepository.insertOrganization(organization)
    if (isCreated) organization
    else throw InternalError(s"Fail to create organization: $organization")
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
      _ <- dnsService.delete(org.domain)
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

  override def addMember(organizationId: Long, username: String, addBy: String): Future[Boolean] = {
    Future.True
//    val orgMember = OrgMember(
//      organizationId = organizationId,
//      username = username,
//      addedBy = addBy,
//      addedTime = Some(System.currentTimeMillis())
//    )
//    userRepository
//      .insertOrgMember(orgMember)
//      .rescue({
//        case e =>
//          error(s"Exception in addMember($username, $organizationId, $addBy)", e)
//          Future.False
//      })
  }

  override def removeMember(organizationId: Long, username: String): Future[Boolean] = {
    Future.True
//    Future {
//      try {
//        userRepository.deleteOrgMember(organizationId, username)
//        true
//      } catch {
//        case e: Throwable =>
//          error(s"Exception in removeMember($username, $organizationId)", e)
//          false
//      }
//    }
  }

  override def getJoinedOrganizationIds(username: String): Future[Seq[Long]] = {
    Future { Seq() }
//    Future {
//      val orgMembers = userRepository.getOrgMembers(username)
//      orgMembers.map(_.organizationId)
//    }
  }

  override def getJoinedOrganizations(username: String): Future[Seq[Organization]] = {
    for {
      organizationIds <- getJoinedOrganizationIds(username)
      organizationMap = organizationRepository.getOrganizations(organizationIds)
    } yield {
      organizationIds
        .map(organizationMap.get)
        .filterNot(_.isEmpty)
        .map(_.get)
    }
  }

  override def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]] =
    Future {
      organizationRepository.getAllOrganizations(from, size)
    }

  override def getWithDomain(domain: String): Future[Organization] = Future {
      organizationRepository.getWith(domain) match {
        case Some(organization) => organization
        case None               =>
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
      _ <- isValidRecaptchaToken(request.reCaptchaToken)
      availableSubDomain <- findAvailableSubDomain(request.subDomain)
      org <- activate(request.copy(subDomain = availableSubDomain))
    } yield org
  }

  override def isSubDomainExisted(subDomain: String): Future[Boolean] = {
    val mainDomain = ZConfig.getString("cloudflare.main_domain")
    val domain = s"$subDomain.$mainDomain"
    dnsService.exists(domain)
  }

  private def getFullDomain(subDomain: String): String = {
    val mainDomain = ZConfig.getString("cloudflare.main_domain")
    s"$subDomain.$mainDomain"
  }

  override def updateDomain(orgId: Long, subDomain: String): Future[Boolean] = {
    val newDomain: String = getFullDomain(subDomain)
    for {
      _ <- isValidDomain(newDomain)
      org = organizationRepository.getOrganization(orgId)
      oldDomain = org.domain
      oldDomainRemoved <- dnsService.delete(oldDomain)
      createdDomain <- dnsService.create(newDomain)
      orgUpdated = organizationRepository.update(org.copy(domain = createdDomain))
    } yield {
      if (!oldDomainRemoved) {
        logger.error(s"remove sub domain $oldDomain failed")
        throw BadRequestError(s"remove sub domain $oldDomain failed")
      }
      orgUpdated
    }
  }

  private def activate(request: RegisterOrgRequest): Future[Organization] = {
    for {
      _ <- dnsService.create(request.subDomain)
      org <- createOrgAndAdminAccount(request)
    } yield org
  }

  private def createOrgAndAdminAccount(request: RegisterOrgRequest): Future[Organization] = {
    for {
      orgId <- idGenerator.getNextId().map(generatedIdShouldExists).asTwitter
      ownerId <- adminUserService.createAdminAccount(orgId, request.toCreateAdminAccountReq)
      organization <- createOrganization(request.toCreateOrganizationReq(orgId, ownerId))
      permissionAdded <- adminUserService.assignAdminPermissions(organization.organizationId, ownerId)
    } yield {
      if (permissionAdded) organization
      else throw InternalError(s"assign admin permission failed for user $ownerId, org $organization")
    }
  }

  private def isValidDomain(domain: String): Future[Boolean] = {
    dnsService
      .exists(domain)
      .map(isDomainExists => if (isDomainExists) throw BadRequestError(s"domain $domain already exists") else true)
  }

  private def findAvailableSubDomain(subDomain: String): Future[String] = {
    val mainDomain = ZConfig.getString("cloudflare.main_domain")
    var domain = s"$subDomain.$mainDomain"
    var curSubDomain = subDomain
    var count = 1
    while (dnsService.exists(domain).syncGet()) {
      curSubDomain = s"$subDomain$count"
      domain = s"$curSubDomain.$mainDomain"
      count += 1
    }
    curSubDomain
  }

  private def isValidRecaptchaToken(token: Option[String]): Future[Unit] = {
    token match {
      case Some(value) =>
        logger.info(s"recaptcha token: $value")
        validateRecaptchaToken(token).map(isTokenValid =>
          if (!isTokenValid) throw BadRequestError("invalid recaptcha token")
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
}
