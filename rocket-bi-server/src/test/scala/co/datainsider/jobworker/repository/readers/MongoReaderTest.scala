package co.datainsider.jobworker.repository.readers

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.repository.reader.{IncrementalMongoReader, MongoReader, SimpleMongoReader}
import co.datainsider.jobworker.util.JsonUtils
import com.mongodb.{MongoClient, MongoClientURI}
import com.twitter.inject.Test
import co.datainsider.schema.domain.column.{Column, DateTimeColumn}
import org.scalatest.BeforeAndAfterAll

import java.net.URLEncoder
import java.sql.Timestamp

class MongoReaderTest extends Test with BeforeAndAfterAll {

  val host: String = ZConfig.getString("test_db.mongodb.host")
  val port: Int = ZConfig.getInt("test_db.mongodb.port")
  val username: String = ZConfig.getString("test_db.mongodb.username")
  val password: String = ZConfig.getString("test_db.mongodb.password")
  val encoded_pwd: String = URLEncoder.encode(password, "UTF-8")
  val uri = s"mongodb://$username:$encoded_pwd@$host:$port"
  val client = new MongoClient(new MongoClientURI(uri))

  override def afterAll(): Unit = {
    client.close()
    super.afterAll()
  }

  test("simple mongodb reader test") {
    val databaseName = "highschool"
    val tableName = "student"
    val reader = new SimpleMongoReader(1L, client, databaseName, tableName, 0)

    val schema = reader.getTableSchema
    val total = reader.getTotal
    val data = reader.getNextRecords(schema.columns)
    println(total)
    data.foreach(println)
    assert(total == 0)
    assert(data.isEmpty)
  }
  // fixme: need to insert data into mongodb
//
//  test("get table schema test") {
//    val databaseName = "highschool"
//    val tableName = "student"
//    val reader: MongoReader = new SimpleMongoReader(1L, client, databaseName, tableName, 0)
//    val schema = reader.getTableSchema
//    assert(schema.columns.nonEmpty)
//    val expectedColumnsJson =
//      """[ {
//        |  "name" : "_id",
//        |  "display_name" : "_id",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "id",
//        |  "display_name" : "id",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "Int64"
//        |}, {
//        |  "name" : "name",
//        |  "display_name" : "name",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "address",
//        |  "display_name" : "address",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "age",
//        |  "display_name" : "age",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "Int64"
//        |}, {
//        |  "name" : "birthday",
//        |  "display_name" : "birthday",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "gender",
//        |  "display_name" : "gender",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "Int64"
//        |}, {
//        |  "name" : "average_score",
//        |  "display_name" : "average_score",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "Float64"
//        |}, {
//        |  "name" : "email",
//        |  "display_name" : "email",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "test_decimal",
//        |  "display_name" : "test_decimal",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "Int64"
//        |} ]""".stripMargin
//
//    assert(expectedColumnsJson.equals(JsonUtils.toJson(schema.columns)))
//  }
//
//  test("get table schema with flatted depth test") {
//    val databaseName = "sample_mflix"
//    val tableName = "theaters"
//    val reader: MongoReader = new SimpleMongoReader(1L, client, databaseName, tableName, 2)
//    val schema = reader.getTableSchema
//    assert(schema.columns.nonEmpty)
//    val expectedColumnJson: String =
//      """[ {
//        |  "name" : "_id",
//        |  "display_name" : "_id",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "theaterId",
//        |  "display_name" : "theaterId",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "Int64"
//        |}, {
//        |  "name" : "location.address.street1",
//        |  "display_name" : "location.address.street1",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.city",
//        |  "display_name" : "location.address.city",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.state",
//        |  "display_name" : "location.address.state",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.zipcode",
//        |  "display_name" : "location.address.zipcode",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.geo.type",
//        |  "display_name" : "location.geo.type",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.geo.coordinates",
//        |  "display_name" : "location.geo.coordinates",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.street2",
//        |  "display_name" : "location.address.street2",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |} ]""".stripMargin
//
//    assert(expectedColumnJson.equals(JsonUtils.toJson(schema.columns)))
//  }
//
//  test("get table schema with flatted depth is 3 test") {
//    val databaseName = "sample_mflix"
//    val tableName = "theaters"
//    val reader: MongoReader = new SimpleMongoReader(1L, client, databaseName, tableName, 3)
//    val schema = reader.getTableSchema
//    assert(schema.columns.nonEmpty)
//    val expectedColumnJson: String =
//      """[ {
//        |  "name" : "_id",
//        |  "display_name" : "_id",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "theaterId",
//        |  "display_name" : "theaterId",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "Int64"
//        |}, {
//        |  "name" : "location.address.street1",
//        |  "display_name" : "location.address.street1",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.city",
//        |  "display_name" : "location.address.city",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.state",
//        |  "display_name" : "location.address.state",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.zipcode",
//        |  "display_name" : "location.address.zipcode",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.geo.type",
//        |  "display_name" : "location.geo.type",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.geo.coordinates",
//        |  "display_name" : "location.geo.coordinates",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |}, {
//        |  "name" : "location.address.street2",
//        |  "display_name" : "location.address.street2",
//        |  "is_nullable" : true,
//        |  "is_encrypted" : false,
//        |  "data_type" : "String"
//        |} ]""".stripMargin
//
//    println(JsonUtils.toJson(schema.columns))
//    assert(expectedColumnJson.equals(JsonUtils.toJson(schema.columns)))
//  }
//
//  test("incremental mongodb reader test") {
//    val databaseName = "highschool"
//    val tableName = "student"
//    val reader: MongoReader = new IncrementalMongoReader(
//      1L,
//      client = client,
//      dbName = databaseName,
//      collection = tableName,
//      incrementalColumn = "id",
//      lastSyncedValue = "10",
//      0
//    )
//
//    val schema = reader.getTableSchema
//    val total = reader.getTotal
//    val data = reader.getNextRecords(schema.columns)
//    println(total)
//    data.foreach(println)
//    assert(total == 10)
//    assert(data.nonEmpty)
//  }
//
//  test("array list mongodb reader test") {
//    val databaseName = "sample_training"
//    val tableName = "grades"
//    val reader: MongoReader = new IncrementalMongoReader(
//      1L,
//      client = client,
//      dbName = databaseName,
//      collection = tableName,
//      incrementalColumn = "class_id",
//      lastSyncedValue = "499",
//      0
//    )
//
//    val schema = reader.getTableSchema
//    val total = reader.getTotal
//    val data = reader.getNextRecords(schema.columns)
//    println(total)
//    assert(total == 211)
//    assert(data.nonEmpty)
//
//    val expectedArrayData: String =
//      """[ "{\"type\": \"exam\", \"score\": 0.2898348199689482}", "{\"type\": \"quiz\", \"score\": 13.88300815704696}", "{\"type\": \"homework\", \"score\": 61.998362329748836}", "{\"type\": \"homework\", \"score\": 35.69524705901108}" ]""".stripMargin
//    val actualData: Option[Record] = data.find(_.head.equals("56d5f7eb604eb380b0d8d9e6"))
//    assert(actualData.nonEmpty)
//    val actualArrayData: String = actualData.get(2).toString
//    println(actualArrayData)
//    assert(actualArrayData.equals(expectedArrayData))
//  }
//
//  test("iso date reader test") {
//    val databaseName = "sample_analytics"
//    val tableName = "transactions"
//    val reader: MongoReader = new IncrementalMongoReader(
//      1L,
//      client = client,
//      dbName = databaseName,
//      collection = tableName,
//      incrementalColumn = "transaction_count",
//      lastSyncedValue = "99",
//      0
//    )
//
//    val schema = reader.getTableSchema
//    val data = reader.getNextRecords(schema.columns)
//
//    val dateTimeColumnName: String = "bucket_start_date"
//    val dateTimeColumn: Option[Column] = schema.findColumn(dateTimeColumnName)
//    assert(dateTimeColumn.nonEmpty)
//    assert(dateTimeColumn.get.isInstanceOf[DateTimeColumn])
//
//    val dateTimeData: Timestamp =
//      data.head(schema.columns.indexWhere(_.name.equals(dateTimeColumnName))).asInstanceOf[Timestamp]
//    val expectedData: Long = -222652800000L // 1962-12-12 08:00:00.0
//    assert(dateTimeData.getTime.equals(expectedData))
//  }
}
