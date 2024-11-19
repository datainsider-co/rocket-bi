package co.datainsider.client

import co.datainsider.bi.client.NativeJDbcClient
import com.jcraft.jsch.{JSch, Session}
import com.twitter.inject.Test

import java.time.Duration

/**
 * created 2023-07-25 10:35 AM
 *
 * @author tvc12 - Thien Vi
 */
class SSHTunnelTest extends Test {

  val passphrase = "123456"
  val username = "admin"
  val host = ""
  val port = 22
  val timeoutMs = Duration.ofMinutes(1).toMillis.toInt
  val aliveIntervalMs = Duration.ofMinutes(2).toMillis.toInt
  /**
   *TODO: pending test case because don't have ssh server
   * If you want to test this case:
   * 1. add public key in keys/id_rsa.pub to .ssh/authorized_keys in ssh server
   * 2. change host, port in this test case
   */

  test("open ssh tunnel using public key") {
    pending
    val jsch = new JSch()
    val privateKeyPath = getClass.getClassLoader.getResource("keys/id_rsa").getPath
    println(s"privateKeyPath: $privateKeyPath")
    jsch.addIdentity(privateKeyPath, passphrase)
    val session: Session = jsch.getSession(username, host, port)
    session.setConfig("StrictHostKeyChecking", "no")
    session.setServerAliveInterval(aliveIntervalMs)
    session.setTimeout(timeoutMs)
    session.connect()

    val assignedPort = session.setPortForwardingL(0, "localhost", 13306)
    println(s"assignedPort: server: rocket-bi.ddns.net:13306 -> localhost:${assignedPort}")

    session.disconnect()
  }

}
