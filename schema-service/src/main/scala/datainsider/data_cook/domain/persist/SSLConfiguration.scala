package datainsider.data_cook.domain.persist

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonIgnore, JsonSubTypes, JsonTypeInfo}
import datainsider.client.exception.{InternalError, UnsupportedError}
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.ingestion.util.Implicits.ImplicitString

import java.io.File
import java.nio.file.{Files, Paths}
import java.util.{Base64, Properties}
import scala.util.hashing.MurmurHash3

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[JKSConfiguration], name = "jks_configuration")
  )
)
trait SSLConfiguration {
  def getProtocol(): String

  def getProperties(): Properties
}

case class JKSConfiguration(
    keyStore: KeyStoreConfiguration,
    trustStore: KeyStoreConfiguration,
    protocol: String
) extends SSLConfiguration {

  override def getProtocol(): String = protocol

  @JsonIgnore
  override def getProperties(): Properties = {
    val properties = new Properties()
    properties.setProperty("javax.net.ssl.keyStore", keyStore.credentialPath)
    properties.setProperty("javax.net.ssl.keyStorePassword", keyStore.password)
    properties.setProperty("javax.net.ssl.keyStoreType", keyStore.`type`)

    properties.setProperty("javax.net.ssl.trustStore", trustStore.credentialPath)
    properties.setProperty("javax.net.ssl.trustStorePassword", trustStore.password)
    properties.setProperty("javax.net.ssl.trustStoreType", trustStore.`type`)

    properties
  }
}

case class KeyStoreConfiguration(
    organizationId: OrganizationId,
    data: String,
    password: String,
    `type`: String,
    fileName: String
) {
  private def createOrGetFile(path: String): File = {
    try {
      val file = new File(path)
      if (!file.exists()) {
        file.getParentFile.mkdirs()
        Files.write(file.toPath, Base64.getDecoder.decode(data))
      }
      file
    } catch {
      case ex: UnsupportedError => throw ex
      case ex: Throwable        => throw InternalError(s"Init key store configuration failed, cause: ${ex.getMessage}", ex)
    }
  }

  def credentialPath: String = {
    val baseSSLDir: String = ZConfig.getString("data_cook.ssl_dir", "ssl")
    val hashName: String = MurmurHash3.stringHash(data).toString
    val finalFileName: String = s"${hashName}_${fileName}"
    val path = Paths.get(baseSSLDir, organizationId.toString, `type`, finalFileName).toString
    createOrGetFile(path).toPath.toString
  }
}
