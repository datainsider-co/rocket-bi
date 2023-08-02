package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.SshKeyPair
import com.twitter.util.Future

/**
  * created 2023-07-27 10:37 AM
  *
  * @author tvc12 - Thien Vi
  */
trait SshKeyRepository {
  def save(orgId: Long, sshKeyPair: SshKeyPair): Future[Boolean]

  def get(orgId: Long): Future[Option[SshKeyPair]]

  def delete(orgId: Long): Future[Boolean]
}

case class SshKeyRepositoryImpl(client: JdbcClient, dbName: String, tblName: String)
    extends MySqlSchemaManager
    with SshKeyRepository {

  override val requiredFields: Seq[String] = Seq("org_id", "private_key", "public_key", "passphrase", "created_at", "updated_at")

  override def save(orgId: Long, sshKeyPair: SshKeyPair): Future[Boolean] =
    Future {
      val query = s"""
         |insert into $dbName.$tblName(org_id, private_key, public_key, passphrase, created_at, updated_at)
         |values (?, ?, ?, ?, ?, ?)
         |""".stripMargin

      val args = Seq(
        orgId,
        sshKeyPair.privateKey,
        sshKeyPair.publicKey,
        sshKeyPair.passphrase,
        sshKeyPair.createdAt,
        sshKeyPair.updatedAt
      )

      client.executeUpdate(query, args: _*) > 0
    }

  override def get(orgId: Long): Future[Option[SshKeyPair]] =
    Future {
      val query = s"""
         |select * from $dbName.$tblName
         |where org_id = ?
         |""".stripMargin

      client.executeQuery(query, orgId)(rs => {
        if (rs.next()) {
          Some(
            SshKeyPair(
              orgId = rs.getLong("org_id"),
              privateKey = rs.getString("private_key"),
              publicKey = rs.getString("public_key"),
              passphrase = rs.getString("passphrase"),
              createdAt = rs.getLong("created_at"),
              updatedAt = rs.getLong("updated_at")
            )
          )
        } else {
          None
        }
      })
    }

  override def delete(orgId: Long): Future[Boolean] =
    Future {
      val query = s"""
         |delete from $dbName.$tblName
         |where org_id = ?
         |""".stripMargin

      client.executeUpdate(query, orgId) > 0
    }

  override def createTable(): Future[Boolean] =
    Future {
      val query =
        s"""
         |CREATE TABLE IF NOT EXISTS $dbName.$tblName (
         |    org_id      BIGINT        NOT NULL,
         |    private_key LONGTEXT      NOT NULL,
         |    public_key  LONGTEXT      NOT NULL,
         |    passphrase  NVARCHAR(255) NOT NULL,
         |    created_at  BIGINT        NOT NULL,
         |    updated_at  BIGINT        NOT NULL,
         |    PRIMARY KEY (org_id)
         |)ENGINE=INNODB DEFAULT CHARSET=utf8mb4
         |""".stripMargin

      client.executeUpdate(query) >= 0
    }
}
