package datainsider.user_caas.domain

import org.apache.shiro.authc.UsernamePasswordToken

/**
  * @author andy
  */
@SerialVersionUID(1L)
case class OAuthAuthenticationToken(organizationId: Long, username: String) extends UsernamePasswordToken(username, "")

case class OrgAuthenticationToken(organizationId: Long, username: String, password: String)
    extends UsernamePasswordToken(username, password)
