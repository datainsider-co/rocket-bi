package datainsider.jobscheduler.repository

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.jobscheduler.domain.job.JobStatus
import datainsider.jobscheduler.module.TestModule
import datainsider.lakescheduler.domain.HttpCloneInfo
import datainsider.lakescheduler.domain.job.{BuildTool, JavaJob, LakeJobStatus}
import datainsider.lakescheduler.module.LakeTestModule
import datainsider.lakescheduler.repository.LakeJobRepository
import org.scalatest.BeforeAndAfterAll

class LakeJobRepositoryTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(TestModule, LakeTestModule, SchemaClientModule, MockCaasClientModule).newInstance()
  val repo: LakeJobRepository = injector.instance[LakeJobRepository]

  override def beforeAll(): Unit = {
    Await.result(injector.instance[SchemaManager](Names.named("lake-job-schema")).ensureSchema())
  }

  test("create job") {
    val job = JavaJob(
      orgId = 1,
      jobId = 1,
      name = "test java job",
      lastRunTime = 1000000,
      lastRunStatus = LakeJobStatus.Init,
      currentJobStatus = LakeJobStatus.Init,
      gitCloneInfo = HttpCloneInfo("https://git@123", "", ""),
      buildTool = BuildTool.Maven,
      buildCmd = "mvn clean package",
      scheduleTime = ScheduleOnce(0),
      creatorId = "trung hau"
    )
    val r = Await.result(repo.insert(1, job))
    assert(r != 0)
  }

  var job: JavaJob = null
  test("get jobs") {
    val jobs = Await.result(repo.list(orgId = 1, keyword = "",from =  0, size =  10, sorts = Seq.empty))
    assert(jobs.nonEmpty)
    job = jobs.head.asInstanceOf[JavaJob]
    assert(job != null)
    println(job)
  }

  test("get with jobs") {
    val jobs = Await.result(repo.getWith(1, List(JobStatus.Init), 0, 10))
    jobs.foreach(println)
    assert(jobs.nonEmpty)
  }

  test("get next job") {
    val job = Await.result(repo.getNextJob)
    println(job)
    assert(job != null)
  }

  test("update job") {
    assert(Await.result(repo.update(1, job.copy(currentJobStatus = LakeJobStatus.Queued))))
  }

  test("delete job") {
    assert(Await.result(repo.delete(1, job.jobId)))
  }
}
