package co.datainsider.datacook.util

import co.datainsider.datacook.domain.persist.KeyStoreConfiguration
import com.twitter.inject.Test
import org.apache.commons.io.FileUtils

import java.io.File
import java.nio.charset.StandardCharsets
import java.util.Base64

/**
  * @author tvc12 - Thien Vi
  * @created 03/09/2022 - 1:14 PM
  */
class KeyStoreConfigurationTest extends Test {
  test("Decode and and code key file by base64") {
    val keyFile: File = new File(getClass.getClassLoader.getResource("keys/key.jks").getFile)
    val bytes = Base64.getEncoder.encode(FileUtils.readFileToByteArray(keyFile))
    val keyAsString = new String(bytes, StandardCharsets.US_ASCII)
    println(s"keyAsString: size ${keyAsString.length} bytes")
    val configuration = KeyStoreConfiguration(1, keyAsString, "12782389@", "JKS", "keystore.jks")
    println(configuration.credentialPath)
    val file = new File(configuration.credentialPath)
    assertResult(true)(file.exists())
    val key2AsString =
      new String(Base64.getEncoder.encode(FileUtils.readFileToByteArray(file)), StandardCharsets.US_ASCII)
    assertResult(key2AsString)(keyAsString)
    file.delete()
  }
}
