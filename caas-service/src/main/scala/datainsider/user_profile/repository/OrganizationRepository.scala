package datainsider.user_profile.repository

/**
  * @author andy
  * @since 8/17/20
  * */

import datainsider.client.domain.org.Organization
import datainsider.client.util.JdbcClient
import datainsider.user_profile.domain.Implicits.OptionString
import datainsider.user_caas.domain.Page

import java.sql.ResultSet
import scala.collection.mutable.ListBuffer

trait OrganizationRepository {

  def isExists(organizationId: Long): Boolean

  def insertOrganization(organization: Organization): Boolean

  def getOrganization(organizationId: Long): Option[Organization]

  def getOrganizations(organizationIds: Seq[Long]): Map[Long, Organization]

  def deleteOrganization(organizationId: Long): Unit

  def getAllOrganizations(from: Int, size: Int): Page[Organization]

  def getWith(domain: String): Option[Organization]

  def update(organization: Organization): Boolean

}

object MySqlOrganizationRepository {
  private val INSERT_SQL =
    "INSERT INTO organization (organization_id, owner, name, domain, is_active, report_time_zone_id, thumbnail_url, created_time, updated_time, updated_by, licence_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  private val SELECT_BY_ID_SQL =
    "SELECT * FROM organization WHERE organization_id=?"
  private val SELECT_BY_IDS_SQL =
    "SELECT * FROM organization WHERE organization_id IN %s"
  private val COUNT_BY_ID_SQL =
    "SELECT COUNT(organization_id) FROM organization WHERE organization_id=?"
  private val DELETE_BY_ID_SQL =
    "DELETE FROM organization WHERE organization_id=?"

  private val COUNT_ALL_SQL =
    "SELECT COUNT(organization_id) FROM organization"

  private val SELECT_ALL_SQL =
    "SELECT * FROM organization LIMIT ?, ?"

  private val SELECT_WITH_DOMAIN = "SELECT * FROM organization WHERE domain = ?"

  private val UPDATE_SQL = "UPDATE organization set name=?, domain=?, thumbnail_url=?, updated_time = ?, updated_by = ?, licence_key = ? WHERE organization_id = ?"
}

case class MySqlOrganizationRepository(client: JdbcClient) extends OrganizationRepository {

  import MySqlOrganizationRepository._

  override def isExists(organizationId: Long): Boolean = {
    val count = client.executeQuery(COUNT_BY_ID_SQL, organizationId)(rs => if (rs.next()) rs.getLong(1) else 0)
    count > 0
  }

  override def insertOrganization(organization: Organization): Boolean = {
    val count = client.executeUpdate(
      INSERT_SQL,
      organization.organizationId,
      organization.owner,
      organization.name,
      organization.domain,
      organization.isActive,
      organization.reportTimeZoneId.getOrElse(""),
      organization.thumbnailUrl.getOrElse(""),
      organization.createdTime.getOrElse(System.currentTimeMillis),
      organization.updatedTime.getOrElse(System.currentTimeMillis),
      organization.updatedBy.orNull,
      organization.licenceKey.orNull
    )
    count > 0
  }

  override def getOrganization(organizationId: Long): Option[Organization] = {
    try {
      client.executeQuery(SELECT_BY_ID_SQL, organizationId)(readOrganizations).headOption
    } catch {
      case ex: Throwable =>
        None
    }
  }

  override def getOrganizations(organizationIds: Seq[Long]): Map[Long, Organization] = {
    if (organizationIds != null && organizationIds.nonEmpty) {
      val organizations =
        client.executeQuery(createSelectByMultipleIdsQuery(organizationIds), organizationIds: _*)(readOrganizations)
      organizations
        .map(organization => organization.organizationId -> organization)
        .toMap
    } else {
      Map.empty
    }
  }

  private def createSelectByMultipleIdsQuery(organizationIds: Seq[Long]): String = {
    String.format(SELECT_BY_IDS_SQL, s" (${organizationIds.map(_ => "?").mkString(",")})")
  }

  private def readOrganizations(rs: ResultSet): Seq[Organization] = {
    val organizations = ListBuffer.empty[Organization]
    while (rs.next()) {
      organizations.append(
        Organization(
          organizationId = rs.getLong("organization_id"),
          owner = rs.getString("owner"),
          name = rs.getString("name"),
          domain = rs.getString("domain"),
          isActive = rs.getBoolean("is_active"),
          reportTimeZoneId = Option(rs.getString("report_time_zone_id")).notEmptyOrNull,
          thumbnailUrl = Option(rs.getString("thumbnail_url")).notEmptyOrNull,
          createdTime = Option(rs.getLong("created_time")),
          updatedTime = Option(rs.getLong("updated_time")),
          updatedBy = Option(rs.getString("updated_by")),
          licenceKey = Option(rs.getString("licence_key"))
        )
      )
    }
    organizations
  }

  override def deleteOrganization(organizationId: Long): Unit = {
    client.executeUpdate(DELETE_BY_ID_SQL, organizationId)
  }

  override def getAllOrganizations(from: Int, size: Int): Page[Organization] = {
    val total = client.executeQuery(COUNT_ALL_SQL)(rs => if (rs.next()) rs.getLong(1) else 0L)
    val organizations = client.executeQuery(SELECT_ALL_SQL, from, size)(readOrganizations)

    Page[Organization](total, organizations)
  }

  override def getWith(domain: String): Option[Organization] = {
    client.executeQuery(SELECT_WITH_DOMAIN, domain)(readOrganizations).headOption
  }

  override def update(organization: Organization): Boolean = {
    client.execute(
      UPDATE_SQL,
      organization.name,
      organization.domain,
      organization.thumbnailUrl.getOrElse(""),
      System.currentTimeMillis(),
      organization.updatedBy.getOrElse(organization.owner),
      organization.licenceKey.orNull,
      organization.organizationId
    )
  }
}
