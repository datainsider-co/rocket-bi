package co.datainsider.datacook.domain.operator

import co.datainsider.bi.domain.query.EqualField
import co.datainsider.datacook.domain.Ids.OperatorId
import co.datainsider.datacook.domain.InvalidOperatorError
import co.datainsider.datacook.domain.operator.JoinType.JoinType
import co.datainsider.datacook.domain.operator.OldOperator.validateDatabaseName
import co.datainsider.datacook.domain.persist.{
  ActionConfiguration,
  DwhPersistConfiguration,
  EmailConfiguration,
  ThirdPartyPersistConfiguration
}
import co.datainsider.datacook.pipeline.operator.{JoinConfiguration, Operator}
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.util.JsonParser

/**
  * @param leftOperator operator bên phải
  * @param rightOperator operator bên trái
  * @param conditions danh sách condtions dùng cho lệnh join.
  * @param joinType   loại join
  */
case class JoinConfig(
    leftOperator: OldOperator,
    rightOperator: OldOperator,
    conditions: Array[EqualField],
    @JsonScalaEnumeration(classOf[JoinTypeRef]) joinType: JoinType
)

/**
  * Cho phép join 2 hay nhiều bảng lại với nhau bằng các phép condition
  * @author tvc12 - Thien Vi
  * @created 09/21/2021 - 2:22 PM
  */
@deprecated("Use JoinOperator instead")
case class OldJoinOperator(
    joinConfigs: Array[JoinConfig],
    destTableConfiguration: DestTableConfig,
    isPersistent: Boolean = false,
    persistConfiguration: Option[DwhPersistConfiguration] = None,
    thirdPartyPersistConfigurations: Array[ThirdPartyPersistConfiguration] = Array.empty,
    emailConfiguration: Option[EmailConfiguration] = None
) extends OldOperator {
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
      throw InvalidOperatorError(
        s"database: ${result.databaseName} incorrect in operator name: ${destTableConfiguration.tblName}",
        this
      )
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

  override def getDestTableNames(): Set[String] = {
    val nestedTableNames: Set[String] = joinConfigs
      .flatMap(config => {
        config.leftOperator.getDestTableNames() ++ config.rightOperator.getDestTableNames()
      })
      .toSet
    nestedTableNames ++ Set(destTableConfiguration.tblName)
  }

  override def getNestedOperators(): Array[OldOperator] = {
    val nestedOperators: Array[OldOperator] = joinConfigs.flatMap(config => {
      config.leftOperator.getNestedOperators() ++ config.rightOperator.getNestedOperators()
    })
    nestedOperators ++ Array(this)
  }

  override def toOperator(getOperatorId: OperatorId => Operator.OperatorId): Operator = {
    import co.datainsider.datacook.pipeline.{operator => pipeline}
    val joinConfigs: Array[JoinConfiguration] = this.joinConfigs.map(config => {
      val leftId: Operator.OperatorId = getOperatorId(config.leftOperator.id)
      val rightId: Operator.OperatorId = getOperatorId(config.rightOperator.id)
      JoinConfiguration(leftId, rightId, config.conditions, config.joinType)
    })
    val newId: Operator.OperatorId = getOperatorId(id)
    pipeline.JoinOperator(newId, joinConfigs, destTableConfiguration)
  }

  override def getParentOperators(): Array[OldOperator] = {
    joinConfigs.flatMap(config => {
      Array(config.leftOperator, config.rightOperator)
    })
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
