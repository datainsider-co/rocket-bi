package datainsider.jobworker.repository.reader.s3

import java.io.File
import scala.collection.mutable

class MockCloudStorageReader() extends CloudStorageReader {
  private val fileQueue = new mutable.Queue[File]()

  def putFile(file: File): Unit = fileQueue.enqueue(file)

  override def hasNext(): Boolean = fileQueue.nonEmpty

  override def next(): File = fileQueue.dequeue()

  override def close(): Unit = Unit
}
