package co.datainsider.caas.user_profile.controller.http.request

import co.datainsider.caas.user_profile.controller.http.filter.user.UsernameFilterRequest
import co.datainsider.caas.user_profile.util.Utils

/**
  * @author anhlt
  */

case class LoginByUserPassRequest(username: String, password: String)
    extends UsernameFilterRequest {
  def getUsername(): String = username
}

case class LoginByEmailPassRequest(email: String, password: String)

case class LoginByPhoneRequest(var phoneNumber: String, password: String) {
  phoneNumber = Utils.normalizePhoneNumber(phoneNumber)
}
