package co.datainsider.jobworker.repository.writer

import com.twitter.inject.Logging

import java.io.{BufferedWriter, File, FileWriter}
import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Paths, StandardOpenOption}

/**
  * Simple wrapper to handle write string to a file
  * NOTE: remember to close buffer every time this class is used, buffer not close automatically
  *
  * @param file file to written to
  */
class FileHandler(file: File) extends Logging {

  private var fileSize: Long = file.length()

  private lazy val bufferedWriter: BufferedWriter = synchronized {
    if (!file.exists()) {
      file.createNewFile()
    }

    val isAppend = true
    val writer = new FileWriter(file, isAppend)
    new BufferedWriter(writer)
  }

  def getFileSize: Long =
    synchronized {
      fileSize
    }

  def getFilePath: String = file.getAbsolutePath

  def writeLine(content: String): Unit =
    synchronized {
      val data = content + "\n"
      bufferedWriter.write(data)
      fileSize += data.getBytes("UTF-8").length
    }

  def closeBuffer(): Unit =
    synchronized {
      bufferedWriter.close()
      info(s"finish write file $getFilePath with size $getFileSize bytes")
    }
}
