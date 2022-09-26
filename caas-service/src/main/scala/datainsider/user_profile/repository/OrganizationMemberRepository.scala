package datainsider.user_profile.repository

/**
  * @author andy
  * @since 8/17/20
  * */

import datainsider.client.domain.org.OrgMember
import datainsider.client.util.JdbcClient

import java.sql.ResultSet
import scala.collection.mutable.ListBuffer

trait OrganizationMemberRepository {

  def isExists(organizationId: Long, username: String): Boolean

  def insertOrgMember(organization: OrgMember): Boolean

  def getOrgMember(organizationId: Long, username: String): Option[OrgMember]

  def getOrgMembers(username: String): Seq[OrgMember]

  def deleteOrgMember(organizationId: Long, username: String): Unit

}

object MySqlOrganizationMemberRepository {
  private val INSERT_SQL =
    "INSERT INTO organization_members (organization_id, username, added_by, added_time) VALUES (?, ?, ?, ?)"
  private val SELECT_BY_ORG_ID_USERNAME_SQL =
    "SELECT organization_id, username, added_by, added_time FROM organization_members WHERE organization_id=? AND username=?"
  private val SELECT_BY_USERNAME_SQL =
    "SELECT organization_id, username, added_by, added_time FROM organization_members WHERE username=?"
  private val COUNT_BY_ORG_ID_USERNAME_SQL =
    "SELECT COUNT(organization_id) FROM organization_members WHERE organization_id=? AND username=?"
  private val DELETE_BY_ORG_ID_USERNAME_SQL =
    "DELETE FROM organization_members WHERE organization_id=? AND username=?"
}

case class MySqlOrganizationMemberRepository(client: JdbcClient) extends OrganizationMemberRepository {

  import MySqlOrganizationMemberRepository._

  override def isExists(organizationId: Long, username: String): Boolean = {
    val count = client.executeQuery(COUNT_BY_ORG_ID_USERNAME_SQL, organizationId, username)(rs =>
      if (rs.next()) rs.getLong(1) else 0
    )
    count > 0
  }

  override def insertOrgMember(organization: OrgMember): Boolean = {
    val count = client.executeUpdate(
      INSERT_SQL,
      organization.organizationId,
      organization.username,
      organization.addedBy,
      organization.addedTime.getOrElse(System.currentTimeMillis)
    )
    count > 0
  }

  override def getOrgMember(organizationId: Long, username: String): Option[OrgMember] = {
    client.executeQuery(SELECT_BY_ORG_ID_USERNAME_SQL, organizationId, username)(readUserOrganizations).headOption
  }

  override def getOrgMembers(username: String): Seq[OrgMember] = {

    client.executeQuery(SELECT_BY_USERNAME_SQL, username)(readUserOrganizations)
  }

  private def readUserOrganizations(rs: ResultSet): Seq[OrgMember] = {
    val userOrganizations = ListBuffer.empty[OrgMember]
    while (rs.next()) {
      userOrganizations.append(
        OrgMember(
          organizationId = rs.getLong("organization_id"),
          username = rs.getString("username"),
          addedBy = rs.getString("added_by"),
          addedTime = Option(rs.getLong("added_time"))
        )
      )
    }
    userOrganizations
  }

  override def deleteOrgMember(organizationId: Long, username: String): Unit = {
    client.executeUpdate(DELETE_BY_ORG_ID_USERNAME_SQL, organizationId, username)
  }

}
