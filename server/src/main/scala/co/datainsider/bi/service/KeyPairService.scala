package co.datainsider.bi.service

import co.datainsider.bi.domain.SshKeyPair
import co.datainsider.bi.repository.SshKeyRepository
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.{Implicits, Using}
import co.datainsider.bi.util.Implicits.FutureEnhance
import com.jcraft.jsch.{JSch, KeyPair}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.common.client.exception.NotFoundError

import java.io.ByteArrayOutputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import scala.util.Try

/**
  * created 2023-07-27 11:37 AM
  *
  * @author tvc12 - Thien Vi
  */
trait KeyPairService {
  def createKey(orgId: Long): Future[Boolean]

  /**
    * generate ssh key pair using rsa algorithm with passphrase
    *
    * @param orgId     organization id
    * @param keyLength size of key
    * @return private key, public key, passphrase
    */
  def generateKeyPair(orgId: Long, keyLength: Int = 2048): Future[SshKeyPair]

  @throws[NotFoundError]("if not found key pair for orgId")
  def getKeyPair(orgId: Long): Future[SshKeyPair]

  def cleanup(orgId: Long): Future[Boolean]
}

class KeyPairServiceImpl(sshRepository: SshKeyRepository) extends KeyPairService with Logging {
  private val PUBLIC_KEY_COMMENT = "from rocket.bi"
  private val clazz: String = getClass.getSimpleName

  def createKey(orgId: Long): Future[Boolean] =
    Profiler(s"[Service] $clazz::createKey") {
      val result: Future[Boolean] = for {
        keyPair <- generateKeyPair(orgId)
        isSuccess <- sshRepository.save(orgId, keyPair)
      } yield isSuccess
      result.rescue {
        case ex: Throwable => {
          logger.error(s"create ssh key failed ${ex.getMessage}", ex)
          Future.False
        }
      }
    }

  /**
    * generate ssh key pair using rsa algorithm with passphrase
    *
    * @param orgId     organization id
    * @param keyLength size of key
    * @return private key, public key, passphrase
    */
  override def generateKeyPair(orgId: Long, keyLength: Int = 2048): Future[SshKeyPair] =
    Profiler(s"[Service] $clazz::generateKeyPair") {
      Future {
        var keyPair: KeyPair = null
        try {
          val passphrase = UUID.randomUUID().toString
          val jsch = new JSch()
          keyPair = KeyPair.genKeyPair(jsch, KeyPair.RSA, keyLength)
          val privateKey: String = toPrivateKey(keyPair, passphrase)
          val publicKey: String = toPublicKey(keyPair)
          SshKeyPair(orgId, privateKey, publicKey, passphrase)
        } finally {
          if (keyPair != null) {
            Try(keyPair.dispose())
          }
        }
      }
    }

  private def toPrivateKey(pair: KeyPair, passphrase: String): String = {
    Using(new ByteArrayOutputStream()) { stream =>
      {
        pair.writePrivateKey(stream, passphrase.getBytes)
        new String(stream.toByteArray)
      }
    }
  }

  private def toPublicKey(pair: KeyPair): String = {
    Using(new ByteArrayOutputStream()) { stream =>
      {
        pair.writePublicKey(stream, PUBLIC_KEY_COMMENT)
        new String(stream.toByteArray)
      }
    }
  }

  override def getKeyPair(orgId: Long): Future[SshKeyPair] =
    Profiler(s"[Service] $clazz::getKeyPair") {
      sshRepository.get(orgId).map {
        case Some(keyPair) => keyPair
        case None          => throw NotFoundError(s"not found key pair for org $orgId")
      }
    }


  override def cleanup(orgId: Long): Future[Boolean] = Profiler(s"[Service] $clazz::cleanup") {
    sshRepository.delete(orgId)
  }
}

case class CacheKeyPairService(service: KeyPairService) extends KeyPairService {
  private val keyPairMap = new ConcurrentHashMap[Long, SshKeyPair]()

  override def createKey(orgId: Long): Future[Boolean] = {
    service.createKey(orgId)
  }

  override def generateKeyPair(orgId: Long, keyLength: Int): Future[SshKeyPair] =
    service.generateKeyPair(orgId, keyLength)

  override def getKeyPair(orgId: Long): Future[SshKeyPair] =
    Implicits.async {
      keyPairMap.computeIfAbsent(
        orgId,
        (_) => {
          val keyPair: SshKeyPair = service.getKeyPair(orgId).syncGet()
          keyPair
        }
      )
    }

  override def cleanup(orgId: Long): Future[Boolean] = {
    keyPairMap.remove(orgId)
    service.cleanup(orgId)
  }
}
