package datainsider.jobworker.util

import datainsider.jobworker.domain.CompressType
import org.apache.commons.compress.archivers.sevenz.{SevenZArchiveEntry, SevenZFile}
import org.apache.commons.compress.compressors.xz.XZCompressorInputStream
import org.apache.commons.io.FilenameUtils

import java.io.{BufferedInputStream, File, FileInputStream, FileOutputStream}
import java.util.zip.{GZIPInputStream, ZipInputStream}

/***
  * Uncompress file by file extension
  * Example:
  *  1/ data.csv.gz -> data.csv
  *  2/ folderX.zip -> folderX
  *  3/ fileX.zip -> fileX
  */
object FileDecompressUtils {

  @throws[UnsupportedOperationException]
  def decompressFile(filePath: String): String = {
    try {
      val fileExtension: String = FilenameUtils.getExtension(filePath)
      CompressType.withName(fileExtension) match {
        case CompressType.GZ     => decompressGzFile(filePath)
        case CompressType.XZ     => decompressXZFile(filePath)
        case CompressType.Zip    => decompressZipFile(filePath)
        case CompressType.None   => filePath
        case _                   => throw new UnsupportedOperationException(s"not support this compressed type $fileExtension")
      }
    } catch {
      case ex: Throwable => throw new UnsupportedOperationException(s"got error when decompress file $filePath, $ex")
    }
  }

  private def decompressGzFile(filePath: String): String = {
    val outputPath: String = filePath.substring(0, filePath.lastIndexOf(".gz"))

    Using(new GZIPInputStream(new FileInputStream(filePath))){ gzipInputStream =>
      Using(new FileOutputStream(outputPath)) { fileOutputStream =>
        val buffer = new Array[Byte](1024)
        var readLen: Int = gzipInputStream.read(buffer)
        while (readLen > 0) {
          fileOutputStream.write(buffer, 0, readLen)
          readLen = gzipInputStream.read(buffer)
        }
      }
    }

    outputPath
  }

  private def decompressXZFile(filePath: String): String = {
    val outputPath: String = filePath.substring(0, filePath.lastIndexOf(".xz"))
    Using(new FileInputStream(filePath)) { fileInputStream =>
      Using(new BufferedInputStream(fileInputStream)) { bufferedInputStream =>
        Using(new XZCompressorInputStream(bufferedInputStream)) { xzCompressorInputStream =>
          Using(new FileOutputStream(outputPath)) { fileOutputStream =>
            val buffer = new Array[Byte](1024)
            var readLen: Int = xzCompressorInputStream.read(buffer)
            while (readLen > 0) {
              fileOutputStream.write(buffer, 0, readLen)
              readLen = xzCompressorInputStream.read(buffer)
            }
          }
        }
      }
    }

    outputPath
  }

  private def decompressZipFile(filePath: String): String = {
    val outputPath: String = filePath.substring(0, filePath.lastIndexOf(".zip"))
    new File(outputPath).mkdir()
    Using(new FileInputStream(filePath)) { fileInputStream =>
      Using(new ZipInputStream(fileInputStream)) { zipInputStream =>
        Stream.continually(zipInputStream.getNextEntry).takeWhile(_ != null).foreach { file =>
          val fileOutputStream = new FileOutputStream(outputPath + "/" + file.getName)
          val buffer = new Array[Byte](1024)
          Stream.continually(zipInputStream.read(buffer)).takeWhile(_ != -1).foreach(fileOutputStream.write(buffer, 0, _))
        }
      }
    }
    outputPath
  }
}
