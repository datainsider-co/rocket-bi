package datainsider.schema.util

import com.twitter.scrooge.{Response, ThriftStruct}

/**
  * @author anhlt
  */
object ThriftImplicits {

  implicit class ScroogeResponseStringLike(val struct: String) extends AnyVal {
    def toScroogeResponse: Response[String] = Response(struct)
  }

  implicit class ScroogeResponseLike[T <: ThriftStruct](val struct: T) extends AnyVal {
    def toScroogeResponse: Response[T] = Response(struct)
  }

}
