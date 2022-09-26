package datainsider.user_caas.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object PasswordMode extends scala.Enumeration {
  type PasswordMode = Value
  val Raw: PasswordMode = Value("raw")
  val Hash: PasswordMode = Value("hash")
}

class PasswordModeRef extends TypeReference[PasswordMode.type]
