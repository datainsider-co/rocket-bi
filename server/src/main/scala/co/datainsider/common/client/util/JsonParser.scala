package co.datainsider.common.client.util

import com.fasterxml.jackson.annotation.JsonInclude.Include
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.{DeserializationFeature, JsonNode, ObjectMapper, PropertyNamingStrategy}
import com.fasterxml.jackson.module.scala.{DefaultScalaModule, ScalaObjectMapper}

import java.lang.reflect.{ParameterizedType, Type}

/**
  * Created by phuonglam on 10/3/16.
 **/
object JsonParser {
  val mapper = new ObjectMapper() with ScalaObjectMapper
  mapper.registerModule(DefaultScalaModule)
  mapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE)
  mapper.setSerializationInclusion(Include.NON_NULL)
  mapper.configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false)
  mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

  def fromJson[T: Manifest](json: String): T = {
    mapper.readValue[T](json, typeReference[T])
  }

  def toJson[T](t: T, isPretty: Boolean = true): String = {
    if (isPretty)
      mapper.writerWithDefaultPrettyPrinter().writeValueAsString(t)
    else mapper.writeValueAsString(t)
  }

  def readTree(json: String): JsonNode = mapper.readTree(json)

  def toNode[T <: JsonNode](t: Any): T = {
    mapper.valueToTree[T](t)
  }

  def fromNode[T: Manifest](t: JsonNode): T = {
    mapper.treeToValue[T](t)
  }

  private[this] def typeReference[T: Manifest] = {
    new TypeReference[T] {
      override def getType: Type = typeFromManifest(manifest[T])
    }
  }

  private[this] def typeFromManifest(m: Manifest[_]): Type = {
    if (m.typeArguments.isEmpty) {
      m.runtimeClass
    } else {
      new ParameterizedType {
        def getRawType = m.runtimeClass

        def getActualTypeArguments =
          m.typeArguments.map(typeFromManifest).toArray

        def getOwnerType = null
      }
    }
  }

  implicit class JsonLike(val any: AnyRef) extends AnyVal {
    def asJsonNode = JsonParser.toNode(any)

    def asJsonString = JsonParser.toJson(any)
  }
}
