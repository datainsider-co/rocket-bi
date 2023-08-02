package co.datainsider.jobworker.util

import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.TLSConfiguration
import co.datainsider.jobworker.domain.source.MongoSource
import com.mongodb._
import nl.altindag.ssl.SSLFactory
import nl.altindag.ssl.util.PemUtils

import java.io.File
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.util.Base64

object MongoSupportUtils {
  def writeFileFromBase64Data(filePath: String, data: String): String = {
    val file = new File(filePath)
    file.getParentFile.mkdirs()
    Files.write(file.toPath, Base64.getDecoder.decode(data))
    file.getAbsolutePath
  }

  def writeFile(filePath: String, data: String): String = {
    val file = new File(filePath)
    file.getParentFile.mkdirs()
    Files.write(file.toPath, data.getBytes(StandardCharsets.UTF_8))
    file.getAbsolutePath
  }

  def buildMongoClient(dataSource: MongoSource): MongoClient = {
    dataSource.tlsConfiguration match {
      case None            => buildClientByURI(dataSource)
      case Some(tlsConfig) => buildClientBySSLContext(dataSource, tlsConfig)
    }
  }

  def buildClientByURI(dataSource: MongoSource): MongoClient = {
    val encoded_pwd = URLEncoder.encode(dataSource.password, "UTF-8")
    val uri = dataSource.connectionUri match {
      case Some(uri) => uri
      case None =>
        dataSource.port match {
          case Some(port) => s"mongodb://${dataSource.username}:$encoded_pwd@${dataSource.host}:$port/"
          case None       => s"mongodb+srv://${dataSource.username}:$encoded_pwd@${dataSource.host}"
        }
    }

    new MongoClient(new MongoClientURI(uri))
  }

  def buildClientBySSLContext(dataSource: MongoSource, tlsConfig: TLSConfiguration): MongoClient = {
    val certificateKeyFileData: String =
      new String(Base64.getDecoder.decode(tlsConfig.certificateKeyFileData), StandardCharsets.US_ASCII)
    val ca: String = new String(Base64.getDecoder.decode(tlsConfig.caFileData), StandardCharsets.US_ASCII)

    val certificate: String = certificateKeyFileData.substring(
      certificateKeyFileData.indexOf("-----BEGIN CERTIFICATE-----"),
      certificateKeyFileData.indexOf("-----END CERTIFICATE-----") + 25
    )
    val privateKey: String = certificateKeyFileData.substring(
      certificateKeyFileData.indexOf("-----BEGIN PRIVATE KEY-----")
    )
    val keyManager =
      PemUtils.parseIdentityMaterial(certificate, privateKey, tlsConfig.certificateKeyFilePassword.toCharArray())
    val trustManager = PemUtils.parseTrustMaterial(ca)
    val sslFactory = SSLFactory.builder().withIdentityMaterial(keyManager).withTrustMaterial(trustManager).build()
    val sslContext = sslFactory.getSslContext
    val options = MongoClientOptions.builder().sslEnabled(true).sslContext(sslContext).build()

    val authenticationDb = ZConfig.getString("mongodb.db_store_user", "admin") // for selly
    val credential: MongoCredential =
      MongoCredential.createCredential(dataSource.username, authenticationDb, dataSource.password.toCharArray())
    new MongoClient(new ServerAddress(dataSource.host, dataSource.port.get.toInt), credential, options)
  }
}
