package co.datainsider.bi.client

import co.datainsider.bi.domain.{ClickhouseConnection, Connection, SshKeyPair}
import co.datainsider.bi.service.{ConnectionService, KeyPairService}
import com.twitter.util.Future

import javax.inject.Inject

/**
  * created 2023-12-13 1:56 PM
  *
  * @author tvc12 - Thien Vi
  */
trait BIClientService {
  def get(orgId: Long): Future[Connection]

  def getKeyPair(orgId: Long): Future[SshKeyPair]
}

class BIClientServiceImpl @Inject() (service: ConnectionService, keyPairService: KeyPairService)
    extends BIClientService {
  override def get(orgId: Long): Future[Connection] = service.get(orgId)

  override def getKeyPair(orgId: Long): Future[SshKeyPair] = keyPairService.getKeyPair(orgId)
}

class MockBIClientService(clickhouse: ClickhouseConnection) extends BIClientService {
  override def get(orgId: Long): Future[Connection] = Future.value(clickhouse)

  override def getKeyPair(orgId: Long): Future[SshKeyPair] = Future.value(SshKeyPair(orgId, "", "", ""))
}
