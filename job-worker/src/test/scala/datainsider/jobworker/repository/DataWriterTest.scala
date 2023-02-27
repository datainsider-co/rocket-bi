package datainsider.jobworker.repository

import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{
  BoolColumn,
  DateColumn,
  DateTimeColumn,
  FloatColumn,
  Int32Column,
  StringColumn
}
import datainsider.client.util.{Using, ZConfig}
import datainsider.jobworker.client.NativeJdbcClient
import datainsider.jobworker.domain.{DatabaseType, JdbcSource}
import datainsider.jobworker.repository.writer.{ClickhouseWriter, FileClickhouseWriter, LocalFileWriterImpl}
import datainsider.jobworker.util.{ClickhouseDbTestUtils, JsonUtils}
import org.scalatest.{BeforeAndAfterAll, FunSuite}

import java.io.{BufferedReader, File, FileReader}
import java.sql.Date
import scala.io.Source

class DataWriterTest extends FunSuite with BeforeAndAfterAll {

  val jdbcUrl: String = ZConfig.getString("database_test.clickhouse.url")
  val username: String = ZConfig.getString("database_test.clickhouse.username")
  val password: String = ZConfig.getString("database_test.clickhouse.password")

  val destDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")
  val destTblName: String = ZConfig.getString("fake_data.table.student.name", default = "student")

  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
    dbTestUtils.createTable(destDatabaseName, destTblName)
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
  }

  val source: JdbcSource = JdbcSource(
    1,
    1,
    "clickhouse local",
    DatabaseType.Clickhouse,
    jdbcUrl,
    username,
    password
  )

  val tableSchema: TableSchema = TableSchema(
    name = destTblName,
    dbName = destDatabaseName,
    organizationId = 1,
    displayName = "Student table",
    columns = Seq(
      Int32Column("id", "Id"),
      StringColumn("name", "Name", isNullable = true),
      StringColumn("address", "Address", isNullable = true),
      Int32Column("age", "Age", isNullable = true),
      DateColumn("birthday", "Date of birth", isNullable = true),
      Int32Column("gender", "Gender"),
      FloatColumn("average_score", "Average score"),
      StringColumn("email", "Email")
    )
  )

  val jdbcClient: NativeJdbcClient = NativeJdbcClient(jdbcUrl, username, password)
  val clickhouseWriter = new ClickhouseWriter(jdbcClient)

  test("clickhouse writer") {
    val records = Seq(
      Seq(1, "kiki", "Atlantic", 10, new Date(0), 1, 7.1, "kiki@gmail.com"),
      Seq(2, "mimi", "Pacific", 3, new Date(0), 0, 7.2, "mimi@gmail.com"),
      Seq(3, "momo", "Himalaya", 7, new Date(0), 0, 7.3, "momo@gmail.com")
    )

    clickhouseWriter.write(records, tableSchema)
  }

  val localFileWriter = new LocalFileWriterImpl(ZConfig.getConfig("hadoop-writer.local-file-writer"))
  test("local file writer test") {
    val records = Seq(
      Seq(1, "kiki", "Atlantic", 10, new Date(System.currentTimeMillis()), 1, 7.1, "kiki@gmail.com"),
      Seq(2, "mimi", "Pacific", 3, new Date(System.currentTimeMillis()), 0, 7.2, "mimi@gmail.com"),
      Seq(3, "momo", "Himalaya", 7, new Date(System.currentTimeMillis()), 0, 7.3, "momo@gmail.com"),
      Seq(4, "haha", "Himalaya2", 9, new Date(System.currentTimeMillis()), 0, 3.3, "haha@gmail.com")
    )
    val expectedData: Seq[String] = records.map(_.mkString(","))

    localFileWriter.writeLine(records, tableSchema)
    localFileWriter.flushUnfinishedFiles()

    val folder = new File(s"./tmp/hadoop/${tableSchema.dbName}/${tableSchema.name}")
    folder
      .listFiles()
      .foreach(file => {
        var count: Int = 0
        Using(new BufferedReader(new FileReader(file)))(reader => {
          val firstLine = reader.readLine()
          val destTableSchema = JsonUtils.fromJson[TableSchema](firstLine)
          assert(tableSchema.name.equals(destTableSchema.name))
          assert(tableSchema.columns.length.equals(destTableSchema.columns.length))
          var line: String = reader.readLine()
          while (line != null) {
            expectedData.contains(line)
            count = count + 1
            line = reader.readLine()
          }
        })
        assert(count.equals(expectedData.length))
        //file.delete()
      })
  }
}
