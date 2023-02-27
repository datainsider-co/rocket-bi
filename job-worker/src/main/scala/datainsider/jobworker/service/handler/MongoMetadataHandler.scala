package datainsider.jobworker.service.handler
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.jobworker.domain.{Job, MongoJob, MongoSource}
import datainsider.jobworker.repository.reader.{MongoReader, SimpleMongoReader}
import datainsider.jobworker.util.MongoSupportUtils.buildMongoClient

import java.io.File
import scala.collection.mutable.ArrayBuffer
import scala.reflect.io.Directory

class MongoMetadataHandler(dataSource: MongoSource) extends SourceMetadataHandler {

  def testConnection(): Future[Boolean] = Future {
    val client = buildMongoClient(dataSource)
    val isConnected: Boolean = client.listDatabases().iterator().hasNext
    client.close()
    isConnected
  }

  def listDatabases(): Future[Seq[String]] = Future {
    val client = buildMongoClient(dataSource)
    val databases: Seq[String] = client.getDatabaseNames.toArray().map(_.toString).toSeq
    client.close()
    databases
  }

  def listTables(databaseName: String): Future[Seq[String]] = Future {
    val collectionNames = ArrayBuffer.empty[String]
    val client = buildMongoClient(dataSource)
    val database = client.getDatabase(databaseName)
    val collections = database.listCollectionNames().iterator()
    while (collections.hasNext) {
      collectionNames += collections.next()
    }
    client.close()
    collectionNames
  }

  def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = Future {
    val client = buildMongoClient(dataSource)
    val reader: MongoReader = new SimpleMongoReader(dataSource.orgId, client, databaseName, tableName, 0)
    val listColumn = reader.getTableSchema.columns.map(_.name)
    reader.cleanUp()
    listColumn
  }

  def suggestSchema(databaseName: String, tableName: String): Future[TableSchema] = Future {
    val client = buildMongoClient(dataSource)
    val reader: MongoReader = new SimpleMongoReader(dataSource.orgId, client, databaseName, tableName, 0)
    val schema = reader.getTableSchema
    reader.cleanUp()
    schema
  }

  override def testJob(job: Job): Future[Boolean] = Future {
    val mongoJob = job.asInstanceOf[MongoJob]
    val client = buildMongoClient(dataSource)
    val database = client.getDatabase(mongoJob.databaseName)
    val collection = database.getCollection(mongoJob.tableName)
    val isSuccess = collection.find().limit(10).iterator().hasNext
    client.close()
    isSuccess
  }

  private def deleteDirectory(path: String): Boolean = {
    val directory = new Directory(new File(path))
    directory.deleteRecursively()
  }
}
