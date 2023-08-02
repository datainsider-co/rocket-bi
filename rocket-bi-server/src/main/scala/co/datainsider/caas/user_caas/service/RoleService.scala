package co.datainsider.caas.user_caas.service

import com.twitter.util.Future
import co.datainsider.caas.user_caas.repository.RoleRepository

import javax.inject.Inject

/**
  * @author andy
  * @since 8/7/20
  */
trait RoleService {
  def createRole(organizationId: Long, roleId: Int, roleName: String): Future[Unit]

  def deleteRole(organizationId: Long, roleId: Int): Future[Unit]
}

case class RoleServiceImpl @Inject() (roleRepository: RoleRepository) extends RoleService {

  override def createRole(organizationId: Long, roleId: Int, roleName: String): Future[Unit] =
    Future {
      roleRepository.insertRole(organizationId, roleId, roleName)
    }

  override def deleteRole(organizationId: Long, roleId: Int): Future[Unit] = {
    Future {
      roleRepository.deleteRole(organizationId, roleId)
    }
  }
}
