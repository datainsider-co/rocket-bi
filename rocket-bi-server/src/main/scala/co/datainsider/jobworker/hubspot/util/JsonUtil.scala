package co.datainsider.jobworker.hubspot.util

import java.io.File
import java.lang.reflect.{ParameterizedType, Type}
import java.nio.charset.StandardCharsets
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.core.JsonParser.Feature
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind._
import com.fasterxml.jackson.databind.node.{ArrayNode, ObjectNode}
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.fasterxml.jackson.module.scala.experimental.ScalaObjectMapper
import com.google.common.io.Files
import co.datainsider.schema.domain.column.{Column, DateTimeColumn, DoubleColumn, Int64Column, StringColumn}
import co.datainsider.jobworker.util.StringUtils.RichOptionConvert

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.time.{Instant, OffsetDateTime, ZoneOffset}
import scala.collection.JavaConversions._

/**
 * Created by phuonglam on 10/3/16.
 **/
object JsonUtil extends Jsoning

trait Jsoning {

  val mapper = new ObjectMapper() with ScalaObjectMapper
  mapper.registerModule(DefaultScalaModule)
  mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
  mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
  mapper.configure(Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true)
  mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
  mapper.setSerializationInclusion(JsonInclude.Include.NON_ABSENT)

  def fromJson[T: Manifest](json: String): T = mapper.readValue[T](json, typeReference[T])

  def fromJson[T: Manifest](file: File): T = mapper.readValue[T](file, typeReference[T])

  def fromJson[T: Manifest](json: JsonNode, strategy: PropertyNamingStrategy): T = {
    val m = new ObjectMapper() with ScalaObjectMapper
    m.registerModule(DefaultScalaModule)
    m.setPropertyNamingStrategy(strategy)
    m.setSerializationInclusion(JsonInclude.Include.NON_NULL)
    m.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    m.treeToValue[T](json)
  }

  def readTree(json: String): JsonNode = mapper.readTree(json)

  def readFile(file: File): JsonNode = mapper.readTree(file)

  def toJson[T](t: T): String = {
    mapper.writeValueAsString(t)
  }

  def toPrettyJson[T](t: T): String = {
    mapper.writerWithDefaultPrettyPrinter().writeValueAsString(t)
  }

  def createObjectNode: ObjectNode = mapper.createObjectNode

  def createArrayNode: ArrayNode = mapper.createArrayNode

  private[this] def typeReference[T: Manifest] = new TypeReference[T] {
    override def getType: Type = typeFromManifest(manifest[T])
  }

  private[this] def typeFromManifest(m: Manifest[_]): Type = {
    if (m.typeArguments.isEmpty) {
      m.runtimeClass
    }
    else new ParameterizedType {
      def getRawType: Class[_] = m.runtimeClass

      def getActualTypeArguments: Array[Type] = m.typeArguments.map(typeFromManifest).toArray

      def getOwnerType: Null = null

    }
  }

  implicit class JsonObject(map: Any) {
    def toPrettyJsonString: String = JsonUtil.toPrettyJson(map)

    def toJsonObject[A: Manifest]: A = map.toJsonString.asJsonObject[A]

    def toJsonString: String = JsonUtil.toJson(map)
  }

  implicit class ObjectLike(str: String) {
    def asJsonObject[A: Manifest]: A = JsonUtil.fromJson[A](str)

    def asJsonNode: JsonNode = JsonUtil.readTree(str)

    def asScalaMap: Map[String, Any] = JsonUtil.fromJson[Map[String, Any]](str)

    def asJavaMap: MyMap = {
      val mapper = new ObjectMapper()
      mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
      mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
      mapper.configure(Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true)
      mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
      mapper.setSerializationInclusion(JsonInclude.Include.NON_ABSENT)
      mapper.readValue(str, classOf[MyMap])
    }
  }

  implicit class JsonNodeLike(node: JsonNode) {
    def asArrayOfString: Array[String] = if (node.isMissingNode) Array[String]() else node.asArrayOfNode.map(_.asText(""))

    def asArrayOfNode: Array[JsonNode] = node.asInstanceOf[ArrayNode].elements().toArray

    def asMap: Map[String, Any] = node.toJsonString.asJsonObject[Map[String, Any]]

    def toJsonString: String = JsonUtil.toJson(node)

    def writeToFile(file: File): Unit = {
      Files.asCharSink(file, StandardCharsets.UTF_8).write(node.toPrettyJsonString)
    }

    def getValue(column: Column): Any = {
      column match {
        case _: Int64Column    => node.longValue()
        case _: DoubleColumn   => node.doubleValue()
        case _: DateTimeColumn => toDateTime(node)
        case _: StringColumn   => toString(node)
      }
    }

    private def toDateTime(node: JsonNode): Timestamp = {
      if (node.isLong) {
        return new Timestamp(node.longValue())
      } else if (node.isTextual) {
        val offsetDateTime: OffsetDateTime = Instant.parse(node.textValue()).atOffset(ZoneOffset.UTC)
        Timestamp.valueOf(offsetDateTime.toLocalDateTime)
      } else {
        return null
      }
    }

    private def toString(node: JsonNode): String = {
      if (node.isValueNode) {
        node.textValue()
      } else {
        node.toString
      }
    }
  }

}

class MyMap extends java.util.HashMap[String, Any] {
  def length: Int = this.size()
}
