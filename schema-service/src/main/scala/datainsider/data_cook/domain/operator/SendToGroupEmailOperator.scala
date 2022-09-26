package datainsider.data_cook.domain.operator

import com.fasterxml.jackson.annotation.JsonIgnore
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.exception.BadRequestError
import datainsider.data_cook.domain.Ids.OperatorId
import datainsider.data_cook.domain.persist.ActionConfiguration
import datainsider.data_cook.util.StringUtils

/**
  * Operator tạo ra 1 table từ câu query trên kết quả của operator trước đó.. Kết quả trả ra là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 3:00 PM
  * @param operator là operator dùng để tạo ra table
  * @param query get data từ operator
  */
case class SendToGroupEmailOperator(
    operators: Seq[EtlOperator],
    destTableConfiguration: TableConfiguration,
    @NotEmpty receivers: Seq[String],
    cc: Seq[String] = Seq.empty,
    bcc: Seq[String] = Seq.empty,
    subject: String,
    fileNames: Seq[String],
    content: Option[String] = None,
    displayName: Option[String] = None,
    isZip: Boolean = false
) extends EtlOperator {
  @JsonIgnore
  override def id: OperatorId = {
    val keys: Seq[String] = operators.map(_.id)
    makeId(keys: _*)
  }

  /**
   * Valid a operator correct, if incorrect, throw [InvalidOperatorError]
   */
  @throws[BadRequestError]
  override def validate(): Unit = {
    operators.foreach(_.validate())
    val emails: Seq[String] = receivers ++ cc ++ bcc
    val invalidEmails: Seq[String] = emails.filterNot(email => StringUtils.isEmailFormat(email))
    if (invalidEmails.nonEmpty) {
      throw BadRequestError(s"invalid email address format: ${invalidEmails}")
    }
  }

  /**
   * get all action of operator
   */
  override def getActionConfigurations(): Array[ActionConfiguration] = Array.empty[ActionConfiguration]
}
