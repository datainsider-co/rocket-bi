package datainsider.user_caas.util

import org.apache.shiro.crypto.hash.Sha256Hash

import java.sql.PreparedStatement
import scala.util.Random

/**
  * @author sonpn
  */
object Utils {
  val random = Random

  def randomInt(from: Int = Integer.MIN_VALUE, to: Int = Integer.MAX_VALUE): Int = {
    val randomVal = random.nextInt(to)
    if (randomVal < from) randomInt(from, to) else randomVal
  }

  def sha256Hash(plainText: String, iterations: Int = 1): String = {
    new Sha256Hash(plainText, null, iterations).toBase64
  }

  def sha256Hex(plainText: String, iterations: Int = 1): String = {
    new Sha256Hash(plainText, null, iterations).toHex
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

}
