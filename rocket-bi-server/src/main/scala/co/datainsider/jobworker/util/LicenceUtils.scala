package co.datainsider.jobworker.util

import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Paths}
import java.security.{KeyFactory, PublicKey, Signature}
import java.security.spec.X509EncodedKeySpec
import java.util.Base64

object LicenceUtils {
  case class LicenceInfo(companyName: String, issuer: String, createdDate: Long, expiredDate: Long)

  private val decoder: Base64.Decoder = Base64.getDecoder

  def verify(publicKeyLoc: String, dataFileLoc: String, signedFileLoc: String): Boolean = {
    val signer = Signature.getInstance("SHA256withRSA")
    signer.initVerify(getPublicKeyFromFile(publicKeyLoc))
    signer.update(Files.readAllBytes(Paths.get(dataFileLoc)))
    signer.verify(readBase64(signedFileLoc))
  }

  def getPublicKeyFromFile(publicKeyLoc: String): PublicKey = {
    try {
      val keySpec = new X509EncodedKeySpec(readBase64(publicKeyLoc))
      val keyFactory = KeyFactory.getInstance("RSA")
      keyFactory.generatePublic(keySpec)
    } catch {
      case e: Throwable => throw new Exception("invalid public key")
    }
  }

  private def readBase64(fileLoc: String): Array[Byte] = {
    val content: String = new String(Files.readAllBytes(Paths.get(fileLoc)), StandardCharsets.UTF_8)
    decoder.decode(content)
  }

}
