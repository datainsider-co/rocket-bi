package datainsider.ingestion.repository

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.ingestion.domain.{DatabaseSchema, StringColumn, TableSchema}
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.util.Implicits

/**
  * created 2022-12-30 11:14 AM
  *
  * @author tvc12 - Thien Vi
  */
class SchemaMetadataStorageTest extends IntegrationTest {
  override val injector: Injector = TestInjector(TestModule).newInstance()
  private val storage: SchemaMetadataStorage = injector.instance[SchemaMetadataStorage]
//  private val allDbName = ZConfig.getString("ssdb_key.database.all_database", "di.databases")
//  private val prefixKey = ZConfig.getString("ssdb_key.database.prefix_db_key", "di")
//  private val ssdb = injector.instance[SSDB]
  private val orgId = 2L
  private val baseDbSchema = new DatabaseSchema(
    name = "tvc12",
    organizationId = orgId,
    displayName = "tvc12",
    creatorId = "root",
    createdTime = System.currentTimeMillis(),
    updatedTime = System.currentTimeMillis(),
    tables = Seq.empty
  )
  private val baseTableSchema = new TableSchema(
    name = "test_table",
    dbName = "tvc12",
    organizationId = orgId,
    displayName = "test_table",
    columns = Seq.empty,
    primaryKeys = Seq.empty,
    orderBys = Seq.empty
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    await(storage.addDatabase(orgId, baseDbSchema))
  }

  override def afterAll(): Unit = {
    super.afterAll();
    await(storage.removeDatabase(orgId, baseDbSchema.name))
  }

