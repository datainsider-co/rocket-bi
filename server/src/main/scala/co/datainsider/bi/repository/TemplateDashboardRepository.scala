//package co.datainsider.bi.repository
//
//import co.datainsider.bi.client.JdbcClient
//import co.datainsider.bi.domain.{Dashboard, TemplateDashboard, TemplateSetting}
//import co.datainsider.bi.util.Serializer
//import co.datainsider.schema.domain.PageResult
//import com.twitter.util.Future
//import com.twitter.util.logging.Logging
//
//import java.sql.ResultSet
//import scala.collection.mutable.ArrayBuffer
//
//trait TemplateDashboardRepository {
//  def listTemplateDashboards(keyword: String, from: Int, size: Int): Future[PageResult[TemplateDashboard]]
//
//  def get(id: Long): Future[Option[TemplateDashboard]]
//
//  def create(templateDashboard: TemplateDashboard): Future[TemplateDashboard]
//
//  def update(templateDashboard: TemplateDashboard): Future[TemplateDashboard]
//
//  def delete(orgId: Long, id: Long): Future[Boolean]
//}
//
//class TemplateDashboardRepositoryImpl(val client: JdbcClient, val dbName: String, val tblName: String)
//    extends TemplateDashboardRepository
//    with MySqlSchemaManager
//    with Logging {
//  override val requiredFields: Seq[String] = Seq(
//    "org_id",
//    "id",
//    "name",
//    "description",
//    "thumbnail",
//    "dashboard",
//    "setting",
//    "created_at",
//    "updated_at",
//    "created_by",
//    "updated_by"
//  )
//
//  override def listTemplateDashboards(keyword: String, from: Int, size: Int): Future[PageResult[TemplateDashboard]] =
//    Future {
//      val query =
//        s"""
//        |select * from $dbName.$tblName
//        |where name like ?
//        |limit $size offset $from
//        |""".stripMargin
//
//      val countQuery =
//        s"""
//        |select count(id) from $dbName.$tblName
//        |where name like ?
//        |""".stripMargin
//
//      val args = Seq(s"%$keyword%")
//
//      val templateDashboards = client.executeQuery(query, args: _*)(rs => parseTemplateDashboards(rs))
//      val total = client.executeQuery(countQuery, args: _*)(rs => if (rs.next()) rs.getInt(1) else 0)
//      PageResult(total, templateDashboards)
//    }
//
//  private def parseTemplateDashboards(rs: ResultSet): Seq[TemplateDashboard] = {
//    val templateDashboards = ArrayBuffer.empty[TemplateDashboard]
//    while (rs.next()) {
//      try {
//        templateDashboards += TemplateDashboard(
//          orgId = rs.getLong("org_id"),
//          id = rs.getLong("id"),
//          name = rs.getString("name"),
//          description = rs.getString("description"),
//          thumbnail = rs.getString("thumbnail"),
//          dashboard = Serializer.fromJson[Dashboard](rs.getString("dashboard")),
//          setting = Serializer.fromJson[TemplateSetting](rs.getString("setting")),
//          createdAt = rs.getLong("created_at"),
//          updatedAt = rs.getLong("updated_at"),
//          createdBy = rs.getString("created_by"),
//          updatedBy = rs.getString("updated_by")
//        )
//      } catch {
//        case ex: Throwable => logger.warn("parse template dashboard error", ex)
//      }
//    }
//    templateDashboards
//  }
//
//  override def get(id: Long): Future[Option[TemplateDashboard]] = {
//    Future {
//      val query =
//        s"""
//          |select * from $dbName.$tblName
//          |where id = ?
//          |""".stripMargin
//
//      client.executeQuery(query, id)(rs => parseTemplateDashboards(rs).headOption)
//    }
//  }
//
//  override def create(templateDashboard: TemplateDashboard): Future[TemplateDashboard] = {
//    Future {
//      val query =
//        s"""
//          |insert into $dbName.$tblName
//          |(org_id, name, description, thumbnail, dashboard, setting, created_at, updated_at, created_by, updated_by)
//          |values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//          |""".stripMargin
//
//      val args = Seq(
//        templateDashboard.orgId,
//        templateDashboard.name,
//        templateDashboard.description,
//        templateDashboard.thumbnail,
//        Serializer.toJson(templateDashboard.dashboard),
//        Serializer.toJson(templateDashboard.setting),
//        System.currentTimeMillis(),
//        System.currentTimeMillis(),
//        templateDashboard.createdBy,
//        templateDashboard.updatedBy
//      )
//
//      val newTemplateId: Long = client.executeInsert(query, args: _*)
//      templateDashboard.copy(id = newTemplateId)
//    }
//  }
//
//  override def update(templateDashboard: TemplateDashboard): Future[TemplateDashboard] = {
//    Future {
//      val query =
//        s"""
//          |update $dbName.$tblName
//          |set name = ?, description = ?, thumbnail = ?, dashboard = ?, setting = ?, updated_at = ?, updated_by = ?
//          |where id = ? and org_id = ?
//          |""".stripMargin
//
//      val args = Seq(
//        templateDashboard.name,
//        templateDashboard.description,
//        templateDashboard.thumbnail,
//        Serializer.toJson(templateDashboard.dashboard),
//        Serializer.toJson(templateDashboard.setting),
//        System.currentTimeMillis(),
//        templateDashboard.updatedBy,
//        templateDashboard.id,
//        templateDashboard.orgId
//      )
//
//      client.executeUpdate(query, args: _*)
//      templateDashboard
//    }
//  }
//
//  override def delete(orgId: Long, id: Long): Future[Boolean] =
//    Future {
//      val query =
//        s"""
//         |delete from $dbName.$tblName
//         |where id = ? and org_id = ?
//         |""".stripMargin
//
//      client.executeUpdate(query, id, orgId) > 0
//    }
//
//  override def createTable(): Future[Boolean] =
//    Future {
//      client.executeUpdate(
//        s"""
//        |CREATE TABLE $dbName.$tblName (
//        |  org_id BIGINT(20) NOT NULL,
//        |  id BIGINT(20) NOT NULL AUTO_INCREMENT,
//        |  name VARCHAR(255) NOT NULL,
//        |  description VARCHAR(255) NOT NULL,
//        |  thumbnail VARCHAR(255) NOT NULL,
//        |  dashboard LONGTEXT NOT NULL,
//        |  setting LONGTEXT NOT NULL,
//        |  created_at BIGINT(20),
//        |  updated_at BIGINT(20),
//        |  created_by VARCHAR(255) NULL,
//        |  updated_by VARCHAR(255) NULL,
//        |  PRIMARY KEY (id)
//        |) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
//        |""".stripMargin
//      ) > 0
//    }
//}
