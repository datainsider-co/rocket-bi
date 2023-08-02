package co.datainsider.datacook.domain.persist

import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.{Operator, SendEmailOperator}
import co.datainsider.datacook.util.StringUtils
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.exception.BadRequestError

/**
  * @author tvc12 - Thien Vi
  * @created 03/15/2022 - 1:46 PM
  */

case class EmailConfiguration(
    @NotEmpty receivers: Seq[String],
    cc: Seq[String] = Seq.empty,
    bcc: Seq[String] = Seq.empty,
    subject: String,
    fileName: String,
    content: Option[String] = None,
    displayName: Option[String] = None
) extends ActionConfiguration {

  /**
    * Valid a action is correct
    */
  override def validate(): Unit = {
    val invalidReceivers: Seq[String] = receivers.filterNot(email => StringUtils.isEmailFormat(email))
    val invalidCc: Seq[String] = cc.filterNot(email => StringUtils.isEmailFormat(email))
    val invalidBcc: Seq[String] = bcc.filterNot(email => StringUtils.isEmailFormat(email))
    if (invalidReceivers.nonEmpty || invalidCc.nonEmpty || invalidBcc.nonEmpty) {
      val invalidMails: Seq[String] = invalidReceivers ++ invalidCc ++ invalidBcc
      throw BadRequestError(s"invalid email address format: ${invalidMails}")
    }
  }

  override def toOperator(id: OperatorId): Operator = {
    SendEmailOperator(id, receivers, cc, bcc, subject, fileName, content, displayName)
  }
}
