//package co.datainsider.caas.user_caas.services
//
//import com.sendgrid.{Method, Request, SendGrid}
//import com.sendgrid.helpers.mail.Mail
//import com.sendgrid.helpers.mail.objects.{Content, Email}
//import com.twitter.inject.Test
//import co.datainsider.caas.user_profile.controller.http.request.RegisterOrgRequest
//import co.datainsider.caas.user_profile.util.{JsonParser, Utils}
//
//class SenGridClientTest extends Test {
//  test("send email with sendgrid") {
//    val from = new Email("nkt165@gmail.com")
//    val to = new Email("nkt165@gmail.com")
//    val subject = "test sendgrid send email"
//    val content = new Content("text/plain", "easy way to send email")
//    val mail = new Mail(from, subject, to, content)
//
//    val sg = new SendGrid(???)
//    val request = new Request()
//    import java.io.IOException
//    try {
//      request.setMethod(Method.POST)
//      request.setEndpoint("mail/send")
//      request.setBody(mail.build)
//      val response = sg.api(request)
//      System.out.println(response.getStatusCode)
//      System.out.println(response.getBody)
//      System.out.println(response.getHeaders)
//    } catch {
//      case ex: IOException =>
//        throw ex
//    }
//  }
//
//  test("serialize regisOrgRequest") {
//    val req = RegisterOrgRequest(
//      "Nguyen",
//      "Thien",
//      "nkt165@gmail.com",
//      "asd@123",
//      "0918217954",
//      "DI Organization Service",
//      "test@datainsider.co",
//      Some("abcxyz")
//    )
//    val json = JsonParser.toJson(req)
//    println(json)
//  }
//}
