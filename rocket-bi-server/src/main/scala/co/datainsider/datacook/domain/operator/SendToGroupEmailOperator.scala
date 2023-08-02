package co.datainsider.datacook.domain.operator

import co.datainsider.datacook.domain.Ids.OperatorId
import co.datainsider.datacook.domain.persist.ActionConfiguration
import co.datainsider.datacook.pipeline.operator.Operator
import co.datainsider.datacook.util.StringUtils
import com.fasterxml.jackson.annotation.JsonIgnore
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.exception.BadRequestError

/**
  * Operator tạo ra 1 table từ câu query trên kết quả của operator trước đó.. Kết quả trả ra là TableResponse
  *
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 3:00 PM
  * @param operator là operator dùng để tạo ra table
  * @param query get data từ operator
  */
@deprecated("use SendGroupEmailOperator instead")
case class SendToGroupEmailOperator(
    operators: Seq[OldOperator],
    destTableConfiguration: DestTableConfig,
    @NotEmpty receivers: Seq[String],
    cc: Seq[String] = Seq.empty,
    bcc: Seq[String] = Seq.empty,
    subject: String,
    fileNames: Seq[String],
    content: Option[String] = None,
    displayName: Option[String] = None,
    isZip: Boolean = false
) extends OldOperator {
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

  override def getDestTableNames(): Set[String] = {
    operators.flatMap(_.getDestTableNames()).toSet
  }

  override def getNestedOperators(): Array[OldOperator] = {
    operators.flatMap(_.getNestedOperators()).toArray ++ Array(this)
  }

  override def toOperator(getOperatorId: OperatorId => Operator.OperatorId): Operator = {
    val operatorId: Operator.OperatorId = getOperatorId(id)
    import co.datainsider.datacook.pipeline.{operator => pipeline}
    pipeline.SendGroupEmailOperator(
      id = operatorId,
      receivers = receivers,
      cc = cc,
      bcc = bcc,
      subject = subject,
      fileNames = fileNames,
      content = content,
      displayName = displayName,
      isZip = isZip
    )
  }

  override def getParentOperators(): Array[OldOperator] = operators.toArray
}
