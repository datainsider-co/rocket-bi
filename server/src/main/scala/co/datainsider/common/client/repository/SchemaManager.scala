package co.datainsider.common.client.repository

import co.datainsider.bi.client.JdbcClient
import com.twitter.inject.Logging
import com.twitter.util.Future

import scala.collection.mutable.ArrayBuffer


trait SchemaManager {

  /** *
   * ensure table schema is created in storage and all fields in tables are valid
   */
  def ensureSchema(): Future[Boolean]
}

trait MySqlSchemaManager extends SchemaManager with Logging {
  val client: JdbcClient
  val dbName: String
  val tblName: String
  val requiredFields: List[String]

  /** *
   * create schema for a specific table, function to be implemented by child classes
   * @return true if schema is ready to use, false otherwise
   */
  def createTable(): Future[Boolean]

  override def ensureSchema(): Future[Boolean] = {
    info(s"ensuring $dbName.$tblName...")
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

