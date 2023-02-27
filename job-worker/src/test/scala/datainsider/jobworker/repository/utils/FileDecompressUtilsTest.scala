package datainsider.jobworker.repository.utils

import com.opencsv.CSVReader
import datainsider.jobworker.util.FileDecompressUtils
import org.apache.commons.io.FilenameUtils
import org.scalatest.FunSuite

import java.io.{File, FileReader}
import scala.language.{existentials, postfixOps}
import scala.reflect.io.Directory
import scala.sys.process._

class FileDecompressUtilsTest extends FunSuite {

  test("test decompress gz file") {
    val expectedData: String =
      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-5-16 00:00:00,Viet Nam,true
        |2,Iphone,999,Apple,1999-6-10 00:00:00,Viet Nam,true
        |3,MacBook13,1999,Apple,2020-5-16 00:00:00,US,false
        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-6-10 00:00:00,Viet Nam,true
        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam,true
        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam,false
        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam,false
        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam,false
        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00,US,true
        |10,Iphone,1050,China,2010-01-01 00:00:00,China,true
        |11,Iphone,90,China,2020-02-02 00:00:00,China,true
        |""".stripMargin
    val dataPath = "./data/products.csv"
    s"gzip $dataPath" !

    val extractedFilePath = FileDecompressUtils.decompressFile(dataPath + ".gz")
    new File(extractedFilePath + ".gz").delete()
    val reader = new CSVReader(new FileReader(extractedFilePath))

    var data = ""
    reader.readAll().forEach(line => data = data + line.mkString(",") + "\n")
    assert(data.equals(expectedData))
  }

  test("test decompress xz file") {
    val expectedData: String =
      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-5-16 00:00:00,Viet Nam,true
        |2,Iphone,999,Apple,1999-6-10 00:00:00,Viet Nam,true
        |3,MacBook13,1999,Apple,2020-5-16 00:00:00,US,false
        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-6-10 00:00:00,Viet Nam,true
        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam,true
        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam,false
        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam,false
        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam,false
        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00,US,true
        |10,Iphone,1050,China,2010-01-01 00:00:00,China,true
        |11,Iphone,90,China,2020-02-02 00:00:00,China,true
        |""".stripMargin
    val dataPath = "./data/products.csv"
    s"xz $dataPath" !

    val extractedFilePath = FileDecompressUtils.decompressFile(dataPath + ".xz")
    new File(extractedFilePath + ".xz").delete()
    val reader = new CSVReader(new FileReader(extractedFilePath))

    var data = ""
    reader.readAll().forEach(line => data = data + line.mkString(",") + "\n")
    assert(data.equals(expectedData))
  }

  test("test decompress zip file") {
    val expectedData: String =
      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-5-16 00:00:00,Viet Nam
        |2,Iphone,999,Apple,1999-6-10 00:00:00,Viet Nam
        |3,MacBook13,1999,Apple,2020-5-16 00:00:00,US
        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-6-10 00:00:00,Viet Nam
        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam
        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam
        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam
        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam
        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00,US
        |10,Iphone,1050,China,2010-01-01 00:00:00,China
        |11,Iphone,90,China,2020-02-02 00:00:00,China
        |""".stripMargin
    val dataPath = "./data/products_compressed.zip"
    val extractedFilePath = FileDecompressUtils.decompressFile(dataPath)
    val dataFile = new File(extractedFilePath).listFiles().head

    val reader = new CSVReader(new FileReader(dataFile))

    var data = ""
    reader.readAll().forEach(line => data = data + line.mkString(",") + "\n")
    assert(data.equals(expectedData))
    new Directory(new File(extractedFilePath)).deleteRecursively()
  }

  test("test get file extension") {
    val expectedData: String =
      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-5-16 00:00:00,Viet Nam
        |2,Iphone,999,Apple,1999-6-10 00:00:00,Viet Nam
        |3,MacBook13,1999,Apple,2020-5-16 00:00:00,US
        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-6-10 00:00:00,Viet Nam
        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam
        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam
        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-8-10 00:00:00,Viet Nam
        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-9-10 00:00:00,Viet Nam
        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00,US
        |10,Iphone,1050,China,2010-01-01 00:00:00,China
        |11,Iphone,90,China,2020-02-02 00:00:00,China
        |""".stripMargin
    val filePath = "./data/test.zip"
    val extension: String = FilenameUtils.getExtension(filePath)
    assert(extension.equals("zip"))
  }
}
