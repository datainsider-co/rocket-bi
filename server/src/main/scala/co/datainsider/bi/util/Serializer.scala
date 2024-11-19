package co.datainsider.bi.util

import com.fasterxml.jackson.annotation.JsonInclude.Include
import com.fasterxml.jackson.databind.{DeserializationFeature, PropertyNamingStrategy}
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.twitter.finatra.jackson.ScalaObjectMapper

/** *
  * View more at: https://www.baeldung.com/jackson-inheritance
  */
object Serializer {

  val mapper: ScalaObjectMapper = ScalaObjectMapper.builder
    .withSerializationInclude(Include.NON_NULL)
    .withPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
    .objectMapper
  mapper.registerModule(DefaultScalaModule)

  def toJson(value: Any): String = mapper.writeValueAsString(value)

  def fromJson[T](str: String)(implicit ev: Manifest[T]): T = mapper.parse[T](str)

}
