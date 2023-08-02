package co.datainsider.datacook.service

import com.sendgrid.helpers.mail.Mail
import com.sendgrid.helpers.mail.objects.{Attachments, Content, Email, Personalization}
import com.sendgrid.{Method, Request, Response, SendGrid}
import com.twitter.finagle.http.MediaType
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.InternalError
import co.datainsider.datacook.domain.persist.EmailConfiguration
import org.apache.http.HttpStatus

import java.io.{File, IOException}
import java.nio.file.{Files, Paths}
import java.util.Base64

case class EmailResponse(statusCode: Int, body: String)

/**
  * @author tvc12 - Thien Vi
  * @created 03/15/2022 - 4:43 PM
  */
trait EmailService {

  /**
    * send email to server with single attachment
    * @throws [InternalError] when send email has error
    * @throws [IOException] when file not exists or file larger than max email size
    */
  @throws[InternalError]
  @throws[IOException]
  def send(emailConfig: EmailConfiguration, attachmentPath: String, fileType: String): Future[EmailResponse]

  @throws[InternalError]
  @throws[IOException]
  def send(emailConfig: EmailConfiguration, attachmentPaths: Seq[String], fileType: String): Future[EmailResponse]
}

case class SendGridEmailService(
    sendGridClient: SendGrid,
    sender: String,
    senderName: String,
    rateLimitRetry: Int = 5,
    sleepInMills: Int = 5000,
    limitSizeInBytes: Int = 30000000 // 30MB
) extends EmailService
    with Logging {
  private val RATE_LIMIT_RESPONSE_CODE = 429

  private def buildPersonalization(emailConfig: EmailConfiguration): Personalization = {
    val personalization: Personalization = new Personalization()
    emailConfig.receivers.toSet.foreach((receiver: String) => personalization.addTo(new Email(receiver)))
    emailConfig.cc.toSet.foreach((cc: String) => personalization.addCc(new Email(cc)))
    emailConfig.bcc.toSet.foreach((bcc: String) => personalization.addBcc(new Email(bcc)))
    personalization
  }

  @throws[IOException]
  private def ensureFileExist(file: File): Unit = {
    if (!file.exists()) {
      throw new IOException(s"file ${file.getPath} not found")
    }
    if (!file.isFile) {
      throw new IOException(s"path ${file.getPath} is not a file")
    }
  }

  /**
    * Ensure file size
    * @param file
    */
  @throws[InternalError]
  def ensureFileSize(file: File): Unit = {
    val fileLength = file.length()
    if (fileLength > limitSizeInBytes) {
      throw InternalError(
        s"attachments path ${file.getPath} too large, current size is ${fileLength} in bytes but limit is ${limitSizeInBytes} in bytes"
      )
    }
  }

  @throws[IOException]
  @throws[InternalError]
  private def buildAttachments(file: File, mediaType: String): Attachments = {
    val attachments: Attachments = new Attachments()
    // attachment issue: https://github.com/sendgrid/sendgrid-java/issues/616
    attachments.setType(mediaType)
    attachments.setDisposition("attachment")

    val attachmentContentBytes: Array[Byte] = Files.readAllBytes(file.toPath)
    val attachmentContent: String = Base64.getEncoder.encodeToString(attachmentContentBytes)
    attachments.setContent(attachmentContent)
    attachments.setFilename(file.getName)
    attachments
  }

  @throws[IOException]
  @throws[InternalError]
  private def buildSendgridMail(
      emailConfig: EmailConfiguration,
      attachmentPaths: Seq[String],
      mediaType: String
  ): Mail = {
    val mail: Mail = new Mail()
    mail.setFrom(new Email(sender, senderName))
    val personalization: Personalization = buildPersonalization(emailConfig)
    mail.addPersonalization(personalization)
    // trick for send email with content empty
    val content = emailConfig.content.getOrElse("") + "</br"
    mail.addContent(new Content(MediaType.Html, content))
    mail.setSubject(emailConfig.subject)

    attachmentPaths.foreach(attachmentPath => {
      val file: File = new File(attachmentPath)
      ensureFileExist(file)
      ensureFileSize(file)
      val attachments: Attachments = buildAttachments(file, mediaType)
      mail.addAttachments(attachments)
    })
    return mail
  }

  /**
    * Send email and get response. If the call is rate limited,
    * method will retry up to the maximum configured time
    * @param mail: metadata of mail
    * @return response
    * @throws InternalError if has error
    */
  @throws[InternalError]
  private def sendMail(mail: Mail): Response = {
    val request: Request = new Request()
    request.setMethod(Method.POST)
    request.setEndpoint("mail/send")
    request.setBody(mail.build())

    var response: Response = null

    // Retry until the retry limit has been reached.
    for (nRetry <- 0 until rateLimitRetry) {
      try {
        response = sendGridClient.api(request)
      } catch {
        // Stop retrying if there is a network error.
        case ex: IOException => throw InternalError(s"send email failed, cause IOException ${ex.getMessage}")
        case ex: Throwable   =>
          // ignore exception, retry send
          error(s"send email in times ${nRetry} failed cause ${ex.getMessage}")
      }

      response.getStatusCode match {
        case HttpStatus.SC_REQUEST_TOO_LONG => throw InternalError("send email failed, cause attachments too large")
        case RATE_LIMIT_RESPONSE_CODE       => Thread.sleep(sleepInMills)
        case _                              => return response
      }
    }
    throw InternalError("send email failed, rate limit retry send email")
  }

  @throws[InternalError]
  private def ensureSendSuccess(response: Response): Unit = {
    val statusCode: Int = response.getStatusCode
    if (!(statusCode >= 200 && statusCode <= 299)) {
      throw InternalError(
        s"send email failed response with status = $statusCode, body: ${response.getBody}, headers: ${response.getHeaders},"
      )
    }
  }

  @throws[InternalError]
  override def send(
      emailConfig: EmailConfiguration,
      attachmentPath: String,
      fileType: String
  ): Future[EmailResponse] = {
    Future {
      val mail: Mail = buildSendgridMail(emailConfig, Seq(attachmentPath), fileType)
      val response: Response = sendMail(mail)
      ensureSendSuccess(response)
      EmailResponse(response.getStatusCode, response.getBody)
    }
  }

  @throws[InternalError]
  override def send(
      emailConfig: EmailConfiguration,
      attachmentPaths: Seq[String],
      fileType: String
  ): Future[EmailResponse] = {
    Future {
      val mail: Mail = buildSendgridMail(emailConfig, attachmentPaths, fileType)
      val response: Response = sendMail(mail)
      ensureSendSuccess(response)
      EmailResponse(response.getStatusCode, response.getBody)
    }
  }

}
