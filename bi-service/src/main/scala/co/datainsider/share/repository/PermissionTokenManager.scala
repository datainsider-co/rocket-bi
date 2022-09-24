package co.datainsider.share.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.{PermissionToken, TokenFullInfo}
import co.datainsider.bi.util.Serializer
import com.google.inject.name.Named
import com.twitter.util.Future
import datainsider.client.exception.{InternalError, NotFoundError}

import java.sql.ResultSet
import java.util.UUID
import scala.collection.mutable.ListBuffer

trait PermissionTokenManager {

  def create(username: String, permissions: Seq[String]): Future[PermissionToken]

  def add(sharingToken: PermissionToken): Future[PermissionToken]

  def get(tokenId: String): Future[Option[PermissionToken]]

  def getFullInfo(tokenId: String): Future[Option[TokenFullInfo]]

  def updatePermissions(tokenId: String, permissions: Seq[String]): Future[Boolean]

  def delete(tokenId: String): Future[Boolean]

  def isPermitted(tokenId: String, permission: String): Future[Boolean]

  def isPermitted(tokenId: String, permissions: Seq[String]): Future[Seq[Boolean]]

  def isPermittedAll(tokenId: String, permissions: Seq[String]): Future[Boolean]
}

class MysqlPermissionTokenManager(
    @Named("mysql") client: JdbcClient,
    dbName: String,
    tblName: String,
    tblObjectSharing: String
) extends PermissionTokenManager {

  override def create(username: String, permissions: Seq[String]): Future[PermissionToken] =
    Future {
      val tokenId = UUID.randomUUID().toString
      val createdTime = System.currentTimeMillis()

      val insertOK = client.executeUpdate(
        s"""
         |INSERT INTO $dbName.$tblName(token_id, creator, permissions, created_time)
         |VALUES(?, ?, ?, ?);
         |""".stripMargin,
        tokenId,
        username,
        Serializer.toJson(permissions),
        createdTime
      ) > 0
      if (insertOK) {
        PermissionToken(tokenId, username, permissions, Some(createdTime))
      } else {
        throw InternalError("Can't create sharing token")
      }
    }

  override def add(sharingToken: PermissionToken): Future[PermissionToken] =
    Future {
      val insertOK = client.executeUpdate(
        s"""
         |INSERT INTO $dbName.$tblName(token_id, creator, permissions, created_time)
         |VALUES(?, ?, ?, ?);
         |""".stripMargin,
        sharingToken.tokenId,
        sharingToken.creator,
        Serializer.toJson(sharingToken.permissions),
        sharingToken.createdTime.getOrElse(System.currentTimeMillis())
      ) > 0
      if (insertOK) {
        sharingToken
      } else {
        throw InternalError("Can't create sharing token")
      }
    }

  override def get(tokenId: String): Future[Option[PermissionToken]] =
    Future {
      client.executeQuery(s"""
         |SELECT *
         |FROM $dbName.$tblName
         |WHERE token_id = ?;
         |""".stripMargin, tokenId)(readTokens(_).headOption)
    }

  def parseToTokenFullInfo(rs: ResultSet): TokenFullInfo = {
    TokenFullInfo(
      objectType = rs.getString("object_type"),
      objectId = rs.getString("object_id"),
      permissions = Serializer.fromJson[Seq[String]](rs.getString("permissions")),
      createdTime = Option(rs.getLong("created_time")),
      creator = rs.getString("creator"),
      tokenId = rs.getString("token_id")
    )
  }

  def readAsTokenFullInfo(rs: ResultSet): Option[TokenFullInfo] = {
    rs.next() match {
      case true => Some(parseToTokenFullInfo(rs))
      case _    => None
    }
  }

  override def getFullInfo(tokenId: String): Future[Option[TokenFullInfo]] =
    Future {
      client.executeQuery(
        s"""
        |SELECT $dbName.$tblName.token_id, creator , permissions , created_time , object_type, object_id
        |FROM $dbName.$tblName inner join  $dbName.$tblObjectSharing on $dbName.$tblName.token_id = $dbName.$tblObjectSharing.token_id
        |WHERE $dbName.$tblName.token_id = ?""".stripMargin,
        tokenId
      )(readAsTokenFullInfo)
    }

  override def updatePermissions(tokenId: String, permissions: Seq[String]): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |UPDATE $dbName.$tblName
         |SET permissions = ?
         |WHERE token_id = ?;
         |""".stripMargin,
        Serializer.toJson(permissions),
        tokenId
      ) >= 1
    }

  override def delete(tokenId: String): Future[Boolean] =
    Future {
      client.executeUpdate(s"""
         |DELETE FROM $dbName.$tblName
         |WHERE token_id = ?;
         |""".stripMargin, tokenId) >= 1
    }

  private def readTokens(rs: ResultSet): Seq[PermissionToken] = {
    val data = ListBuffer.empty[PermissionToken]
    while (rs.next()) {
      val tokenId = rs.getString("token_id")
      val creator = rs.getString("creator")
      val permissions = Serializer.fromJson[Seq[String]](rs.getString("permissions"))
      val createdTime = Option(rs.getLong("created_time"))

      data.append(PermissionToken(tokenId, creator, permissions, createdTime))
    }
    data
  }

  override def isPermitted(tokenId: String, permission: String): Future[Boolean] = {
    get(tokenId)
      .map(tokenMustExist)
      .map(_.isPermitted(permission))
  }

  override def isPermitted(tokenId: String, permissions: Seq[String]): Future[Seq[Boolean]] = {
    get(tokenId)
      .map(tokenMustExist)
      .map(sharingToken => permissions.map(p => sharingToken.isPermitted(p)))
  }

  override def isPermittedAll(tokenId: String, permissions: Seq[String]): Future[Boolean] = {
    get(tokenId)
      .map(tokenMustExist)
      .map(sharingToken => {
        permissions.map(p => sharingToken.isPermitted(p))
      })
      .map(_.filter(_ == false).isEmpty)
  }

  private def tokenMustExist(sharingToken: Option[PermissionToken]): PermissionToken = {
    sharingToken match {
      case Some(x) => x
      case _       => throw NotFoundError("token not found.")
    }
  }

}

trait ObjectTokenRepository {

  def addTokenId(objectType: String, objectId: String, tokenId: String): Future[Boolean]

  def getTokenId(objectType: String, objectId: String): Future[Option[String]]

  def delete(objectType: String, objectId: String): Future[Boolean]
}

class MysqlObjectTokenRepository(@Named("mysql") client: JdbcClient, dbName: String, tblName: String)
    extends ObjectTokenRepository {

  override def addTokenId(objectType: String, objectId: String, tokenId: String): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
         |INSERT INTO $dbName.$tblName(object_type, object_id,token_id)
         |VALUES(?,?,?);
         |""".stripMargin,
        objectType,
        objectId,
        tokenId
      ) > 0

    }

  override def getTokenId(objectType: String, objectId: String): Future[Option[String]] =
    Future {
      client.executeQuery(s"""
         |SELECT *
         |FROM $dbName.$tblName
         |WHERE object_type=? AND object_id=?;
         |""".stripMargin, objectType, objectId)(readTokenIds(_).headOption)
    }

  override def delete(objectType: String, objectId: String): Future[Boolean] =
    Future {
      client.executeUpdate(s"""
         |DELETE FROM $dbName.$tblName
         |WHERE object_type=? AND object_id=?;
         |""".stripMargin, objectType, objectId) >= 1
    }

  private def readTokenIds(rs: ResultSet): Seq[String] = {
    val data = ListBuffer.empty[String]
    while (rs.next()) {
      val tokenId = rs.getString("token_id")
      data.append(tokenId)
    }
    data
  }
}
