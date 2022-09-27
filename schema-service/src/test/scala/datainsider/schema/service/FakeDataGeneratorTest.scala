package datainsider.schema.service

import com.twitter.inject.Test

class FakeDataGeneratorTest extends Test {

  test("generate records for ingest service") {
    val size = 10
    val generatedCols: Array[GeneratedColumn] = Array(
      GenIntColumn("int_col", 1, 10),
      GenLongColumn("long_col", 1000000000000L, 200000000000L),
      GenDoubleColumn("double_col", 99, 199),
      GenStringColumn("string_col", Array("Apple", "Sumsung", "Dell", "Sony")),
      GenDateColumn("date_col", 1500000000000L, 1600000000000L),
      GenDateTimeColumn("date_time_col", 1600000000000L, 1700000000000L)
    )
    val records = FakeDataGenerator.generate(size, generatedCols)
    records.foreach(r => println(r.mkString(", ")))
  }

}
