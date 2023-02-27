//package datainsider.jobworker.repository.readers
//
//import datainsider.client.domain.schema.column._
//import datainsider.jobworker.client.JdbcClient.Record
//import datainsider.jobworker.domain.FileConfig
//import org.scalatest.FunSuite
//
//class FileReaderTest extends FunSuite {
//  test("test file reader") {
//    val filePath: String = "./data/products.csv"
//    val fileConfig: FileConfig = new CSVConfig()
//    val fileReader = FileReaderFactory(filePath, fileConfig)
//    assert(fileReader.hasNext)
//
//    val columns: Seq[Column] = Seq(
//      Int32Column(name = "id", displayName = "id", isNullable = true),
//      StringColumn(name = "name", displayName = "name", isNullable = true),
//      Int32Column(name = "number", displayName = "number", isNullable = true),
//      StringColumn(name = "type", displayName = "type", isNullable = true),
//      DateTimeColumn(
//        name = "datetime",
//        displayName = "datetime",
//        isNullable = true,
//        inputFormats = Seq("yyyy-mm-dd HH:mm:ss")
//      ),
//      StringColumn(name = "country", displayName = "country", isNullable = true),
//      BoolColumn(name = "is_expired", displayName = "is_expired", isNullable = true)
//    )
//    val records: Seq[Record] = fileReader.next(columns, 20)
//    val actualData: String = records.map(_.mkString(",")).mkString("\n")
//    val expectedData: String =
//      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-01-16 00:00:00.0,Viet Nam,true
//        |2,Iphone,999,Apple,1999-01-10 00:00:00.0,Viet Nam,true
//        |3,MacBook13,1999,Apple,2020-01-16 00:00:00.0,US,false
//        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-01-10 00:00:00.0,Viet Nam,true
//        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-01-10 00:00:00.0,Viet Nam,true
//        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-01-10 00:00:00.0,Viet Nam,false
//        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-01-10 00:00:00.0,Viet Nam,false
//        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-01-10 00:00:00.0,Viet Nam,false
//        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00.0,US,true
//        |10,Iphone,1050,China,2010-01-01 00:00:00.0,China,true
//        |11,Iphone,90,China,2020-01-02 00:00:00.0,China,true""".stripMargin
//
//    assert(expectedData.equals(actualData))
//  }
//
//  test("test file reader with more column then record size") {
//    val filePath: String = "./data/products.csv"
//    val fileConfig: FileConfig = CSVConfig()
//    val fileReader = FileReaderFactory(filePath, fileConfig)
//    assert(fileReader.hasNext)
//
//    val columns: Seq[Column] = Seq(
//      Int32Column(name = "id", displayName = "id", isNullable = true),
//      StringColumn(name = "name", displayName = "name", isNullable = true),
//      Int32Column(name = "number", displayName = "number", isNullable = true),
//      StringColumn(name = "type", displayName = "type", isNullable = true),
//      DateTimeColumn(
//        name = "datetime",
//        displayName = "datetime",
//        isNullable = true,
//        inputFormats = Seq("yyyy-mm-dd HH:mm:ss")
//      ),
//      StringColumn(name = "country", displayName = "country", isNullable = true),
//      BoolColumn(name = "is_expired", displayName = "is_expired", isNullable = true),
//      StringColumn(name = "column_y", displayName = "column_y", isNullable = true),
//      StringColumn(name = "column_z", displayName = "column_z", isNullable = true)
//    )
//    val records: Seq[Record] = fileReader.next(columns, 20)
//    val actualData: String = records.map(_.mkString(",")).mkString("\n")
//    val expectedData: String =
//      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-01-16 00:00:00.0,Viet Nam,true,null,null
//        |2,Iphone,999,Apple,1999-01-10 00:00:00.0,Viet Nam,true,null,null
//        |3,MacBook13,1999,Apple,2020-01-16 00:00:00.0,US,false,null,null
//        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-01-10 00:00:00.0,Viet Nam,true,null,null
//        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-01-10 00:00:00.0,Viet Nam,true,null,null
//        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-01-10 00:00:00.0,Viet Nam,false,null,null
//        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-01-10 00:00:00.0,Viet Nam,false,null,null
//        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-01-10 00:00:00.0,Viet Nam,false,null,null
//        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00.0,US,true,null,null
//        |10,Iphone,1050,China,2010-01-01 00:00:00.0,China,true,null,null
//        |11,Iphone,90,China,2020-01-02 00:00:00.0,China,true,null,null""".stripMargin
//
//    assert(expectedData.equals(actualData))
//  }
//
//  test("test file reader with less column then record size") {
//    val filePath: String = "./data/products.csv"
//    val fileConfig: FileConfig = CSVConfig()
//    val fileReader = FileReaderFactory(filePath, fileConfig)
//    assert(fileReader.hasNext)
//
//    val columns: Seq[Column] = Seq(
//      Int32Column(name = "id", displayName = "id", isNullable = true),
//      StringColumn(name = "name", displayName = "name", isNullable = true),
//      Int32Column(name = "number", displayName = "number", isNullable = true),
//      StringColumn(name = "type", displayName = "type", isNullable = true),
//      DateTimeColumn(
//        name = "datetime",
//        displayName = "datetime",
//        isNullable = true,
//        inputFormats = Seq("yyyy-mm-dd HH:mm:ss")
//      )
//    )
//    val records: Seq[Record] = fileReader.next(columns, 20)
//    val actualData: String = records.map(_.mkString(",")).mkString("\n")
//    val expectedData: String =
//      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-01-16 00:00:00.0
//        |2,Iphone,999,Apple,1999-01-10 00:00:00.0
//        |3,MacBook13,1999,Apple,2020-01-16 00:00:00.0
//        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-01-10 00:00:00.0
//        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-01-10 00:00:00.0
//        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-01-10 00:00:00.0
//        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-01-10 00:00:00.0
//        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-01-10 00:00:00.0
//        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00.0
//        |10,Iphone,1050,China,2010-01-01 00:00:00.0
//        |11,Iphone,90,China,2020-01-02 00:00:00.0""".stripMargin
//
//    assert(expectedData.equals(actualData))
//  }
//}
