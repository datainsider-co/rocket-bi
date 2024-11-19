package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.query.Condition
import co.datainsider.bi.domain.{RlsPolicy, UserAttribute}
import co.datainsider.bi.util.Serializer
import com.google.inject.Inject
import com.twitter.util.Future

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

trait RlsPolicyRepository {
  def get(orgId: Long, policyId: Long): Future[Option[RlsPolicy]]

  def list(orgId: Long, dbName: Option[String], tblName: Option[String]): Future[Seq[RlsPolicy]]

  def create(orgId: Long, policy: RlsPolicy): Future[Long]

  def multiCreate(orgId: Long, policies: Seq[RlsPolicy]): Future[Boolean]

  def update(orgId: Long, policy: RlsPolicy): Future[Boolean]

  def multiUpdate(orgId: Long, policies: Seq[RlsPolicy]): Future[Boolean]

  def delete(orgId: Long, policyId: Long): Future[Boolean]

  def multiDelete(orgId: Long, policyIds: Seq[Long]): Future[Boolean]

  def deleteByOrgId(orgId: Long): Future[Boolean]
}

class MysqlRlsPolicyRepository @Inject() (client: JdbcClient, dbName: String, tblName: String)
    extends RlsPolicyRepository {
  override def get(orgId: Long, policyId: Long): Future[Option[RlsPolicy]] =
    Future {
      val query = s"select * from $dbName.$tblName where org_id = ? and policy_id = ?"

      val args = Seq(orgId, policyId)

      client.executeQuery(query, args: _*)(toPolicies).headOption
    }

  override def list(orgId: Long, targetDbName: Option[String], targetTblName: Option[String]): Future[Seq[RlsPolicy]] =
    Future {
      var query = s"select * from $dbName.$tblName where org_id = ?"
      val args = ArrayBuffer[Any](orgId)

      if (targetDbName.isDefined) {
        query += " and db_name = ?"
        args += targetDbName.get
      }

      if (targetTblName.isDefined) {
        query += " and tbl_name = ?"
        args += targetTblName.get
      }

      client.executeQuery(query, args: _*)(toPolicies)
    }

  override def create(orgId: Long, policy: RlsPolicy): Future[Long] =
    Future {
      val query =
        s"""
         |insert into $dbName.$tblName(
         |  org_id,
         |  user_ids,
         |  user_attribute,
         |  db_name,
         |  tbl_name,
         |  conditions
         |)
         |values (?, ?, ?, ?, ?, ?)
         |""".stripMargin

      val args = Seq(
        orgId,
        Serializer.toJson(policy.userIds),
        Serializer.toJson(policy.userAttribute),
        policy.dbName,
        policy.tblName,
        Serializer.toJson(policy.conditions)
      )

      client.executeInsert(query, args: _*)
    }

  override def multiCreate(orgId: Long, policies: Seq[RlsPolicy]): Future[Boolean] =
    Future {
      val valuesPlaceHolder = Seq.fill(policies.length)("(?, ?, ?, ?, ?, ?)").mkString(",")

      val query =
        s"""
         |insert into $dbName.$tblName(
         |  org_id,
         |  user_ids,
         |  user_attribute,
         |  db_name,
         |  tbl_name,
         |  conditions
         |)
         |values $valuesPlaceHolder
         |""".stripMargin

      val args = policies.flatMap(policy => {
        Seq(
          orgId,
          Serializer.toJson(policy.userIds),
          Serializer.toJson(policy.userAttribute),
          policy.dbName,
          policy.tblName,
          Serializer.toJson(policy.conditions)
        )
      })

      if (policies.nonEmpty) {
        client.executeUpdate(query, args: _*) > 0
      } else true
    }

  override def update(orgId: Long, policy: RlsPolicy): Future[Boolean] =
    Future {
      val query =
        s"""
         |update $dbName.$tblName
         |set user_ids = ?,
         |  user_attribute = ?,
         |  conditions = ?
         |where org_id = ? and policy_id = ?
         |""".stripMargin

      val args = Seq(
        Serializer.toJson(policy.userIds),
        Serializer.toJson(policy.userAttribute),
        Serializer.toJson(policy.conditions),
        orgId,
        policy.policyId
      )

      client.executeUpdate(query, args: _*) > 0
    }

  override def multiUpdate(orgId: Long, policies: Seq[RlsPolicy]): Future[Boolean] =
    Future {
      val valuesPlaceHolder = Seq.fill(policies.length)("(?, ?, ?, ?, ?, ?)").mkString(",")

      val query =
        s"""
         |insert into $dbName.$tblName(
         |  policy_id,
         |  user_ids,
         |  user_attribute,
         |  db_name,
         |  tbl_name,
         |  conditions
         |)
         |values $valuesPlaceHolder
         |on duplicate key update
         |  user_ids = values(user_ids),
         |  user_attribute = values(user_attribute),
         |  db_name = values(db_name),
         |  tbl_name = values(tbl_name),
         |  conditions = values(conditions)
         |""".stripMargin

      val args = policies.flatMap(policy => {
        Seq(
          policy.policyId,
          Serializer.toJson(policy.userIds),
          Serializer.toJson(policy.userAttribute),
          policy.dbName,
          policy.tblName,
          Serializer.toJson(policy.conditions)
        )
      })

      if (policies.nonEmpty) {
        client.executeUpdate(query, args: _*) > 0
      } else true
    }

  override def delete(orgId: Long, policyId: Long): Future[Boolean] =
    Future {
      val query = s"delete from $dbName.$tblName where org_id = ? and policy_id = ?"

      val args = Seq(orgId, policyId)

      client.executeUpdate(query, args: _*) > 0
    }

  override def multiDelete(orgId: Long, policyIds: Seq[Long]): Future[Boolean] =
    Future {
      val valuesPlaceHolder = Seq.fill(policyIds.length)("?").mkString("(", ",", ")")

      val query = s"delete from $dbName.$tblName where org_id = ? and policy_id in $valuesPlaceHolder"

      val args = Seq(orgId) ++ policyIds

      if (policyIds.nonEmpty) {
        client.executeUpdate(query, args: _*) > 0
      } else true
    }

  private def toPolicies(rs: ResultSet): Seq[RlsPolicy] = {
    val policies = ArrayBuffer.empty[RlsPolicy]

    while (rs.next()) {

      val userIds: Seq[String] = Try(
        Serializer.fromJson[Seq[String]](rs.getString("user_ids"))
      ).getOrElse(Seq.empty)

      val userAttribute: Option[UserAttribute] = Try(
        Serializer.fromJson[Option[UserAttribute]](rs.getString("user_attribute"))
      ).getOrElse(None)

      val conditions: Array[Condition] = Try(
        Serializer.fromJson[Array[Condition]](rs.getString("conditions"))
      ).getOrElse(Array.empty)

      val policy = RlsPolicy(
        policyId = rs.getLong("policy_id"),
        orgId = rs.getLong("org_id"),
        userIds = userIds,
        userAttribute = userAttribute,
        dbName = rs.getString("db_name"),
        tblName = rs.getString("tbl_name"),
        conditions = conditions
      )

      policies += policy
    }

    policies
  }

  override def deleteByOrgId(orgId: Long): Future[Boolean] = Future {
    val query =
      s"""
        |delete from $dbName.$tblName
        |where org_id = ?
        |""".stripMargin
    client.executeUpdate(query, orgId) > 0
  }
}
