package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.repository.MySqlSchemaManager
import co.datainsider.caas.user_profile.util.JsonParser
import co.datainsider.schema.domain.RefreshSchemaHistory
import com.twitter.util.Future

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

/**
  * created 2023-06-01 10:58 AM
  * @author tvc12 - Thien Vi
  */
trait RefreshSchemaHistoryRepository {
  def getLatestHistory(orgId: Long): Future[Option[RefreshSchemaHistory]]

  def insert(orgId: Long, history: RefreshSchemaHistory): Future[RefreshSchemaHistory]

  def update(orgId: Long, history: RefreshSchemaHistory): Future[RefreshSchemaHistory]
}

class RefreshSchemaHistoryRepositoryImpl(val client: JdbcClient)
    extends RefreshSchemaHistoryRepository
    with MySqlSchemaManager {
  val dbName: String = "di_schema"
  val tblName = "refresh_schema_history"
  val requiredFields =
    Seq("org_id", "id", "data", "created_by", "updated_by", "created_time", "updated_time")
  override def getLatestHistory(orgId: Long): Future[Option[RefreshSchemaHistory]] =
    Future {
      val sql = s"select * from ${dbName}.${tblName} where org_id = ? order by id desc limit 1"
      client.executeQuery(sql, orgId)(toRefreshSchemaHistories).headOption
    }

  override def insert(orgId: Long, history: RefreshSchemaHistory): Future[RefreshSchemaHistory] =
    Future {
      val sql =
        s"insert into ${dbName}.${tblName} (org_id, data, created_by, updated_by, created_time, updated_time) values (?, ?, ?, ?, ?, ?)"
      val createdTime: Long = System.currentTimeMillis()
      val args = Seq(
        orgId,
        JsonParser.toJson(history, pretty = false),
        history.createdBy.orNull,
        history.updatedBy.orNull,
        createdTime,
        createdTime
      )
      val newId = client.executeInsert(sql, args: _*)
      history.copy(id = newId, createdTime = createdTime, updatedTime = createdTime)
    }

  private def toRefreshSchemaHistories(rs: ResultSet): Seq[RefreshSchemaHistory] = {
    val histories = ArrayBuffer[RefreshSchemaHistory]()

    while (rs.next()) {
      val history = JsonParser.fromJson[RefreshSchemaHistory](rs.getString("data"))
      val newHistory = history.copy(
        id = rs.getLong("id"),
        orgId = rs.getLong("org_id"),
        createdBy = Option(rs.getString("created_by")),
        updatedBy = Option(rs.getString("updated_by")),
        createdTime = rs.getLong("created_time"),
        updatedTime = rs.getLong("updated_time")
      )
      histories += newHistory
    }
    histories
  }

  override def update(orgId: Long, history: RefreshSchemaHistory): Future[RefreshSchemaHistory] =
    Future {
      val sql =
        s"update ${dbName}.${tblName} set data = ?, updated_by = ?, updated_time = ? where org_id = ? and id = ?"
      val args = Seq(
        JsonParser.toJson(history, pretty = false),
        history.updatedBy.orNull,
        System.currentTimeMillis(),
        orgId,
        history.id
      )
      client.executeUpdate(sql, args: _*)
      history
    }

  def createTable(): Future[Boolean] =
    Future {
      val sql =
        s"""
        |create table if not exists ${dbName}.${tblName}
        |(
        |    org_id       bigint not null,
        |    id           bigint auto_increment primary key,
        |    data         longtext not null,
        |    created_by   varchar(255),
        |    updated_by   varchar(255),
        |    created_time bigint not null,
        |    updated_time bigint not null
        |) engine=INNODB default charset=utf8mb4;
        |""".stripMargin

      client.executeUpdate(sql) >= 0
    }
}
