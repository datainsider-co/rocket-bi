package co.datainsider.jobscheduler.util

import com.fasterxml.jackson.annotation.JsonInclude.Include
import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind._
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.fasterxml.jackson.module.scala.experimental.ScalaObjectMapper
import datainsider.client.exception.InternalError

import java.lang.reflect.{ParameterizedType, Type}

/**
  * Created by anhlt
  **/
object JsonUtils {

  val mapper = new ObjectMapper() with ScalaObjectMapper
  mapper.registerModule(DefaultScalaModule)
  mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
  mapper.setSerializationInclusion(Include.NON_NULL)
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

  private[this] def typeReference[T: Manifest] =
    new TypeReference[T] {
      override def getType: Type = typeFromManifest(manifest[T])
    }

  private[this] def typeFromManifest(m: Manifest[_]): Type = {
    if (m.typeArguments.isEmpty) {
      m.runtimeClass
    } else
      new ParameterizedType {
        def getRawType = m.runtimeClass

        def getActualTypeArguments =
          m.typeArguments.map(typeFromManifest).toArray

        def getOwnerType = null
      }
  }

  implicit class ImplicitJsonNode(val jsonNode: JsonNode) extends AnyVal {

    /**
     * get value as type T from json node. Use like this:
     * jsonNode.asOpt[MyClass]("/path/to/field")
     * @param jsonPtrExpr json pointer expression
     * @tparam T type of return value
     * @return value as type T, if not found, return None
     */
    def asOpt[T: Manifest](jsonPtrExpr: String): Option[T] = {
      val valNode: JsonNode = jsonNode.at(jsonPtrExpr)
      if (valNode.isNullOrMissing) {
        return None
      } else {
        Option(JsonUtils.fromJson[T](valNode.textValue()))
      }
    }

    /**
     * get value as type T from json node. Use like this:
     * jsonNode.asOpt[MyClass]("/path/to/field")
     *
     * @param jsonPtrExpr json pointer expression
     * @tparam T type of return value
     * @return value as type T, if not found, return None
     * @throws InternalError if value not found
     */
    def as[T: Manifest](jsonPtrExpr: String): T = {
      val valNode: JsonNode = jsonNode.at(jsonPtrExpr)
      if (valNode.isNullOrMissing) {
        throw InternalError(s"Cannot find value at $jsonPtrExpr")
      } else {
        JsonUtils.fromJson[T](valNode.textValue())
      }
    }

    def atOpt(jsonPtrExpr: String): Option[JsonNode] = {
      jsonNode.at(jsonPtrExpr) match {
        case x if x.isMissingNode || x.size() == 0 => None
        case x                                     => Option(x)
      }
    }

    def opt(fieldName: String): Option[JsonNode] = {
      Option(jsonNode.path(fieldName)) match {
        case Some(x) if x.isNullOrEmpty => None
        case Some(x)                    => Some(x)
        case _                          => None
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

    def getString(field: String) = jsonNode.path(field).asText()

    def optString(field: String) = opt(field).map(_.asText())

    def getInt(field: String) = jsonNode.path(field).asInt()

    def optInt(field: String) = opt(field).map(_.asInt())

    def getLong(field: String) = jsonNode.path(field).asLong()

    def getBoolean(field: String) = jsonNode.path(field).asBoolean()

    def optBoolean(field: String) = opt(field).map(_.asBoolean())

    def isEmptyObject: Boolean = jsonNode.isObject && jsonNode.size() == 0

    def isEmptyText: Boolean = jsonNode.isTextual && jsonNode.asText().isEmpty

    def isEmptyTextOrObject: Boolean = isEmptyText || isEmptyObject

    def isEmptyContainer: Boolean =
      jsonNode.isContainerNode && jsonNode.size() == 0

    def isEmptyNode: Boolean = isEmptyText || isEmptyContainer

  }

}

class StringToJsonSerializer extends JsonSerializer[scala.Option[String]] {

  override def isEmpty(provider: SerializerProvider, value: Option[String]) = {
    value == null || value.isEmpty
  }

  override def serialize(
      value: Option[String],
      gen: JsonGenerator,
      serializers: SerializerProvider
  ) = {
    value match {
      case Some(x) if isValidJSON(x) => gen.writeRawValue(x)
      case Some(x)                   => gen.writeString(x)
      case _                         => gen.writeNull()
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
