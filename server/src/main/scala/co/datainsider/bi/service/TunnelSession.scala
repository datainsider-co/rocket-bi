package co.datainsider.bi.service

import co.datainsider.bi.domain.{SshConfig, SshKeyPair, TunnelConnection}
import co.datainsider.common.client.exception.InternalError
import com.jcraft.jsch.{JSch, Session}

import scala.collection.mutable

/**
  * created 2023-12-14 3:39 PM
  *
  * @author tvc12 - Thien Vi
  */

case class TunnelSession(
    session: Session,
    remoteHost: String,
    remotePorts: Set[Int]
) extends AutoCloseable {
  private val assignedPortMap: mutable.Map[Int, Int] = mutable.HashMap.empty

  def isConnected(): Boolean = session.isConnected

  def close(): Unit = {
    if (isConnected()) {
      session.disconnect()
    }
    assignedPortMap.clear()
  }
  def open(): Unit = {
    if (!isConnected()) {
      session.connect()
      forwardLocalPort(remoteHost, remotePorts)
    }
  }

  def getMappedHost(): String = "localhost"

  def getMappedPortAsMap(): Map[Int, Int] = assignedPortMap.toMap

  /**
    * auto assign local port to remote port
    * @return port in local machine
    * @throws Exception if session is not open
    */
  private def forwardLocalPort(remoteHost: String, remotePorts: Set[Int]): Unit = {
    require(isConnected(), "SSH Connection is not open")
    remotePorts.foreach(remotePort => {
      if (!assignedPortMap.contains(remotePort)) {
        this.synchronized {
          if (!assignedPortMap.contains(remotePort)) {
            val assignedPort: Int = session.setPortForwardingL(getMappedHost(), 0, remoteHost, remotePort)
            assignedPortMap.put(remotePort, assignedPort)
          }
        }
      }
    })
  }

}

object TunnelSession {
  def newBuilder(): TunnelSessionBuilder = new TunnelSessionBuilder()
}

class TunnelSessionBuilder() {

  private var keyPair: SshKeyPair = _
  private var connection: TunnelConnection = _

  def setKeyPair(keyPair: SshKeyPair): TunnelSessionBuilder = {
    this.keyPair = keyPair
    this
  }

  def setTunnelConnection(connection: TunnelConnection): TunnelSessionBuilder = {
    this.connection = connection
    this
  }

  def build(): TunnelSession = {
    require(keyPair != null, "key pair must be defined")
    require(connection != null, "connection must be defined")
    require(connection.tunnelConfig.isDefined, "connection must have tunnel config")
    if (String.valueOf(keyPair.publicKey).trim != String.valueOf(connection.tunnelConfig.get.publicKey).trim) {
      throw InternalError("Public key in tunnel config is not match with public key in ssh key pair")
    }
    val session = createSession(keyPair, connection.tunnelConfig.get)
    TunnelSession(session, connection.getRemoteHost(), connection.getRemotePorts().toSet)
  }

  private def createSession(keyPair: SshKeyPair, config: SshConfig): Session = {
    val jsch = new JSch()
    jsch.addIdentity("key", keyPair.privateKey.getBytes, keyPair.publicKey.getBytes, keyPair.passphrase.getBytes)
    val session: Session = jsch.getSession(config.username, config.host, config.port)
    session.setConfig("StrictHostKeyChecking", "no")
    session.setServerAliveInterval(config.aliveIntervalMs)
    session.setTimeout(config.timeoutMs)
    session
  }
}
