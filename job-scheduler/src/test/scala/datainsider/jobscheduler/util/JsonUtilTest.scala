package datainsider.jobscheduler.util

import datainsider.jobscheduler.domain.job.{JdbcJob, Job, JobStatus, JobType}
import datainsider.jobscheduler.domain.{DataSource, DatabaseType, JdbcProgress, JdbcSource}
import org.scalatest.FunSuite

class JsonUtilTest extends FunSuite {

  test("serialize job") {
    val job: JdbcJob = JdbcJob(
      orgId = 1,
      jobId = 1,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = 1L,
      lastSuccessfulSync = 1000000,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Synced,
      currentSyncStatus = JobStatus.Init,
      databaseName = "bi_service_schema",
      tableName = "dashboard",
      destDatabaseName = "bi_service_schema",
      destTableName = "dashboard",
      destinations = Seq("Clickhouse"),
      queryStatement = None,
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000
    )

    val json = JsonUtils.toJson(job)
    assert(json != null)
    println(json)

    val jobFromJson = JsonUtils.fromJson[Job](json)
    assert(jobFromJson != null)
    println(jobFromJson)

    assert(job == jobFromJson)
  }

  test("create job request json") {
    val job = JdbcJob(
      orgId = 1,
      jobId = 1,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = 1L,
      lastSuccessfulSync = 1000000,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Synced,
      currentSyncStatus = JobStatus.Init,
      databaseName = "bi_service_schema",
      tableName = "dashboard",
      destDatabaseName = "bi_service_schema",
      destTableName = "dashboard",
      destinations = Seq("Clickhouse"),
      queryStatement = None,
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000
    )

    val json = JsonUtils.toJson(job)

    println(json)
  }

  test("json data source") {
    val source = JdbcSource(
      orgId = 1,
      displayName = "local mysql",
      databaseType = DatabaseType.Oracle,
      jdbcUrl = "jdbc:mysql://127.0.0.1:3306",
      username = "root",
      password = "di@2020!",
      creatorId = "root",
      lastModify = System.currentTimeMillis()
    )
    val json = JsonUtils.toJson(source)
    println(json)

    val sourceFromJson = JsonUtils.fromJson[DataSource](json)
    println(sourceFromJson)
  }

  test("deserialize progress") {
    val json =
      s"""
         |{
         |  "class_name" : "jdbc_progress",
         |  "sync_id": 1,
         |  "job_id" : 30,
         |  "updated_time" : 1617687359908,
         |  "job_status" : "Synced",
         |  "total_sync_record" : 76455,
         |  "total_execution_time" : 7918,
         |  "last_synced_value" : "2018"
         |}
         |""".stripMargin

    val progress = JsonUtils.fromJson[JdbcProgress](json)
    println(progress)
  }
}
