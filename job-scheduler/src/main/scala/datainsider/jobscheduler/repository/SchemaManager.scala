package datainsider.jobscheduler.repository

import com.twitter.util.Future
import datainsider.jobscheduler.client.JdbcClient

import scala.collection.mutable.ArrayBuffer

trait SchemaManager {

  /***
    * ensure table schema is created in storage and all fields in tables are valid
    */
  def ensureSchema(): Future[Boolean]
}

abstract class MySqlSchemaManager extends SchemaManager {
  val client: JdbcClient
  val dbName: String
  val tblName: String
  val requiredFields: List[String]

  /***
    * create schema for a specific table, function to be implemented by child classes
    * @return true if schema is ready to use, false otherwise
    */
  def createTable(): Future[Boolean]

  def ensureSchema(): Future[Boolean] = {
    ensureDatabase()
    if (!isTableExist) createTable()
    else isTableValid
  }

  private def ensureDatabase(): Boolean = {
    val query = s"create database if not exists $dbName;"
    client.executeUpdate(query) >= 0
  }

  private def isTableExist: Boolean = {
    val query = s"show tables from $dbName like '$tblName';"
    client.executeQuery(query)(_.next())
  }

  private def isTableValid: Future[Boolean] =
    Future {
      val query = s"desc $dbName.$tblName;"
      val actualFields = ArrayBuffer.empty[String]
      client.executeQuery(query)(rs => {
        while (rs.next()) actualFields += rs.getString("Field")
      })
      actualFields.toSet == requiredFields.toSet
    }

}
