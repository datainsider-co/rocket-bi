package co.datainsider.common.client.domain.queue

/**
  * created 2023-12-12 4:26 PM
  *
  * @author tvc12 - Thien Vi
  */
trait BlockingQueue[T] {

  /**
    * put element to queue
    * @param value element
    */
  def put(value: T): Unit

  /**
    * take element from queue, if queue is empty, return None
    * @return element
    */
  def take(): Option[T]

  /**
    * get size of queue
    * @return size
    */
  def size(): Int

  /**
    * check queue is empty
    * @return true if queue is empty
    */
  def isEmpty(): Boolean = size() == 0

  /**
    * check queue is not empty
    * @return true if queue is not empty
    */
  def isNotEmpty(): Boolean = !isEmpty()

  /**
    * get all element from queue
    * @return array of element
    */
  def getAll(): Seq[T]
}
