package co.datainsider.share.controller.request

import co.datainsider.bi.domain.PermissionToken
import co.datainsider.share.service.PermissionTokenService
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import com.twitter.util.Future
import datainsider.client.filter.LoggedInRequest
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.Inject

case class GetOrCreatePermissionTokenRequest(
    objectType: String,
    objectId: String,
    permissions: Option[Seq[String]],
    @Inject request: Request
) extends LoggedInRequest

case class UpdatePermissionTokenRequest(
    @RouteParam @NotEmpty tokenId: String,
    @NotEmpty permissions: Seq[String]
)

case class CheckTokenPermittedRequest(
    @RouteParam @NotEmpty tokenId: String,
    @NotEmpty permissions: Seq[String]
)

case class CheckTokenActionPermittedRequest(
    @RouteParam @NotEmpty tokenId: String,
    @NotEmpty resourceId: String,
    @NotEmpty resourceType: String,
    @NotEmpty actions: Seq[String],
    @Inject request: Request
) extends LoggedInRequest

case class CheckTokenPermittedAllRequest(
    @RouteParam @NotEmpty tokenId: String,
    @NotEmpty permissions: Seq[String]
)

case class EditPermissionTokenRightFilter @Inject() (
    permissionTokenService: PermissionTokenService
) extends SimpleFilter[Request, Response] {

  override def apply(
      request: Request,
      service: Service[Request, Response]
  ): Future[Response] = {
    val tokenId = request.getParam("token_id")
    processPermission(request, service, tokenId)
  }

  private def processPermission(
      request: Request,
      service: Service[Request, Response],
      tokenId: String
  ): Future[Response] = {
    val isOwner = (token: PermissionToken) => {
      request.currentUser.username == token.creator
    }
    permissionTokenService.getToken(tokenId).flatMap {
      case token if isOwner(token) => service(request)
      case _ =>
        Future.exception(
          datainsider.client.exception
            .UnAuthorizedError("Not allow to edit this token.")
        )
    }
  }

}

case class DeletePermissionTokenRightFilter @Inject() (
    permissionTokenService: PermissionTokenService
) extends SimpleFilter[Request, Response] {

  override def apply(
      request: Request,
      service: Service[Request, Response]
  ): Future[Response] = {

    val tokenId = request.getParam("token_id")
    processPermission(request, service, tokenId)
  }

  private def processPermission(
      request: Request,
      service: Service[Request, Response],
      tokenId: String
  ): Future[Response] = {
    val isOwner = (token: PermissionToken) => {
      request.currentUser.username == token.creator
    }
    permissionTokenService.getToken(tokenId).flatMap {
      case token if isOwner(token) => service(request)
      case _ =>
        Future.exception(
          datainsider.client.exception
            .UnAuthorizedError("Not allow to edit this token.")
        )
    }
  }

}
