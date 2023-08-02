package co.datainsider.bi.service

import co.datainsider.bi.domain.{SshKeyPair, SshConfig}
import co.datainsider.bi.util.StringUtils
import com.jcraft.jsch.{JSch, Session}
import datainsider.client.exception.InternalError

import scala.collection.mutable
import scala.util.Try

/**
 * created 2023-07-26 11:58 AM
 *
 * @author tvc12 - Thien Vi
 */
object SshSessionManager {
  /**
   * key: host:port:username
   * value: session
   */
  private val sessionMap: mutable.Map[String, SshSession] = mutable.HashMap.empty

  def getSession(keyPair: SshKeyPair, config: SshConfig): SshSession = {
    val sid: String = buildSessionId(keyPair.orgId, config)
    if (!sessionMap.contains(sid)) {
      this.synchronized {
        if (!sessionMap.contains(sid)) {
          val session: SshSession = createSession(keyPair, config)
          sessionMap.put(sid, session)
        }
      }
    }
    sessionMap(sid)
  }

  def createSession(keyPair: SshKeyPair, config: SshConfig): SshSession = {
    ensureConfig(keyPair, config)
    val jsch = new JSch()
    jsch.addIdentity("key", keyPair.privateKey.getBytes, keyPair.publicKey.getBytes, keyPair.passphrase.getBytes)
    val session: Session = jsch.getSession(config.username, config.host, config.port)
    session.setConfig("StrictHostKeyChecking", "no")
    session.setServerAliveInterval(config.aliveIntervalMs)
    session.setTimeout(config.timeoutMs)
    session.connect()
    new SshSession(session, config.host)
  }

  private def buildSessionId(orgId: Long, config: SshConfig): String = {
    StringUtils.shortMd5(s"$orgId:${config.host}:${config.port}:${config.username}")
  }

  def closeSession(orgId: Long, config: SshConfig): Unit = {
    val sid: String = buildSessionId(orgId, config)
    if (sessionMap.contains(sid)) {
      this.synchronized {
        if (sessionMap.contains(sid)) {
          Try(sessionMap(sid).close())
          sessionMap.remove(sid)
        }
      }
    }
  }

  private def ensureConfig(keyPair: SshKeyPair, config: SshConfig): Unit = {
    if (String.valueOf(keyPair.publicKey).trim != String.valueOf(config.publicKey).trim) {
      throw InternalError("Public key in tunnel config is not match with public key in ssh key pair")
    }
  }

}

class SshSession(session: Session, remoteHost: String) extends AutoCloseable {

  /**
   * key: remoteHost:remotePort
   * value: localPort
   */
  private val assignedPortMap: mutable.Map[String, Int] = mutable.HashMap.empty

  def isOpen(): Boolean = session.isConnected

  def getLocalHost(): String = "localhost"

  def close(): Unit = {
    assignedPortMap.clear()
    session.disconnect()
  }

  /**
   * auto assign local port to remote port
   * @return port in local machine
   * @throws Exception if session is not open
   */
  def forwardLocalPort(remoteHost: String, remotePort: Int): Int = {
    require(isOpen, "Session is not open")
    val key: String = s"$remoteHost:$remotePort"
    if (!assignedPortMap.contains(key)) {
      this.synchronized {
        if (!assignedPortMap.contains(key)) {
          val assignedPort = session.setPortForwardingL(getLocalHost(), 0, remoteHost, remotePort)
          assignedPortMap.put(key, assignedPort)
        }
      }
    }
    assignedPortMap(key)
  }

  def forwardLocalPorts(remotePorts: Seq[Int]): Seq[Int] = {
    remotePorts.map(forwardLocalPort(this.remoteHost, _))
  }

  def forwardLocalPorts(remoteHost: String, remotePorts: Seq[Int]): Seq[Int] = {
    remotePorts.map(forwardLocalPort(remoteHost, _))
  }
}
