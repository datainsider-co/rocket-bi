package datainsider.common.profiler

import scala.collection.mutable

class FixedQueue[T](maxSize: Int) extends mutable.Queue[T] {
  override def +=(elem: T): this.type = {
    if (length >= maxSize) dequeue()
    appendElem(elem)
    this
  }
}
