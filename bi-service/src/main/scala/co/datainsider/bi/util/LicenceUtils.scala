package co.datainsider.bi.util

import com.twitter.inject.Logging

import java.io.File
import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Paths}
import java.security.{KeyFactory, PublicKey, Signature}
import java.security.spec.X509EncodedKeySpec
import java.util.Base64
import scala.io.Source

object LicenceUtils extends Logging {
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

  def validateLicence: Boolean = {
    val publicKeyLoc: String = ZConfig.getString("public_key_location", "conf/licence_key.txt")
    val licenceFileLoc: String = ZConfig.getString("licence_file_location", "conf/licence_info.txt")
    val signatureFileLoc: String = ZConfig.getString("signature_file_location", "conf/signature.txt")

    val publicKey: File = new File(publicKeyLoc)
    val licenceFile: File = new File(licenceFileLoc)
    val signatureFile: File = new File(signatureFileLoc)

    if (!publicKey.exists()) {
      error("licence key file not found")
      false
    } else if (!licenceFile.exists()) {
      error("licence info file not found")
      false
    } else if (!signatureFile.exists()) {
      error("signature file not found")
      false
    } else if (!LicenceUtils.verify(publicKeyLoc, licenceFileLoc, signatureFileLoc)) {
      error("invalid licence")
      false
    } else {
      val source: Source = Source.fromFile(licenceFileLoc)
      val json: String = source.getLines().mkString("\n")
      val licenceInfo: LicenceInfo = Serializer.fromJson[LicenceInfo](json)
      source.close()
      if (licenceInfo.expiredDate < System.currentTimeMillis()) {
        error(s"expired licence: $licenceInfo")
        false
      } else true
    }
  }

  def checkLicence(): Unit = {
    if (!validateLicence) {
      println("invalid licence")
      error("invalid licence")
      System.exit(1)
    }
  }

}
