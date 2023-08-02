package co.datainsider.share.controller.filter

import co.datainsider.share.controller.filter.ShareContext.ShareWithUserField
import co.datainsider.share.controller.request.ShareWithUserRequest
import co.datainsider.share.service.ShareService
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finatra.validation.ValidationResult
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import datainsider.client.util.JsonParser

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 03/15/2021 - 6:51 PM
  */
object ShareContext {
  val ShareWithUserField = Request.Schema.newField[ShareWithUserRequest]()
  implicit class ShareContextSyntax(request: Request) extends AnyRef {
    def shareWithUserRequest: ShareWithUserRequest = {
      request.ctx(ShareWithUserField)
    }
  }
}

case class UserNonSharingFilter @Inject() (shareService: ShareService) extends SimpleFilter[Request, Response] {

  def removeUsersShared(request: Request, shareWithUserRequest: ShareWithUserRequest): Future[ShareWithUserRequest] = {
    for {
      usernamesNotSharing <-
        shareService
          .isShared(
            request.currentOrganizationId.get,
            shareWithUserRequest.resourceType,
            shareWithUserRequest.resourceId,
            shareWithUserRequest.userActions.keys.toSeq
          )
          .map(_.filterNot(_._2).keys)
    } yield {
      val newUserActions =
        usernamesNotSharing.map(username => username -> shareWithUserRequest.userActions(username)).toMap
      shareWithUserRequest.copy(userActions = newUserActions)
    }
  }

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val shareWithUserRequest: ShareWithUserRequest = JsonParser
      .fromJson[ShareWithUserRequest](request.contentString)
      .copy(
        resourceId = request.getParam("resource_id"),
        resourceType = request.getParam("resource_type"),
        request = request
      )
    shareWithUserRequest.validateUserActions() match {
      case ValidationResult.Valid(annotation) =>
        removeUsersShared(request, shareWithUserRequest).flatMap(newShareWithUserRequest => {
          request.ctx.update(ShareWithUserField, newShareWithUserRequest)
          service(request)
        })

      case ValidationResult.Invalid(message, code, annotation) => Future.exception(BadRequestError(message))
    }
  }
}
