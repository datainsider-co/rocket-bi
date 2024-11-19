package co.datainsider.caas.user_caas.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object UserType extends Enumeration {
  type UserType = Value
  val User: UserType = Value("user")
  val ApiKey: UserType = Value("api_key")
}

class UserTypeRef extends TypeReference[UserType.type]
