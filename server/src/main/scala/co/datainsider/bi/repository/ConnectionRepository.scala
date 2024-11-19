package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.util.Serializer
import com.google.inject.Inject
import com.twitter.util.Future

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

trait ConnectionRepository {

  def get(orgId: Long): Future[Option[Connection]]

  def mget(orgIds: Seq[Long]): Future[Map[Long, Connection]]

  def exist(orgId: Long): Future[Boolean]

  def set(orgId: Long, connection: Connection): Future[Boolean]

  def delete(orgId: Long): Future[Boolean]
}

class ConnectionRepositoryImpl @Inject()(
    client: JdbcClient,
    dbName: String,
    tblName: String
) extends ConnectionRepository {

  override def get(orgId: Long): Future[Option[Connection]] =
    Future {
      val selectQuery =
        s"""
         |select * from $dbName.$tblName
         |where org_id = ?
         |""".stripMargin

      client.executeQuery(selectQuery, orgId)(rs => toConnections(rs)).headOption
    }

  override def mget(orgIds: Seq[Long]): Future[Map[Long, Connection]] =
    Future {
      val selectQuery =
        s"""
         |select * from $dbName.$tblName
         |where org_id in (${Seq.fill(orgIds.length)("?").mkString(",")})
         |""".stripMargin

      client.executeQuery(selectQuery, orgIds: _*)(toConnections).map(con => con.orgId -> con).toMap
    }

  override def exist(orgId: Long): Future[Boolean] =
    Future {
      val existQuery =
        s"""
         |select count(1) from $dbName.$tblName
         |where org_id = ?
         |""".stripMargin

      client.executeQuery(existQuery, orgId)(rs => {
        if (rs.next()) {
          rs.getInt(1)
        } else 0
      }) > 0
    }

  override def set(orgId: Long, connection: Connection): Future[Boolean] =
    Future {
      val insertQuery =
        s"""
         |insert into $dbName.$tblName(org_id, data, created_at, updated_at, created_by, updated_by)
         |values (?, ?, ?, ?, ?, ?)
         |on duplicate key update data = ?, updated_by = ?, updated_at = ?
         |""".stripMargin

      val args = Seq(
        orgId,
        Serializer.toJson(connection),
        System.currentTimeMillis(),
        System.currentTimeMillis(),
        connection.createdBy,
        connection.updatedBy,
        Serializer.toJson(connection),
        connection.updatedBy,
        System.currentTimeMillis()
      )

      client.executeUpdate(insertQuery, args: _*) >= 0
    }

  override def delete(orgId: Long): Future[Boolean] =
    Future {
      val deleteQuery =
        s"""
         |delete from $dbName.$tblName
         |where org_id = ?
         |""".stripMargin

      client.executeUpdate(deleteQuery, orgId) > 0
    }

  private def toConnections(rs: ResultSet): Seq[Connection] = {
    val connections = ArrayBuffer[Connection]()

    while (rs.next()) {
      val connData = rs.getString("data")
      val conn: Connection = Serializer.fromJson[Connection](connData)
      val finalConn = conn.customCopy(
        orgId = rs.getLong("org_id"),
        createdAt = rs.getLong("created_at"),
        updatedAt = rs.getLong("updated_at"),
        createdBy = rs.getString("created_by"),
        updatedBy = rs.getString("updated_by")
      )
      connections += finalConn
    }

    connections
  }
}
