//package co.datainsider.client
//
//import co.datainsider.bi.client.MailChimpClient
//import org.scalatest.FunSuite
//
//class MailChimpClientTest extends FunSuite {
//  val client = new MailChimpClient("us21", "268b326e52ed94ba30147a1a12b29f95-us21", "d29ea39189")
//
//  test("test ping") {
//    assert(client.ping() != null)
//  }
//
//  test("test add member to list") {
//    val resp = client.addMember("nkt165@gmail.com", "Thien", "Nguyen")
//    assert(resp)
//  }
//}
