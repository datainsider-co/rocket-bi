package datainsider.data_cook.domain.operator

import com.clearspring.analytics.hash.MurmurHash
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.domain.query.EqualField
import datainsider.client.util.JsonParser
import datainsider.data_cook.domain.Ids.OperatorId
import datainsider.data_cook.domain.InvalidOperatorError
import datainsider.data_cook.domain.operator.EtlOperator.{isEtlDatabase, validateDatabaseName}
import datainsider.data_cook.domain.operator.JoinType.JoinType
import datainsider.data_cook.domain.persist.{ActionConfiguration, DwhPersistConfiguration, EmailConfiguration, ThirdPartyPersistConfiguration}

/**
  * @param leftOperator operator bên phải
  * @param rightOperator operator bên trái
  * @param conditions danh sách condtions dùng cho lệnh join.
  * @param joinType   loại join
  */
case class JoinConfig(
    leftOperator: EtlOperator,
    rightOperator: EtlOperator,
    conditions: Array[EqualField],
    @JsonScalaEnumeration(classOf[JoinTypeRef]) joinType: JoinType,
)

/**
  * Cho phép join 2 hay nhiều bảng lại với nhau bằng các phép condition
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 2:22 PM
  */
case class JoinOperator(
    joinConfigs: Array[JoinConfig],
    destTableConfiguration: TableConfiguration,
    isPersistent: Boolean = false,
    persistConfiguration: Option[DwhPersistConfiguration] = None,
    thirdPartyPersistConfigurations: Array[ThirdPartyPersistConfiguration] = Array.empty,
    emailConfiguration: Option[EmailConfiguration] = None
) extends EtlOperator {
  @JsonIgnore
  override def id: OperatorId = {
    val ids: Array[String] = joinConfigs.flatMap(join => Seq(join.leftOperator.id, join.rightOperator.id))
    val keys: Array[String] = ids ++ Seq(destTableConfiguration.tblName)
    makeId(keys: _*)
  }

  /**
   * Valid a operator correct
   */
  override def validate(): Unit = {
    joinConfigs.foreach(config => {
      config.leftOperator.validate()
      config.rightOperator.validate()
      validate(config.conditions)
    })
  }

  private def validate(conditions: Array[EqualField]): Unit = {
    val json = JsonParser.toJson(conditions)
    val result = validateDatabaseName(json)
    if (result.isInvalid()) {
      throw InvalidOperatorError(s"database: ${result.databaseName} incorrect in operator name: ${destTableConfiguration.tblName}", this)
    }
    getActionConfigurations().foreach(_.validate())
  }

  /**
   * get all action of operator
   */
  override def getActionConfigurations(): Array[ActionConfiguration] = {
    val actions = persistConfiguration ++ thirdPartyPersistConfigurations ++ emailConfiguration
    actions.toArray
  }
}

class JoinTypeRef extends TypeReference[JoinType.type]

object JoinType extends Enumeration {
  type JoinType = Value
  val Left: JoinType = Value("left")
  val Right: JoinType = Value("right")
  val Inner: JoinType = Value("inner")
  val FullOuter: JoinType = Value("full_outer")
}
