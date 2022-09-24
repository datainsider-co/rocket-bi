package datainsider.ingestion.service

import com.twitter.inject.Test
import datainsider.ingestion.domain._
import datainsider.ingestion.domain.column.{DefaultExpression, DefaultTypes}
import datainsider.ingestion.misc.ClickHouseDDLConverter

/**
  * @author andy
  * @since 7/13/20
  */
class ClickHouseDDLCreatorTest extends Test {

  val ddlCreator = ClickHouseDDLConverter()
  val clusterName = "datainsider_test_cluster"

  test("Create table script should ok") {
    val request = TableSchema(
      "users",
      "testdb",
      1L,
      "Users",
      Seq(
        Int32Column("id", "Id"),
        DateTimeColumn("created_date", "Created Date"),
        StringColumn("location", "Location", defaultValue = Some("hcm")),
        StringColumn("shop", "Shop"),
        StringColumn("sale", "Sale"),
        NestedColumn(
          "goals",
          "Goals",
          nestedColumns = Seq(
            Int32Column("id", "Id"),
            Int32Column("serial", "Serial"),
            Int64Column("price", "Price"),
            DateTime64Column("time", "Time")
          )
        )
      ),
      primaryKeys = Seq("id"),
      orderBys = Seq("id")
    )

    val ddl = ddlCreator.toCreateShardTableDDL(request, clusterName).trim

    println(ddl)

    val expectedResult: String =
      """CREATE TABLE IF NOT EXISTS `testdb`.`users_shard` ON CLUSTER datainsider_test_cluster (
        | `id` Int32,
        |`created_date` DateTime,
        |`location` String DEFAULT 'hcm',
        |`shop` String,
        |`sale` String,
        |`goals` Nested(
        | 	`id` Int32,
        |	`serial` Int32,
        |	`price` Int64,
        |	`time` DateTime64(3)
        | )
        |) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{cluster}/{shard}/testdb/users', '{replica}')
        |PRIMARY KEY (id)
        |
        |ORDER BY (id)""".stripMargin

    assertResult(
      expectedResult
    )(ddl)
  }

  test("Insert to table with nested script should ok") {
    val tableSchema = TableSchema(
      "users",
      "testdb",
      1L,
      "Users",
      Seq(
        Int32Column("id", "Id"),
        DateTimeColumn("created_date", "Created Date"),
        StringColumn("location", "Location", defaultValue = Some("hcm")),
        StringColumn("shop", "Shop"),
        StringColumn("sale", "Sale"),
        NestedColumn(
          "goals",
          "Goals",
          nestedColumns = Seq(
            Int32Column("id", "Id"),
            Int32Column("serial", "Serial"),
            Int64Column("price", "Price"),
            DateTime64Column("time", "Time")
          )
        )
      ),
      primaryKeys = Seq("id"),
      orderBys = Seq("id")
    )

    val ddl = ddlCreator.toInsertSQL(tableSchema.dbName, tableSchema.name, tableSchema.columns).trim

    println(ddl)
    val expectedResult: String =
      """INSERT INTO `testdb`.`users` (`id`, `created_date`, `location`, `shop`, `sale`, `goals.id`, `goals.serial`, `goals.price`, `goals.time`)
        |VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""".stripMargin

    assertResult(expectedResult)(ddl)
  }

  test("table with Nullable DateTime64 should ok") {
    val tableSchema = TableSchema(
      "users",
      "testdb",
      1L,
      "Users",
      Seq(
        Int32Column("id", "Id"),
        DateTimeColumn("created_date", "Created Date", isNullable = true),
        StringColumn("location", "Location", defaultValue = Some("hcm")),
        StringColumn("shop", "Shop"),
        StringColumn("sale", "Sale"),
        NestedColumn(
          "goals",
          "Goals",
          nestedColumns = Seq(
            Int32Column("id", "Id"),
            Int32Column("serial", "Serial"),
            Int64Column("price", "Price"),
            DateTime64Column("time", "Time", isNullable = true)
          )
        )
      ),
      primaryKeys = Seq("id"),
      orderBys = Seq("id")
    )

    val ddl = ddlCreator.toCreateShardTableDDL(tableSchema, clusterName).trim

    println(ddl)

    val expectedResult: String =
      """CREATE TABLE IF NOT EXISTS `testdb`.`users_shard` ON CLUSTER datainsider_test_cluster (
        | `id` Int32,
        |`created_date` Nullable(DateTime),
        |`location` String DEFAULT 'hcm',
        |`shop` String,
        |`sale` String,
        |`goals` Nested(
        | 	`id` Int32,
        |	`serial` Int32,
        |	`price` Int64,
        |	`time` Nullable(DateTime64(3))
        | )
        |) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{cluster}/{shard}/testdb/users', '{replica}')
        |PRIMARY KEY (id)
        |
        |ORDER BY (id)""".stripMargin

    assertResult(expectedResult)(ddl)
  }

  test("Create table with Materialized column script should ok") {
    val request = TableSchema(
      "users",
      "testdb",
      1L,
      "Users",
      Seq(
        Int32Column("id", "Id"),
        DateTimeColumn("created_date", "Created Date"),
        StringColumn("location", "Location", defaultValue = Some("hcm")),
        StringColumn("shop", "Shop"),
        StringColumn("sale", "Sale"),
        Int64Column("price", "Price"),
        Int64Column(
          "price_vnd",
          "Price In VND",
          defaultExpression = Some(
            DefaultExpression(
              DefaultTypes.MATERIALIZED,
              "price*22000"
            )
          )
        ),
        NestedColumn(
          "goals",
          "Goals",
          nestedColumns = Seq(
            Int32Column("id", "Id"),
            Int32Column("serial", "Serial"),
            DateTime64Column("time", "Time")
          )
        )
      ),
      primaryKeys = Seq("id"),
      orderBys = Seq("id")
    )

    val ddl = ddlCreator.toCreateShardTableDDL(request, clusterName).trim

    println(ddl)

    val expectedResult: String =
      """CREATE TABLE IF NOT EXISTS `testdb`.`users_shard` ON CLUSTER datainsider_test_cluster (
        | `id` Int32,
        |`created_date` DateTime,
        |`location` String DEFAULT 'hcm',
        |`shop` String,
        |`sale` String,
        |`price` Int64,
        |`price_vnd` Int64 MATERIALIZED price*22000,
        |`goals` Nested(
        | 	`id` Int32,
        |	`serial` Int32,
        |	`time` DateTime64(3)
        | )
        |) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{cluster}/{shard}/testdb/users', '{replica}')
        |PRIMARY KEY (id)
        |
        |ORDER BY (id)""".stripMargin

    assertResult(expectedResult)(ddl)
  }
}
