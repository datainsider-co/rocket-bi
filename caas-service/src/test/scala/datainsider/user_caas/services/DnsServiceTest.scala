//package datainsider.user_caas.services
//
//import com.twitter.inject.Test
//import com.twitter.util.Await
//import datainsider.user_profile.service.CloudflareDnsService
//
//class DnsServiceTest extends Test {
//
//  val dnsService = new CloudflareDnsService
//
//  test("test create domain") {
//    val result = Await.result(dnsService.create("hello.datainsider.co"))
//    println(result)
//  }
//
//  test("test check existence") {
//    val result = Await.result(dnsService.get("hello.datainsider.co"))
//    println(result)
//  }
//}
