package co.datainsider.bi.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.domain.query.{Field, TableField}
import co.datainsider.bi.util.Serializer
import com.twitter.util.Future

import java.sql.ResultSet
import scala.collection.mutable.ListBuffer

/**
  * @author tvc12 - Thien Vi
  * @created 09/13/2021 - 5:49 PM
  */
trait DashboardFieldRepository {
  def getFields(id: DashboardId): Future[Seq[Field]]

  def setFields(id: DashboardId, fields: Seq[Field]): Future[Unit]

  def deleteFields(id: DashboardId): Future[Boolean]
}

class DashboardFieldRepositoryImpl(client: JdbcClient, dbName: String, tblName: String)
    extends DashboardFieldRepository {
  override def getFields(id: DashboardId): Future[Seq[Field]] =
    Future {
      client.executeQuery(
        s"""
       |select *
       |from $dbName.$tblName
       |where dashboard_id = ?;
       |""".stripMargin,
        id
      )(toFields)
    }

  override def setFields(id: DashboardId, fields: Seq[Field]): Future[Unit] =
    Future {
      val records: Array[Record] = prepareRecordAddFields(id, fields)
      client.executeBatchUpdate(
        s"""
         |REPLACE INTO $dbName.$tblName
         |(dashboard_id, field_id, field)
         |VALUES(?, ?, ?);
         |""".stripMargin,
        records
      ) >= 1
    }

  private def prepareRecordAddFields(id: DashboardId, fields: Seq[Field]): Array[Record] = {
    fields
      .map(field =>
        Array(
          id,
          field.normalizedFieldName,
          Serializer.toJson(field)
        )
      )
      .toArray
  }

  override def deleteFields(id: DashboardId): Future[Boolean] =
    Future {
      client.executeUpdate(
        s"""
        |DELETE FROM $dbName.$tblName
        |WHERE dashboard_id = ?;
        |""".stripMargin,
        id
      ) >= 1
    }

  private def toFields(rs: ResultSet): Seq[Field] = {
    val tableFields = ListBuffer[Field]()
    while (rs.next()) tableFields += toField(rs)
    tableFields.toSeq
  }

  private def toField(rs: ResultSet): Field = {
    val fieldAsString: String = rs.getString("field")
    Serializer.fromJson[Field](fieldAsString)
  }
}
