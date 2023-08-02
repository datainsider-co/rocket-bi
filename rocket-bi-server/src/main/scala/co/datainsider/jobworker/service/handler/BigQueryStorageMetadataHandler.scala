package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.domain.job.BigQueryStorageJob
import co.datainsider.jobworker.domain.source.GoogleServiceAccountSource
import co.datainsider.jobworker.repository.reader.BigQueryStorageReader
import co.datainsider.jobworker.util.JsonUtils
import com.fasterxml.jackson.databind.JsonNode
import com.google.auth.oauth2.ServiceAccountCredentials
import com.google.cloud.bigquery.JobStatistics.QueryStatistics
import com.google.cloud.bigquery.{BigQuery, BigQueryOptions, Dataset, Field, JobInfo, QueryJobConfiguration}
import com.twitter.util.Future

import java.io.{ByteArrayInputStream, InputStream}
import scala.jdk.CollectionConverters.iterableAsScalaIterableConverter

case class BigQueryStorageMetadataHandler(dataSource: GoogleServiceAccountSource, extraData: Option[String])
    extends SourceMetadataHandler {

  val credentials: ServiceAccountCredentials =
    try {
      val serviceAccountStream: InputStream = new ByteArrayInputStream(dataSource.credential.getBytes())
      try ServiceAccountCredentials.fromStream(serviceAccountStream)
      finally if (serviceAccountStream != null) serviceAccountStream.close()
    }

  override def testConnection(): Future[Boolean] =
    Future {
      val client: BigQuery = buildBigQueryClient("")
      val query = "select 1"
      val queryOptions: QueryJobConfiguration = QueryJobConfiguration.newBuilder(query).build()
      try {
        client.query(queryOptions).iterateAll().asScala.head.get(0).getLongValue.equals(1L)
      } catch {
        case _: Throwable => false
      }
    }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      try {
        val extraDataJson: JsonNode = JsonUtils.fromJson[JsonNode](extraData.getOrElse("{}"))
        val location = parseLocation(extraDataJson)
        val projectName = parseProjectName(extraDataJson)
        val client: BigQuery = buildBigQueryClient(location)
        client.listDatasets(projectName).iterateAll().asScala.map(dataset => dataset.getDatasetId.getDataset).toSeq
      } catch {
        case _: Throwable => Seq()
      }
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      try {
        val extraDataJson: JsonNode = JsonUtils.fromJson[JsonNode](extraData.getOrElse("{}"))
        val location = parseLocation(extraDataJson)
        val projectName = parseProjectName(extraDataJson)
        val client: BigQuery = buildBigQueryClient(location)
        val dataset: Option[Dataset] =
          client.listDatasets(projectName).iterateAll().asScala.find(_.getDatasetId.getDataset.equals(databaseName))
        if (dataset.nonEmpty) {
          dataset.get.list().iterateAll().asScala.map(table => table.getTableId.getTable).toSeq
        } else {
          Seq()
        }
      } catch {
        case _: Throwable => Seq()
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] =
    Future {
      try {
        val extraDataJson: JsonNode = JsonUtils.fromJson[JsonNode](extraData.getOrElse("{}"))
        val location = parseLocation(extraDataJson)
        val projectName = parseProjectName(extraDataJson)
        val client: BigQuery = buildBigQueryClient(location)
        val query = s"select * from `$projectName`.`$databaseName`.`$tableName`"
        val fields: Seq[Field] = detectFields(client, query)
        fields.map(field => field.getName)
      } catch {
        case _: Throwable => Seq()
      }
    }

  //    https://cloud.google.com/bigquery/docs/dry-run-queries
  def detectFields(client: BigQuery, query: String): Seq[Field] = {
    try {
      val queryConfig: QueryJobConfiguration = QueryJobConfiguration
        .newBuilder(query)
        .setDryRun(true)
        .build
      val result: QueryStatistics = client.create(JobInfo.of(queryConfig)).getStatistics[QueryStatistics]
      result.getSchema.getFields.asScala.toSeq
    } catch {
      case ex: Throwable => throw new InternalError(ex.getMessage, ex)
    }
  }

  override def testJob(job: Job): Future[Boolean] =
    Future {
      try {
        val reader =
          BigQueryStorageReader(source = dataSource, job = job.asInstanceOf[BigQueryStorageJob], destTableSchema = None)
        reader.hasNext
      } catch {
        case _: Throwable => false
      }
    }

  private def buildBigQueryClient(location: String): BigQuery = {
    val builder = BigQueryOptions.newBuilder()
    builder.setCredentials(credentials)
    if (location.nonEmpty) { builder.setLocation(location) }
    builder.build().getService
  }

  private def parseLocation(extraData: JsonNode): String = {
    val key: String = "location"
    if (extraData.has(key)) {
      extraData.get(key).asText()
    } else {
      ""
    }
  }

  private def parseProjectName(extraData: JsonNode): String = {
    val key: String = "projectName"
    if (extraData.has(key)) {
      extraData.get(key).asText()
    } else {
      JsonUtils.fromJson[JsonNode](dataSource.credential).get("project_id").asText()
    }
  }
}
