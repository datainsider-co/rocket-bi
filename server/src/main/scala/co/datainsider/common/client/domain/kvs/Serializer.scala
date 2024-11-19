package co.datainsider.common.client.domain.kvs

import co.datainsider.common.client.util.JsonParser

trait Serializer[T] {
  def serialize(value: T): String

  def deserialize(value: String): T
}

object Serializer {
  implicit object StringSerializer extends Serializer[String] {
    override def serialize(value: String): String = value

    override def deserialize(value: String): String = value
  }

  implicit object IntSerializer extends Serializer[Int] {
    override def serialize(value: Int): String = value.toString

    override def deserialize(value: String): Int = value.toInt
  }

  implicit object LongSerializer extends Serializer[Long] {
    override def serialize(value: Long): String = value.toString

    override def deserialize(value: String): Long = value.toLong
  }

  implicit object BooleanSerializer extends Serializer[Boolean] {
    override def serialize(value: Boolean): String = value.toString

    override def deserialize(value: String): Boolean = value.toBoolean
  }

  implicit object FloatSerializer extends Serializer[Float] {
    override def serialize(value: Float): String = value.toString

    override def deserialize(value: String): Float = value.toFloat
  }

  class JsonSerializer[T: Manifest] extends Serializer[T] {
    override def serialize(value: T): String = JsonParser.toJson(value, isPretty = false)

    override def deserialize(value: String): T = JsonParser.fromJson[T](value)
  }
}
