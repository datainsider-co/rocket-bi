package co.datainsider.jobworker.service

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.client.OrgClientService
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobworker.module.JobWorkerTestModule
import co.datainsider.jobworker.service.worker.VersioningWorkerImpl
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.schema.client.{MockSchemaClientService, SchemaClientService}
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
import datainsider.notification.service.NotificationService

class VersioningWorkerTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(
      JobWorkerTestModule,
      TestContainerModule,
      MockHadoopFileClientModule,
      MockLakeClientModule,
      MockSchemaClientModule,
      MockCaasClientModule,
      TestModule
    ).newInstance()

  // TODO: implement versioning worker with connections

  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val orgClientService: OrgClientService = injector.instance[OrgClientService]
  val notificationService: NotificationService = injector.instance[NotificationService]
  val versioningWorker = new VersioningWorkerImpl(schemaService, orgClientService, notificationService)

  test("test versioning worker") {
    versioningWorker.cleanUpTmpTables()
  }

  test("test check isExpired") {
    val expiredTables = Seq(
      "__di_old_transactions_1600151232000",
      "__di_old_a_1600151232000"
    )

    expiredTables.foreach(tblName => {
      val isExpired = versioningWorker.isExpired(tblName)
      assert(isExpired)
    })

    val unexpiredTables = Seq(
      s"__di_tmp_transactions_${System.currentTimeMillis()}",
      s"__di_old_transactions_${System.currentTimeMillis()}",
      s"__di__transactions_${System.currentTimeMillis()}",
      s"__di_old__${System.currentTimeMillis()}",
      "__di_old__1600151232000",
      "transaction",
      "__di_transaction"
    )

    unexpiredTables.foreach(tblName => {
      val isExpired = versioningWorker.isExpired(tblName)
      assert(!isExpired)
    })

  }

  test("test get status") {
    val status = versioningWorker.status().sync()
    println(status)
  }

}
