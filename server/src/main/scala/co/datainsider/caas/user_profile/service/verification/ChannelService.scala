package co.datainsider.caas.user_profile.service.verification

import co.datainsider.bi.util.Implicits.async
import com.sendgrid.SendGrid
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.caas.user_profile.domain.Implicits._
import org.apache.commons.mail._

import scala.collection.JavaConversions.mapAsScalaMap

/**
  * @author anhlt
  */

trait ChannelService {
  def sendMessage(receiver: String, subject: String, message: String): Future[Unit]

  def sendHtmlMessage(receiver: String, subject: String, message: String): Future[Unit]
}

case class SMTPEmailService(host: String, port: Int, username: String, password: String)
    extends ChannelService
    with Logging {

  override def sendMessage(email: String, subject: String, message: String): Future[Unit] = {
    val commonsMail: Email = new SimpleEmail().setMsg(message)
    commonsMail.setAuthentication(username, password)
    commonsMail.setHostName(host)
    commonsMail.setSmtpPort(port)
    commonsMail.setSSLOnConnect(true)
    commonsMail.addTo(email)
    commonsMail
      .setFrom(email, "DataInsider")
      .setSubject(subject)
      .send()
      .onSuccess(_ => {})
      .onFailure(fn => throw new Exception("Send email failed"))
      .map(f => {
        //DO Some thing
      })
  }

  override def sendHtmlMessage(email: String, subject: String, html: String): Future[Unit] = {
    val commonsMail: Email = new HtmlEmail().setHtmlMsg(html)
    commonsMail.setAuthentication(username, password)
    commonsMail.setHostName(host)
    commonsMail.setSmtpPort(port)
    commonsMail.setSSLOnConnect(true)
    commonsMail.addTo(email)
    commonsMail
      .setFrom(email, "DataInsider")
      .setSubject(subject)
      .send()
      .onSuccess(_ => {})
      .onFailure(fn => throw new Exception("Send email faild"))
      .map(f => {
        //DO Some thing
      })
  }

}

case class SendGridEmailService(sendGrid: SendGrid, sender: String, senderName: String) extends ChannelService with Logging {

  override def sendMessage(email: String, subject: String, message: String): Future[Unit] = ???

  override def sendHtmlMessage(email: String, subject: String, html: String): Future[Unit] = {
    Future {
      import com.sendgrid._
      import com.sendgrid.helpers.mail.Mail
      import com.sendgrid.helpers.mail.objects._
      val request = new Request()
      try {
        val content = new Content("text/html", html)
        val mail = new Mail(new Email(sender, senderName), subject, new Email(email), content)
        request.setMethod(Method.POST)
        request.setEndpoint("mail/send")
        request.setBody(mail.build())
        val response = sendGrid.api(request)
        val code = response.getStatusCode
        if (!(code >= 200 && code <= 299)) {
          throw new InternalError(s"Response with status = $code headers: ${response.getHeaders.toMap}")
        }
      } catch {
        case ex: Exception =>
          error(s"Exception in sendHtmlMessage($email, $subject)", ex)
          throw ex
      }
    }
  }

}
