package co.datainsider.caas.user_profile.controller.http.filter

import co.datainsider.bi.controller.http.filter.PermissionValidator
import co.datainsider.caas.user_profile.client.CaasClientService
import com.google.inject.Inject
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.val2Opt
import datainsider.client.exception.{InsufficientPermissionError, InternalError}
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}

import javax.inject.Singleton

/**
  * Class ho tro cho viec filter permission, neu khong co thi se bao loi unauthorized, khi su dung chi can inject vao control muon su dung filter nay
  */
@Singleton
class PermissionFilter @Inject() (caas: CaasClientService) extends Logging {

  /**
    * Require all permissions in the list.
    * Ho tro pattern "[resource_type]:[action]:[resource_id]". example: "dashboard:read:*"
    * org_id se duoc lay tu request, neu khong co thi se loi. org_id se tu dong duoc inject vao pattern
    * Ho tro param placeholder voi syntax [name].
    * ex: router: GET /dashboard/:id => require permission dashboard:view:[id]
    */
  @throws[InsufficientPermissionError]("If user is not authorized")
  @throws[InternalError]("if process permission failure")
  def requireAll(permissions: String*): SimpleFilter[Request, Response] = {
    new SimpleFilter[Request, Response] {
      override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
        request.ensureLoggedIn
        val finalPermissions: Seq[String] = permissions
          .map(permission => enhanceWithParamValue(request, permission))
          .map(permission => enhanceWithOrgId(request, permission))
        caas
          .isOrgPermittedAll(request.getOrganizationId(), request.currentUsername, finalPermissions)
          .flatMap(isPermitted => {
            if (isPermitted) {
              service(request)
            } else {
              Future.exception(InsufficientPermissionError(s"You do not have permissions to perform this action!"))
            }
          })
      }
    }
  }

  /**
    * Require all roles in the list. neu khong du roles se loi
    */
  @throws[InsufficientPermissionError]("If user is not authorized")
  @throws[InternalError]("if process permission failure")
  def requireAllRoles(roles: String*): SimpleFilter[Request, Response] = {
    new SimpleFilter[Request, Response] {
      override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
        request.ensureLoggedIn
        caas
          .hasAllOrgRoles(request.getOrganizationId(), request.currentUsername, roles)
          .flatMap(hasRole => {
            if (hasRole) {
              service(request)
            } else {
              Future.exception(InsufficientPermissionError(s"You do not have permissions to perform this action!"))
            }
          })
      }
    }
  }

  /**
    * Require one of permissions in the list.
    * Ho tro pattern "[resource_type]:[action]:[resource_id]". example: "dashboard:read:*"
    * org_id se duoc lay tu request, neu khong co thi se loi. org_id se tu dong duoc inject vao pattern
    * Ho tro param placeholder voi syntax [name].
    * ex: router: GET /dashboard/:id => require permission dashboard:view:[id]
    */
  @throws[InternalError]("if process permission failure")
  @throws[InsufficientPermissionError]("If user is not authorized")
  def require(permissions: String*): SimpleFilter[Request, Response] = {
    new SimpleFilter[Request, Response] {
      override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
        request.ensureLoggedIn
        val finalPermissions: Seq[String] = permissions
          .map(permission => enhanceWithParamValue(request, permission))
          .map(permission => enhanceWithOrgId(request, permission))
        caas
          .isOrgPermitted(request.getOrganizationId(), request.currentUsername, finalPermissions)
          .flatMap(result => {
            if (result.exists(isPermitted => isPermitted._2)) {
              service(request)
            } else {
              Future.exception(InsufficientPermissionError(s"You do not have permissions to perform this action!"))
            }
          })
      }
    }
  }

  /**
    * Require one of role in the list.
    */
  @throws[InternalError]("if process permission failure")
  @throws[InsufficientPermissionError]("If user is not authorized")
  def requireRoles(roles: String*): SimpleFilter[Request, Response] = {
    new SimpleFilter[Request, Response] {
      override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
        request.ensureLoggedIn
        caas
          .hasOrgRoles(request.getOrganizationId(), request.currentUsername, roles)
          .flatMap(result => {
            if (result.exists(isPermitted => isPermitted._2)) {
              service(request)
            } else {
              Future.exception(InsufficientPermissionError(s"You do not have permissions to perform this action!"))
            }
          })
      }
    }
  }

  @throws[InternalError]("if process permission failure")
  @throws[InsufficientPermissionError]("If user is not authorized")
  def requireValidator(permissions: String*): PermissionValidator = {
    new PermissionValidator {
      override def isPermitted(request: Request): Future[PermissionResult] = {
        request.ensureLoggedIn
        val finalPermissions: Seq[String] = permissions
          .map(permission => enhanceWithParamValue(request, permission))
          .map(permission => enhanceWithOrgId(request, permission))
        caas
          .isOrgPermitted(request.getOrganizationId(), request.currentUsername, finalPermissions)
          .map(result => {
            if (result.exists(isPermitted => isPermitted._2)) {
              Permitted()
            } else {
              UnPermitted(s"You do not have permissions to perform this action!")
            }
          })
      }
    }
  }

  /**
    * inject org_id to pattern.
    * ex: dashboard:edit:* => 1:dashboard:edit:*
    */
  private def enhanceWithOrgId(request: Request, permission: String): String = {
    val orgId = request.getOrganizationId()
    s"$orgId:$permission"
  }

  /**
    * replace param placeholder with real value.
    * support syntax permission:[param_name]
    */
  @throws[InternalError]("if process permission failure")
  private def enhanceWithParamValue(request: Request, permission: String): String = {
    permission
      .split(":")
      .map(term => {
        if (term.startsWith("[")) {
          val paramName: String = term.substring(1, term.length - 1)
          val paramValue: String = request.getParam(paramName)
          if (paramValue == null || paramValue.isEmpty) {
            throw InternalError(s"Not found param $paramName in pattern $permission")
          } else {
            paramValue.get
          }
        } else {
          term
        }
      })
      .mkString(":")
  }
}
