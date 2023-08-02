package co.datainsider.jobworker.util

import java.lang.reflect.{ParameterizedType, Type}

import com.fasterxml.jackson.annotation.JsonInclude.Include
import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind._
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.fasterxml.jackson.module.scala.experimental.ScalaObjectMapper
/**
  * Created by anhlt
  **/
object JsonUtils {

  val mapper = new ObjectMapper() with ScalaObjectMapper
  mapper.registerModule(DefaultScalaModule)
  mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
  mapper.setSerializationInclusion(Include.NON_NULL)
  mapper.setSerializationInclusion(Include.NON_EMPTY)
  mapper.configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false)
  mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

  def fromJson[T: Manifest](json: String): T = {
    mapper.readValue[T](json, typeReference[T])
  }

  def readTree(json: String): JsonNode = mapper.readTree(json)

  def toJson[T](t: T, isPretty: Boolean = true): String = {
    if (isPretty)
      mapper.writerWithDefaultPrettyPrinter().writeValueAsString(t)
    else mapper.writeValueAsString(t)
  }

  def toNode[T <: JsonNode](t: Any): T = {
    mapper.valueToTree[T](t)
  }

  private[this] def typeReference[T: Manifest] = new TypeReference[T] {
    override def getType: Type = typeFromManifest(manifest[T])
  }

  private[this] def typeFromManifest(m: Manifest[_]): Type = {
    if (m.typeArguments.isEmpty) {
      m.runtimeClass
    }
    else new ParameterizedType {
      def getRawType = m.runtimeClass

      def getActualTypeArguments = m.typeArguments.map(typeFromManifest).toArray

      def getOwnerType = null
    }
  }

  implicit class ImplicitJsonNode(jsonNode: JsonNode) {

    def atOpt(jsonPtrExpr: String): Option[JsonNode] = {
      jsonNode.at(jsonPtrExpr) match {
        case x if x.isMissingNode || x.size() == 0 => None
        case x => Option(x)
      }
    }

    def opt(fieldName: String): Option[JsonNode] = {
      Option(jsonNode.path(fieldName)) match {
        case Some(x) if x.isNullOrEmpty => None
        case Some(x) => Some(x)
        case _ => None
      }
    }

    def isNullOrMissing: Boolean = {
      jsonNode == null || jsonNode.isNull || jsonNode.isMissingNode
    }

    def isNullOrEmpty: Boolean = {
      jsonNode == null || jsonNode.isNull || jsonNode.isMissingNode ||
        (jsonNode.isContainerNode && jsonNode.size() == 0) ||
        (jsonNode.isTextual && jsonNode.asText.isEmpty)
    }

    def getString(field: String): String = jsonNode.path(field).asText()

    def optString(field: String): Option[String] = opt(field).map(_.asText())

    def getInt(field: String): Int = jsonNode.path(field).asInt()

    def getDouble(field: String): Double = jsonNode.path(field).asDouble()

    def optDouble(field: String): Option[Double] = opt(field).map(_.asDouble())

    def optInt(field: String): Option[Int] = opt(field).map(_.asInt())

    def getLong(field: String): Long = jsonNode.path(field).asLong()

    def getFloat(field: String): Float = jsonNode.path(field).asDouble().toFloat

    def optFloat(field: String): Option[Float] = opt(field).map(_.asDouble().toFloat)

    def getBoolean(field: String): Boolean = jsonNode.path(field).asBoolean()

    def optBoolean(field: String): Option[Boolean] = opt(field).map(_.asBoolean())

    def isEmptyObject: Boolean = jsonNode.isObject && jsonNode.size() == 0

    def isEmptyText: Boolean = jsonNode.isTextual && jsonNode.asText().isEmpty

    def isEmptyTextOrObject: Boolean = isEmptyText || isEmptyObject

    def isEmptyContainer: Boolean = jsonNode.isContainerNode && jsonNode.size() == 0

    def isEmptyNode: Boolean = isEmptyText || isEmptyContainer

  }

}

class StringToJsonSerializer extends JsonSerializer[scala.Option[String]] {

  override def isEmpty(provider: SerializerProvider, value: Option[String]) = {
    value == null || value.isEmpty
  }

  override def serialize(value: Option[String], gen: JsonGenerator, serializers: SerializerProvider) = {
    value match {
      case Some(x) if isValidJSON(x) => gen.writeRawValue(x)
      case Some(x) => gen.writeString(x)
      case _ => gen.writeNull()
    }
  }

  def isValidJSON(json: String): Boolean = {
    try {
      val parser = JsonUtils.mapper.getFactory.createParser(json)
      while (parser.nextToken() != null) {}
      true
    } catch {
      case e: Exception => false
    }
  }
}