  test("multi-thread create table using lock") {
    val threads: Seq[Thread] = Range(0, 10)
      .map(index => {
        new Thread(() => {
          val result = await(storage.addTable(orgId, baseDbSchema.name, baseTableSchema.copy(name = s"thread_$index")))
          println(s"Thread ${Thread.currentThread().getName} result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1000)
    threads.foreach(thread => assert(!thread.isAlive))
    val newDbName: DatabaseSchema = await(storage.getDatabaseSchema(orgId, baseDbSchema.name))
    assert(newDbName.tables.size == 10)
    newDbName.tables.foreach(table => {
      assert(table.name.startsWith("thread_"))
      println(table.name)
    })
  }

  test("multi-thread rename table using lock") {
    val threads: Seq[Thread] = Range(0, 10)
      .map(index => {
        new Thread(() => {
          val result = await(storage.renameTable(orgId, baseDbSchema.name, s"thread_$index", s"new_thread_${index}"))
          println(s"Thread ${Thread.currentThread().getName} rename result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1000)
    threads.foreach(thread => assert(!thread.isAlive))
    val newDbName: DatabaseSchema = await(storage.getDatabaseSchema(orgId, baseDbSchema.name))
    assert(newDbName.tables.size == 10)
    newDbName.tables.foreach(table => {
      assert(table.name.startsWith("new_thread_"))
    })
  }

  test("multi-thread drop table using lock") {
    val threads: Seq[Thread] = Range(0, 10)
      .map(index => {
        new Thread(() => {
          val result = await(storage.dropTable(orgId, baseDbSchema.name, s"new_thread_$index"))
          println(s"Thread ${Thread.currentThread().getName} result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1000)
    threads.foreach(thread => assert(!thread.isAlive))
    val newDbName: DatabaseSchema = await(storage.getDatabaseSchema(orgId, baseDbSchema.name))
    assert(newDbName.tables.isEmpty)
  }

  test("multi-thread add columns using lock") {
    await(storage.addTable(orgId, baseDbSchema.name, baseTableSchema))
    val threads: Seq[Thread] = Range(0, 10)
      .map(index => {
        new Thread(() => {
          val result = await(
            storage.addColumns(
              orgId,
              baseDbSchema.name,
              baseTableSchema.name,
              Seq(
                StringColumn(name = s"column_${index}", displayName = s"column ${index}")
              )
            )
          )
          println(s"Thread ${Thread.currentThread().getName} add columns result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1500)
    threads.foreach(thread => assert(!thread.isAlive))
    val newDbName: DatabaseSchema = await(storage.getDatabaseSchema(orgId, baseDbSchema.name))
    assert(newDbName.tables.size == 1)
    assert(newDbName.tables.head.columns.size == 10)
    newDbName.tables.head.columns.foreach(column => {
      assert(column.name.startsWith("column_"))
    })
  }

  test("multi-thread add or update columns using lock") {
    val threads: Seq[Thread] = Range(0, 15)
      .map(index => {
        new Thread(() => {
          val result = await(
            storage.addOrUpdateColumns(
              orgId,
              baseDbSchema.name,
              baseTableSchema.name,
              Seq(
                StringColumn(name = s"column_${index}", displayName = s"column ${index}")
              )
            )
          )
          println(s"Thread ${Thread.currentThread().getName} add columns result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1000)
    threads.foreach(thread => assert(!thread.isAlive))
    val newDbName: DatabaseSchema = await(storage.getDatabaseSchema(orgId, baseDbSchema.name))
    assert(newDbName.tables.size == 1)
    assert(newDbName.tables.head.columns.size == 15)
    newDbName.tables.head.columns.foreach(column => {
      assert(column.name.startsWith("column_"))
    })
  }

  test("multi-thread drop columns using lock") {
    val threads: Seq[Thread] = Range(0, 10)
      .map(index => {
        new Thread(() => {
          val result = await(storage.dropColumn(orgId, baseDbSchema.name, baseTableSchema.name, s"column_${index}"))
          println(s"Thread ${Thread.currentThread().getName} drop columns result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1000)
    threads.foreach(thread => assert(!thread.isAlive))
    val newDbName: DatabaseSchema = await(storage.getDatabaseSchema(orgId, baseDbSchema.name))
    assert(newDbName.tables.size == 1)
    assert(newDbName.tables.head.columns.size == 5)
  }

  test("multi-thread update columns using lock") {
    val threads: Seq[Thread] = Range(0, 10)
      .map(index => {
        new Thread(() => {
          val result = await(
            storage.updateColumn(
              orgId,
              baseDbSchema.name,
              baseTableSchema.name,
              StringColumn(name = s"column_${index}", displayName = s"column ${index}")
            )
          )
          println(s"Thread ${Thread.currentThread().getName} drop columns result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1000)
    threads.foreach(thread => assert(!thread.isAlive))
    val newDbName: DatabaseSchema = await(storage.getDatabaseSchema(orgId, baseDbSchema.name))
    assert(newDbName.tables.size == 1)
    assert(newDbName.tables.head.columns.size == 5)
  }

  test("multi-thread add databases") {
    val threads: Seq[Thread] = Range(0, 10)
      .map(index => {
        new Thread(() => {
          val result = await(
            storage.addDatabase(
              orgId,
              DatabaseSchema(
                name = s"table_${index}",
                displayName = s"database ${index}",
                tables = Seq.empty,
                organizationId = orgId,
                createdTime = 0,
                updatedTime = 0,
              )
            )
          )
          println(s"Thread ${Thread.currentThread().getName} add databases result: $result")
        })
      })
    threads.foreach(_.start())
    Thread.sleep(1000)
    threads.foreach(thread => assert(!thread.isAlive))
    val databases: Seq[DatabaseSchema] = await(storage.getDatabases(orgId))
    assert(databases.length == 11)
  }

  test("multi-thread remove databases") {
    val listResults: Seq[Future[Boolean]] = Range(0, 10)
      .map(index => Implicits.async {
          val result = await(storage.hardDelete(orgId, s"table_${index}"))
          println(s"Thread ${Thread.currentThread().getName} add databases result: $result")
          result
        })
    await(Future.collect(listResults))
//    listResults.foreach(_.start())
//    Thread.sleep(20)
//    listResults.foreach(thread => assert(!thread.isAlive))
    val databases: Seq[DatabaseSchema] = await(storage.getDatabases(orgId))
    assert(databases.length == 1)
  }

}
