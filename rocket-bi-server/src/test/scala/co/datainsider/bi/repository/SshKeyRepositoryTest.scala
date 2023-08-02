package co.datainsider.bi.repository

import co.datainsider.bi.domain.SshKeyPair
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class SshKeyRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()

  val orgId: Long = 100
  val keyRepository: SshKeyRepository = injector.instance[SshKeyRepository]
  val expectKeyPair = SshKeyPair(orgId, "privateKey", "publicKey", "passphrase")

  test("test save key") {
    val result: Boolean = await(keyRepository.save(orgId, expectKeyPair))
    assert(result)
  }

  test("get key saved") {
    val result: Option[SshKeyPair] = await(keyRepository.get(orgId))
    assert(result.isDefined)
    assert(result.get.orgId == orgId)
    assert(result.get.privateKey == expectKeyPair.privateKey)
    assert(result.get.publicKey == expectKeyPair.publicKey)
    assert(result.get.passphrase == expectKeyPair.passphrase)
  }

  test("delete key") {
    val result: Boolean = await(keyRepository.delete(orgId))
    assert(result)
  }

  test("get key after delete") {
    val result: Option[SshKeyPair] = await(keyRepository.get(orgId))
    assert(result.isEmpty)
  }

}
