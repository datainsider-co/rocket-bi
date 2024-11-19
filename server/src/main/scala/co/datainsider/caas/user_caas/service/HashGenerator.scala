package co.datainsider.caas.user_caas.service

import co.datainsider.caas.user_caas.domain.PasswordMode
import co.datainsider.caas.user_caas.domain.PasswordMode.PasswordMode
import co.datainsider.caas.user_caas.util.Utils

trait HashGenerator {
  def getHash(mode: PasswordMode, passphrase: String, salt: Option[String] = None): String
}

case class PasswordHashGenerator(iterations: Int, formatAsHex: Boolean = true) extends HashGenerator {

  override def getHash(mode: PasswordMode, passphrase: String, salt: Option[String]): String = {
    mode match {
      case PasswordMode.Raw  => hashPassword(passphrase)
      case PasswordMode.Hash => passphrase
    }
  }

  private def hashPassword(passStr: String): String = {
    if (formatAsHex)
      Utils.sha256Hex(passStr, iterations)
    else Utils.sha256Hash(passStr, iterations)
  }
}
