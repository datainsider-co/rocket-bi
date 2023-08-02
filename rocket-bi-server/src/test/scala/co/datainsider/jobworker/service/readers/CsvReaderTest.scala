package co.datainsider.jobworker.service.readers

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.domain.CsvConfig
import co.datainsider.jobworker.repository.reader.CsvReader
import com.twitter.inject.Test
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, DoubleColumn, StringColumn}

class CsvReaderTest extends Test {

  test("test read csv from path") {
    val path = getClass.getClassLoader.getResource("datasets/products.csv").getFile
    val setting: CsvConfig = CsvConfig(includeHeader = true)

    val t1 = System.currentTimeMillis()
    val tableSchema = CsvReader.detectSchema(path, setting)
    assert(tableSchema.columns.nonEmpty)

    tableSchema.columns.foreach(println)
    println(s"elapse time: ${System.currentTimeMillis() - t1}")

    val csvSchema2: TableSchema = CsvReader.detectSchema(path, setting)
    println(s"elapse time2: ${System.currentTimeMillis() - t1}")

  }

  test("test parse csv without destination schema") {
    val path = getClass.getClassLoader.getResource("datasets/products.csv").getFile
    val setting: CsvConfig = CsvConfig(includeHeader = true)
    val batchSize: Int = 1000

    val csvReader = new CsvReader(path, setting, batchSize)

    val t1 = System.currentTimeMillis()

    val csvSchema: TableSchema = csvReader.detectTableSchema

    while (csvReader.hasNext()) {
      val records: Seq[Record] = csvReader.next(csvSchema)
      assert(records.size <= batchSize)

      records.foreach(r => {
        println(r.mkString(", "))
        assert(r.length == csvSchema.columns.length)
      })
    }

    println(s"elapse time: ${System.currentTimeMillis() - t1}")
  }

  test("test parse csv with destination schema") {
    val setting: CsvConfig = CsvConfig(includeHeader = true)
    val path = getClass.getClassLoader.getResource("datasets/test_data.csv").getFile // 3 rows, 8 columns

    val destSchema = TableSchema(
      name = "",
      displayName = "",
      dbName = "",
      organizationId = -1L,
      columns = Seq(
        DateTimeColumn(name = "dob", "", inputFormats = Seq("dd/MM/yyyy")),
        StringColumn(name = "name", ""),
        DoubleColumn(name = "double", "")
      )
    )

    val batchSize = 2
    val t1 = System.currentTimeMillis()

    val reader = new CsvReader(path, setting, batchSize)
    var rowCounts = 0

    while (reader.hasNext()) {
      val records = reader.next(destSchema)
      rowCounts += records.size

      assert(records.nonEmpty)
      assert(records.length <= batchSize)
      records.foreach(r => assert(r.size == destSchema.columns.size))
    }

    assert(rowCounts == 3)
    println(s"rowCounts: $rowCounts")
    println(s"elapse time: ${System.currentTimeMillis() - t1}")

  }

}
