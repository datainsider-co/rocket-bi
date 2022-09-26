package datainsider.user_caas.services

import com.twitter.inject.Test
import datainsider.user_profile.util
import datainsider.user_caas.util.Utils

/**
  * @author andy
  * @since 8/12/20
  * */
class CryptoTest extends Test {

  test("hash: `123456` with 1 iterations to hex string") {
    val password = "123456"
    val hashedPassword = Utils.sha256Hex(password, 1)
    println(hashedPassword)
    assertResult("8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92")(hashedPassword)

  }

  test("hash: `sadmin@2020!` with 512 iterations to base64 string") {
    val password = "sadmin@2020!";
    val hashedPassword = Utils.sha256Hash(password, 512)
    println(hashedPassword)
    assertResult("RCqQvOY8cT0vxivD78FZLLaXA3LJY8Zq23T1brfV0po=")(hashedPassword)

  }

  test("hash: `admin@2020!` with 512 iterations to base64 string") {
    val password = "admin@2020!";
    val hashedPassword = Utils.sha256Hash(password, 512)
    println(hashedPassword)
    assertResult("FRAWCUkPf0pom+CJq8FMWMjWEGwBHrAgUiZZMsdQ4bk=")(hashedPassword)
  }

  test("AES encrypt/decrypt") {
    val key = "admin@2020!2e3e3"
    val plainData = "heelo ne"
    val encrypted = util.Utils.encrypt(plainData, key)
    val decrypted = util.Utils.decrypt(encrypted, key)

    assertResult(true)(encrypted != null)
    assertResult(true)(decrypted != null)
    println(s"Plain: $plainData")
    println(s"Encrypted: $encrypted")
    println(s"Decrypted: $decrypted")
  }

  test("AES encrypt/decrypt token ") {
    val key = "di!22233118@2020"
    val encrypted =
      "JMh6y4tNHFJQXd7cbPwXhLB7NkSSFPhKVhGesK9IZPBJLsu231A4M03DA7mb1zTT4NPp+ebwBErP8daiqpC85u1aHiQ6u2nwevGw+kjKUSI="
    val decrypted = util.Utils.decrypt(encrypted, key)

    assertResult(true)(encrypted != null)
    assertResult(true)(decrypted != null)
    println(s"Encrypted: $encrypted")
    println(s"Decrypted: $decrypted")
  }
}
