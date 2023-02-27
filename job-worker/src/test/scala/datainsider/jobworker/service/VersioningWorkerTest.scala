package datainsider.jobworker.service

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.client.service.{MockSchemaClientService, OrgClientService, SchemaClientService}
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.VersioningWorkerImpl

class VersioningWorkerTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule, SchemaClientModule, MockCaasClientModule).newInstance()

  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val orgClientService: OrgClientService = injector.instance[OrgClientService]

  test("test versioning worker") {
    val versioningWorker = new VersioningWorkerImpl(schemaService, orgClientService)
    versioningWorker.run()
  }
}
