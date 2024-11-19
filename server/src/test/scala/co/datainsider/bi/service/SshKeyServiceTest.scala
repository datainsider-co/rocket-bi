package co.datainsider.bi.service

import co.datainsider.bi.domain.SshKeyPair
import co.datainsider.bi.module.{TestBIClientModule, TestCommonModule, TestContainerModule, TestModule}
import co.datainsider.bi.repository.SshKeyRepository
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

/**
 * created 2023-07-27 12:16 PM
 *
 * @author tvc12 - Thien Vi
 */
 class SshKeyServiceTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule, TestBIClientModule, TestContainerModule, TestCommonModule).newInstance()
  val sshKeyService = injector.instance[KeyPairService]
  val sshKeyRepsotiory = injector.instance[SshKeyRepository]
  val orgId: Long = 1000

  override def beforeAll(): Unit = {
    super.beforeAll()
    await(sshKeyRepsotiory.delete(orgId))
  }

  override def afterAll(): Unit = {
    super.afterAll()
    await(sshKeyRepsotiory.delete(orgId))
  }

  test("create key success") {
    val success: Boolean = await(sshKeyService.createKey(orgId))
    assert(success)
  }

  test("create key fail") {
    val success: Boolean = await(sshKeyService.createKey(orgId))
    assert(!success)
  }

  test("get key pair") {
    val sshKeyPair: SshKeyPair = await(sshKeyService.getKeyPair(orgId))
    println("get key pair success")
    println("passphrase: " + sshKeyPair.passphrase)

    assert(sshKeyPair.orgId == orgId)
    assert(sshKeyPair.privateKey.nonEmpty)
    assert(sshKeyPair.publicKey.nonEmpty)
    assert(sshKeyPair.passphrase.nonEmpty)
  }


  test("generate ssh key") {
    val sshKeyPair: SshKeyPair = await(sshKeyService.generateKeyPair(orgId))
    println("generate ssh key success")
    println("passphrase: " + sshKeyPair.passphrase)

    assert(sshKeyPair.orgId == orgId)
    assert(sshKeyPair.privateKey.nonEmpty)
    assert(sshKeyPair.publicKey.nonEmpty)
    assert(sshKeyPair.passphrase.nonEmpty)
  }

}
