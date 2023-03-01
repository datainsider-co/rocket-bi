package datainsider.jobscheduler.repository

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.{Await, Future}
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.jobscheduler.domain.job.{JdbcJob, Job, JobStatus, JobType}
import datainsider.jobscheduler.module.TestModule
import datainsider.lakescheduler.module.LakeTestModule
import org.scalatest.BeforeAndAfterAll

class JobRepositoryTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector =
    TestInjector(TestModule, LakeTestModule, SchemaClientModule, MockCaasClientModule).newInstance()
  val jobRepository: JobRepository = injector.instance[JobRepository]

  override def beforeAll(): Unit = {
    Await.result(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  var job: JdbcJob = null
  val orgId = 1L

  private def getMockJob(sourceId: Long = 1): Job = {
    JdbcJob(
      orgId = orgId,
      jobId = 1,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = sourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "bi_service_schema",
      tableName = "dashboard",
      destDatabaseName = "bi_service_schema",
      destTableName = "dashboard",
      destinations = Seq("Clickhouse"),
      incrementalColumn = None,
      queryStatement = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      nextRunTime = 0L
    )
  }

  test("create job") {
    val job = getMockJob()
    val r = Await.result(jobRepository.insert(orgId, "", job))
    assert(r != 0)
  }

  test("get jobs") {
    val jobs = Await.result(jobRepository.list(orgId, 0, 10, Seq(), None))
    assert(jobs.nonEmpty)
    job = jobs.head.asInstanceOf[JdbcJob]
    assert(job != null)
  }

  test("get with jobs") {
    val jobs: Seq[Job] = Await.result(jobRepository.getWith(orgId, List(JobStatus.Init), 0, 10))
    assert(jobs.nonEmpty)
  }

  test("get next job") {
    val job: Option[Job] = Await.result(jobRepository.getNextJob())
    assert(job.isDefined)
  }

  test("update job") {
    assert(Await.result(jobRepository.update(1, job.copy(currentSyncStatus = JobStatus.Queued))))
  }

  test("get queued jobs") {
    val jobs: Seq[Job] = Await.result(jobRepository.getQueuedJobs())
    assert(jobs.nonEmpty)
  }

  test("delete job") {
    assert(Await.result(jobRepository.delete(orgId, jobId = Some(job.jobId), sourceId = None)))
  }

  test("delete job by source ids is empty") {
    assert(await(jobRepository.deleteBySourceIds(orgId, Seq.empty)))
  }

  test("delete job by source id not found") {
    assert(await(jobRepository.deleteBySourceIds(orgId, Seq(-1, -2, -3))))
  }

  test("delete job by source id") {
    val job = getMockJob(100)
    val jobId = await(jobRepository.insert(orgId, "tvc12", job))
    assert(jobId > 0)
    assert(await(jobRepository.deleteBySourceIds(orgId, Seq(job.sourceId))))
    val currentJob: Option[Job] = await(jobRepository.get(orgId, jobId))
    assert(currentJob.isEmpty)
  }
}
