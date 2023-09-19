package co.datainsider.datacook.service

import co.datainsider.datacook.domain.persist.EmailConfiguration
import com.sendgrid.SendGrid
import com.twitter.finagle.http.MediaType
import com.twitter.inject.Test
import datainsider.client.util.ZConfig

import java.io.IOException

/**
  * @author tvc12 - Thien Vi
  * @created 03/16/2022 - 11:13 AM
  */
class EmailServiceTest extends Test {

  private def createEmailService(): EmailService = {
    val apiKey: String = ZConfig.getString("data_cook.send_grid.api_key")
    val sender: String = ZConfig.getString("data_cook.send_grid.sender")
    val senderName: String = ZConfig.getString("data_cook.send_grid.sender_name")
    val rateLimitRetry: Int = ZConfig.getInt("data_cook.send_grid.rate_limit_retry")
    val sleepInMills: Int = ZConfig.getInt("data_cook.send_grid.sleep_in_mills")
    val sendGrid = new SendGrid(apiKey)
    SendGridEmailService(sendGrid, sender, senderName, rateLimitRetry, sleepInMills)
  }
  private val emailService: EmailService = createEmailService()

  // todo: cmt this test case cause maximum credit of sendgrid

//  test("send mail to 1 user") {
//    val config = new EmailConfiguration(
//      Array("meomeocf98@gmail.com"),
//      fileName = "sales.csv",
//      subject = "Daily Send Sales Records"
//    )
//    val path = getClass.getClassLoader.getResource("datasets/orders.csv").getPath
//    val response = await(emailService.send(config, path, MediaType.Csv))
//    assertResult(response != null)(true)
//    println(response.body)
//  }

//  test("send excel to 1 user") {
//    val config = new EmailConfiguration(
//      Array("meomeocf98@gmail.com"),
//      fileName = "sales.xlsx",
//      subject = "Daily Send Sales Records"
//    )
//    val path = getClass.getClassLoader.getResource("datasets/sample.xlsx").getPath
//    val response = await(emailService.send(config, path, MediaType.Html))
//    assertResult(response != null)(true)
//    println(response.body)
//  }

//  test("send email with empty content") {
//    val config = new EmailConfiguration(
//      Array("meomeocf98@gmail.com"),
//      fileName = "sales.csv",
//      subject = "Daily Send Sales Records",
//      content = Some("")
//    )
//    val path = getClass.getClassLoader.getResource("datasets/orders.csv").getPath
//    val response = await(emailService.send(config, path, MediaType.Csv))
//    assertResult(response != null)(true)
//    println(response.body)
//  }

//  test("send email to address not exits") {
//    val config =
//      EmailConfiguration(Array("tvc12@ohmypet.app"), fileName = "sales.csv", subject = "Daily Send Sales Records")
//    val path = getClass.getClassLoader.getResource("datasets/orders.csv").getPath
//    val response = await(emailService.send(config, path, MediaType.Csv))
//    assertResult(response != null)(true)
//    println(response.body)
//  }

  test("send email with attachments path not exits") {
    try {
      val config =
        EmailConfiguration(Array("meomeocf98@gmail.com"), fileName = "sales.csv", subject = "Daily Send Sales Records")
      val path = "data/testing/samples1"
      val response = await(emailService.send(config, path, MediaType.Csv))
      assertResult(response != null)(true)
      println(response.body)
    } catch {
      case ex: IOException => assert(true)
      case ex: Throwable   => assert(false)
    }
  }

//  test("send email with big attachments") {
//    try {
//      val config =
//        EmailConfiguration(Array("meomeocf98@gmail.com"), fileName = "sales.csv", subject = "Daily Send Sales Records")
//      val path = getClass.getClassLoader.getResource("datasets/tripdata.csv").getPath
//      val response = await(emailService.send(config, path, MediaType.Csv))
//      assertResult(response != null)(true)
//    } catch {
//      case ex: Throwable => assert(true)
//    }
//  }

//  test("send multi file to 1 user") {
//    val config = new EmailConfiguration(
//      Array("meomeocf98@gmail.com"),
//      fileName = "sales.csv",
//      subject = "Daily Send Sales Records"
//    )
//    val orderPath = getClass.getClassLoader.getResource("datasets/orders.csv").getPath
//    val salePath = getClass.getClassLoader.getResource("datasets/sales.csv").getPath
//    val response = await(emailService.send(config, Seq(orderPath, salePath), MediaType.Csv))
//    assertResult(response != null)(true)
//    println(response.body)
//  }
}
