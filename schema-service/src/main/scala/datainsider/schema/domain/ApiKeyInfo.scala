package datainsider.schema.domain

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import education.x.commons.Serializer
import org.apache.commons.lang3.SerializationUtils

class ApiKeyTypeRef extends TypeReference[ApiKeyTypes.type]
object ApiKeyTypes extends Enumeration {
  type ApiKeyType = Value
  val Analytics: ApiKeyType = Value("analytics")
  val Tracking: ApiKeyType = Value("tracking")
}

@SerialVersionUID(20201020L)
case class RateLimitingInfo(
    hourlyRates: Option[Int] = None,
    dailyRates: Option[Int] = None,
    monthlyRates: Option[Int] = None
)

@SerialVersionUID(20211009L)
case class ApiKeyInfo(
    @JsonScalaEnumeration(classOf[ApiKeyTypeRef])
    keyType: ApiKeyTypes.ApiKeyType,
    apiKey: String,
    organizationId: Long,
    rateLimitingInfo: RateLimitingInfo,
    name: Option[String],
    description: Option[String],
    updatedTime: Option[Long],
    createdTime: Option[Long]
)

object ApiKeyInfo {

  implicit object ChallengeSerializer extends Serializer[ApiKeyInfo] {
    override def fromByte(bytes: Array[Byte]): ApiKeyInfo = {
      SerializationUtils.deserialize(bytes).asInstanceOf[ApiKeyInfo]
    }

    override def toByte(value: ApiKeyInfo): Array[Byte] = {
      SerializationUtils.serialize(value.asInstanceOf[Serializable])
    }
  }

}
