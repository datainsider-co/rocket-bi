package datainsider.user_profile.controller.http.request

import datainsider.user_profile.controller.http.filter.email.ConfirmEmailFilterRequest
import datainsider.user_profile.controller.http.filter.user.UsernameFilterRequest
import datainsider.user_profile.util.Utils

/**
  * @author anhlt
  */

case class LoginByUserPassRequest(username: String, password: String)
    extends UsernameFilterRequest
    with ConfirmEmailFilterRequest {
  override def getUsername(): String = username
}

case class LoginByEmailPassRequest(email: String, password: String)

case class LoginByPhoneRequest(var phoneNumber: String, password: String) {
  phoneNumber = Utils.normalizePhoneNumber(phoneNumber)
}
