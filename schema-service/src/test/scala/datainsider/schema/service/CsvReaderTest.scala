package datainsider.schema.service

import com.twitter.util.Await
import datainsider.schema.domain.column._
import datainsider.schema.domain.{CsvSetting, TableSchema}
import datainsider.schema.misc.JdbcClient.Record
import org.scalatest.FunSuite

class CsvReaderTest extends FunSuite {

  test("test detect schema from csv string") {
    val csvString =
      """
        |id,name,height,age,dob,is_dead
        |1,nguyen thi no,1.49,1499959917383,2014/01/01 23:00:01,false
        |2,nguyen chi pheo,1.65,1198138008843,2014/11/31 12:40:32,true
        |""".stripMargin

    val tableSchema: TableSchema = Await.result(CsvReader.detectSchema(csvString, CsvSetting(includeHeader = true)))
    println(tableSchema)
  }

  test("test parse csv") {
    val csvString: String =
      """1,nguyen thi no,1.49,1499959917383,2014/01/01 23:00:01,false
        |2,nguyen chi pheo,1.65,1198138008843,2014/11/31 12:40:32,true
        |""".stripMargin

    val columns = Seq(
      Int32Column("id", "id"),
      StringColumn("name", "name"),
      DoubleColumn("height", "height"),
      UInt64Column("age", "age"),
      DateTimeColumn("dob", "dob"),
      BoolColumn("is_dead", "is_dead")
    )
    val tableSchema: TableSchema = TableSchema("", "", 1, "", columns)
    val records: Seq[Record] = Await.result(
      CsvReader.parse(
        csvString,
        tableSchema.columns,
        CsvSetting(delimiter = ",", includeHeader = true)
      )
    )
    records.foreach(r => println(r.mkString(", ")))
  }
}
