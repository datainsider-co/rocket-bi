package co.datainsider.caas.user_profile.util

import datainsider.client.exception.NotFoundError
import org.apache.commons.codec.binary.Base64
import org.apache.commons.io.FileUtils

import java.io.File
import java.math.BigInteger
import java.security.SecureRandom
import java.sql.PreparedStatement
import java.util.Calendar
import java.util.concurrent.TimeUnit
import scala.util.Random

/**
  * @author anhlt
  */
object Utils {

  val random = new SecureRandom()

  lazy val EMAIL_PATTERN =
    "^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$"

  def randomInt(from: Int = Integer.MIN_VALUE, to: Int = Integer.MAX_VALUE): Int = {
    val randomVal = random.nextInt(to)
    if (randomVal < from) randomInt(from, to) else randomVal
  }

  def randomAlphanumeric(nChars: Int = 24): String = {
    new BigInteger(nChars * 5, random).toString(32)
  }

  def sha256Hash(plainText: String, hashIterations: Int = 512): String = {
    import org.apache.shiro.crypto.hash.Sha256Hash
    new Sha256Hash(plainText, null, hashIterations).toBase64
  }

  def parameterizeStatement(statement: PreparedStatement, values: Seq[Any]): PreparedStatement = {

    values.zipWithIndex.foreach {
      case (value, index) =>
        val paramIndex = index + 1
        value match {
          case v: java.sql.Date        => statement.setDate(paramIndex, v)
          case v: java.sql.Time        => statement.setTime(paramIndex, v)
          case v: java.sql.Timestamp   => statement.setTimestamp(paramIndex, v)
          case v: Boolean              => statement.setBoolean(paramIndex, v)
          case v: Byte                 => statement.setByte(paramIndex, v)
          case v: Int                  => statement.setInt(paramIndex, v)
          case v: Long                 => statement.setLong(paramIndex, v)
          case v: Float                => statement.setFloat(paramIndex, v)
          case v: Double               => statement.setDouble(paramIndex, v)
          case v: java.math.BigDecimal => statement.setBigDecimal(paramIndex, v)
          case v: String               => statement.setString(paramIndex, v)
          case e: Any                  => throw new IllegalArgumentException(s"unsupported data type + $e + ${e.getClass}")
        }
    }
    statement
  }

  @deprecated("use isValidEmailV1, this method maybe incorrect")
  def isValidEmail(email: String, emailRegex: String): Boolean = {
    val rex = emailRegex.r
    email match {
      case rex(email) => true
      case _          => false
    }
  }

  def createDefaultEmail(domain: String): String = s"test@${domain}"

  def isValidEmailDomain(emailDomain: String): Boolean = isValidEmailV1(createDefaultEmail(emailDomain), EMAIL_PATTERN)

  def isWhitelistEmail(email: String, whitelistEmail: Seq[String]): Boolean = {
    isValidEmailV1(email, EMAIL_PATTERN) match {
      case false => false
      case true =>
        if (whitelistEmail.nonEmpty) {
          val emailDomain = email.split('@').last
          whitelistEmail.exists(email => emailDomain.equalsIgnoreCase(email))
        } else {
          true
        }
    }
  }

  def isValidEmailV1(email: String, emailRegex: String): Boolean = {
    val rex = emailRegex.r
    rex.findFirstMatchIn(email) match {
      case Some(_) => true
      case None    => false
    }
  }

  def getNickname(email: Option[String], defaultValue: String = ""): String = {
    email match {
      case Some(x) => x.split("@")(0)
      case _       => defaultValue
    }
  }

  def normalizePhoneNumber(phoneNum: String): String = {
    var formatPhone = phoneNum
    if (phoneNum.startsWith("+")) {
      formatPhone = phoneNum.substring(1)
    } else if (phoneNum.startsWith("0")) {
      formatPhone = "84" + phoneNum.substring(1)
    }
    formatPhone
  }

  val timeUnits = Seq(
    (1L, Calendar.MILLISECOND),
    (TimeUnit.SECONDS.toMillis(1), Calendar.SECOND),
    (TimeUnit.MINUTES.toMillis(1), Calendar.MINUTE),
    (TimeUnit.HOURS.toMillis(1), Calendar.HOUR_OF_DAY),
    (TimeUnit.DAYS.toMillis(1), Calendar.DAY_OF_MONTH)
  )

  def roundTimeByInterval(time: Long, interval: Long): Long = {
    val cal = Calendar.getInstance()
    cal.setTimeInMillis(time)
    roundLevelByInterval(interval).foreach(i => cal.set(i, 0))
    incByItv(cal.getTimeInMillis, interval)(_ + interval < time)
  }

  def incByItv(initValue: Long, step: Long)(condition: Long => Boolean): Long =
    if (!condition(initValue))
      initValue
    else
      incByItv(initValue + step, step)(condition)

  private def roundLevelByInterval(interval: Long): Seq[Int] = {
    timeUnits.filter(_._1 <= interval).map(_._2)
  }

  def readBinaryFile(file: String): Array[Byte] = {
    FileUtils.readFileToByteArray(new File(file))
  }

  def throwIfNotExist[T](v: Option[T], msg: Option[String] = None) =
    v match {
      case Some(x) => x
      case _       => throw NotFoundError(msg.getOrElse(""))
    }

  val initVector = "encryptionIntVec"

  def encrypt(plainText: String, secretKey16Byte: String = "di!22233118@2020"): String = {

    import javax.crypto.Cipher
    import javax.crypto.spec.{IvParameterSpec, SecretKeySpec}
    val key = new SecretKeySpec(getUTF8Bytes(secretKey16Byte), "AES")
    val iv = new IvParameterSpec(getUTF8Bytes(initVector))

    val encipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")
    val input = getUTF8Bytes(plainText)
    encipher.init(Cipher.ENCRYPT_MODE, key, iv)
    val encrypted = encipher.doFinal(input)
    Base64.encodeBase64String(encrypted)
  }

  def decrypt(encrypted: String, secretKey16Byte: String = "di!22233118@2020"): String = {

    import org.apache.commons.codec.binary.Base64

    import javax.crypto.Cipher
    import javax.crypto.spec.{IvParameterSpec, SecretKeySpec}
    val iv = new IvParameterSpec(initVector.getBytes("UTF-8"))
    val skeySpec = new SecretKeySpec(secretKey16Byte.getBytes("UTF-8"), "AES")

    val cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")
    cipher.init(Cipher.DECRYPT_MODE, skeySpec, iv)
    val decrypted = cipher.doFinal(Base64.decodeBase64(encrypted))
    new String(decrypted)
  }

  import java.nio.charset.StandardCharsets

  private def getUTF8Bytes(input: String) = input.getBytes(StandardCharsets.UTF_8)
}
