//package co.datainsider.jobscheduler.repository
//
//import co.datainsider.bi.module.{TestContainerModule, TestModule}
//import co.datainsider.caas.user_profile.module.MockCaasClientModule
//import co.datainsider.jobscheduler.domain.job.{JdbcJob, Job, JobStatus, JobType}
//import co.datainsider.jobscheduler.module.JobScheduleTestModule
//import com.google.inject.name.Names
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import org.scalatest.BeforeAndAfterAll
//
//class JobRepositoryTest extends IntegrationTest with BeforeAndAfterAll {
//  override protected def injector: Injector =
//    TestInjector(JobScheduleTestModule, MockCaasClientModule, TestContainerModule, TestModule).newInstance()
//
//  val jobRepository: JobRepository = injector.instance[JobRepository]
//  val orgId = 12L
//  var job: JdbcJob = null
//
//  override def beforeAll(): Unit = {
//    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
//    await(injector.instance[SchemaManager].ensureSchema())
//  }
//
//  private def getMockJob(sourceId: Long = 1): Job = {
//    JdbcJob(
//      orgId = orgId,
//      jobId = 1,
//      displayName = "sad",
//      jobType = JobType.Jdbc,
//      sourceId = sourceId,
//      lastSuccessfulSync = 0,
//      syncIntervalInMn = 0,
//      lastSyncStatus = JobStatus.Init,
//      currentSyncStatus = JobStatus.Init,
//      databaseName = "bi_service_schema",
//      tableName = "dashboard",
//      destDatabaseName = "bi_service_schema",
//      destTableName = "dashboard",
//      destinations = Seq("Clickhouse"),
//      incrementalColumn = None,
//      queryStatement = None,
//      lastSyncedValue = "0",
//      maxFetchSize = 1000,
//      nextRunTime = 0L
//    )
//  }
//
//  test("create job") {
//    val job = getMockJob()
//    val newJob = await(jobRepository.insert(orgId, "", job))
//    assert(newJob != 0)
//  }
//
//  test("get jobs") {
//    val jobs = await(jobRepository.list(orgId, 0, 10, Seq(), None, Seq.empty))
//    assert(jobs.nonEmpty)
//    job = jobs.head.asInstanceOf[JdbcJob]
//    assert(job != null)
//  }
//
//  test("get jobs with filter is terminated") {
//    val jobs = await(jobRepository.list(orgId, 0, 10, Seq(), None, Seq(JobStatus.Terminated)))
//    assert(jobs.isEmpty)
//  }
//
//  test("get with jobs") {
//    val jobs: Seq[Job] = await(jobRepository.getWith(orgId, List(JobStatus.Init), 0, 10))
//    assert(jobs.nonEmpty)
//  }
//
//  test("get next job") {
//    val _ = await(jobRepository.getNextJob())
//  }
//
//  test("update job") {
//    assert(await(jobRepository.update(orgId, job.copy(currentSyncStatus = JobStatus.Queued))))
//  }
//
//  test("get queued jobs") {
//    Thread.sleep(1000)
//    val jobs: Seq[Job] = await(jobRepository.getQueuedJobs())
//    assert(jobs.nonEmpty)
//  }
//
//  test("delete job") {
//    assert(await(jobRepository.delete(orgId, jobId = Some(job.jobId), sourceId = None)))
//  }
//
//  test("delete job by source ids is empty") {
//    assert(await(jobRepository.deleteBySourceIds(orgId, Seq.empty)))
//  }
//
//  test("delete job by source id not found") {
//    assert(await(jobRepository.deleteBySourceIds(orgId, Seq(-1, -2, -3))))
//  }
//
//  test("delete job by source id") {
//    val job = getMockJob(100)
//    val jobId = await(jobRepository.insert(orgId, "tvc12", job))
//    assert(jobId > 0)
//    assert(await(jobRepository.deleteBySourceIds(orgId, Seq(job.sourceId))))
//    val currentJob: Option[Job] = await(jobRepository.get(orgId, jobId))
//    assert(currentJob.isEmpty)
//  }
//}
