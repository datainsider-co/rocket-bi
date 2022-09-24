package datainsider.user_profile.controller

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Status
import datainsider.client.domain.org.Organization
import datainsider.login_provider.controller.DataInsiderServer
import datainsider.user_profile.util.JsonParser

// Todo: invalid recaptcha token, check again
//class OrganizationControllerTest extends DataInsiderServer {
//
//  val email = "nkt165@gmail.com"
//  val password: String = "asd@123"
//  var activationToken: String = null
//
//  var id: Long = -1
//  test("test register new organization") {
//    val r = server.httpPost(
//      "/organizations",
//      postBody = s"""
//        |{
//        |  "first_name" : "Nguyen",
//        |  "last_name" : "Thien",
//        |  "work_email" : "$email",
//        |  "password": "$password",
//        |  "phone_number" : "0918217954",
//        |  "company_name" : "Audi Corp",
//        |  "sub_domain": "audi",
//        |  "re_captcha_token": "some_token"
//        |}
//        |""".stripMargin,
//      andExpect = Status.Ok
//    )
//    val resp = r.getContentString()
//    val org = JsonParser.fromJson[Organization](resp)
//    println(org)
//    id = org.organizationId
//  }
//
//  test("test update domain") {
//    val r = server.httpPut(
//      path = s"/organizations/$id/domain",
//      putBody = """
//          |{
//          |  "new_sub_domain": "bmw"
//          |}
//          |""".stripMargin,
//      andExpect = Status.Ok
//    )
//    val resp = r.getContentString()
//    println(resp)
//  }
//
//  test("test delete organization") {
//    val r = server.httpDelete(
//      path = s"/organizations/$id",
//      andExpect = Status.Ok
//    )
//    val resp = r.getContentString()
//    assert(resp != null)
//    println(resp)
//  }
//
//}
