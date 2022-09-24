package co.datainsider.bi.util

import org.apache.commons.text.similarity.JaroWinklerSimilarity
import java.math.BigInteger
import java.security.MessageDigest

object StringUtils {

  def toSnakeCase(value: String): String = {
    value
      .toLowerCase()
      .replaceAll("[^A-Za-z0-9]", " ")
      .replaceAll("-+", " ")
      .replaceAll("\\n", " ")
      .replaceAll("\\r", " ")
      .replaceAll("\\s+", " ")
      .trim()
      .replaceAll(" ", "_")
      .replaceAll("_+", "_")
  }

  /** *
    * This function remove special character, VietNamese sign. And replace space to '_'
    * @param str
    * @return
    */
  def normalizeVietnamese(str: String): String = {
    val removedSpaceString = str.trim.replaceAll("\\s+", "_")
    removeSpecialCharacters(toUnsignVietNamese(removedSpaceString))
  }

  /** *
    * This function just unsign lower character. Please sure all character is lower before use it
    * @param str
    * @return
    */
  def toUnsignVietNamese(str: String): String = {
    val sourceString: String =
      "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ"
    val finalString: String =
      "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD"

    str.map(char => {
      if (sourceString.contains(char))
        finalString.charAt(sourceString.indexOf(char))
      else
        char
    })
  }

  def removeSpecialCharacters(str: String): String = {
    str.trim.toLowerCase.replaceAll("[^a-z0-9_]+", "")
  }

  def calculateSimilarScore(sourceString: String, finalString: String): Double = {
    val jaroWinklerSimilarity: JaroWinklerSimilarity = new JaroWinklerSimilarity
    jaroWinklerSimilarity.apply(sourceString, finalString)
  }

  def findClosestString(str: String, targetStrings: Seq[String]): Option[String] = {
    if (targetStrings.nonEmpty) {
      val threshold: Double = Some(ZConfig.getDouble("text_similarity_score.value")).getOrElse(1)
      val scores = targetStrings.map(item => calculateSimilarScore(str, item))

      if (scores.max >= threshold) {
        val maxScoreIndex = scores.indexOf(scores.max)
        Some(targetStrings(maxScoreIndex))
      } else None
    } else
      None
  }

  /**
    * https://alvinalexander.com/source-code/scala-method-create-md5-hash-of-string/
    * @param input
    * @return returns a 32-character MD5 hash version of the input string
    */
  def md5(input: String): String = {
    val md = MessageDigest.getInstance("MD5")
    val digest: Array[Byte] = md.digest(input.getBytes)
    val bigInt = new BigInteger(1, digest)
    bigInt.toString(16).trim
  }

  def shortMd5(input: String, length: Int = 6): String = {
    md5(input).take(length)
  }
}
