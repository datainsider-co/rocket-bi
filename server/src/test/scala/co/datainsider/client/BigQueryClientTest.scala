//package co.datainsider.client
//
//import co.datainsider.bi.client.BigQueryClient
//import org.scalatest.FunSuite
//
//class BigQueryClientTest extends FunSuite {
//  val client = new BigQueryClient()
//
//  test("test query from external project") {
//    val sql =
//      s"""
//         |SELECT
//         |  CONCAT(
//         |    'https://stackoverflow.com/questions/',
//         |    CAST(id as STRING)
//         |  ) as url,
//         |  view_count
//         |FROM `bigquery-public-data`.`stackoverflow`.`posts_questions` as b
//         |WHERE tags like '%google-bigquery%'
//         |ORDER BY view_count DESC
//         |LIMIT 10
//         |""".stripMargin
//
//    client.query(sql)(tableResult => {
//      println(tableResult.getSchema)
//
//      tableResult
//        .iterateAll()
//        .forEach(row => {
//          row.forEach(value => print(value) + ", ")
//          println()
//        })
//    })
//  }
//
//  test("test query with aggregation") {
//    val sql =
//      s"""
//         |SELECT Region, sum(Total_Profit) as Sum_Profit
//         |FROM test.sales
//         |GROUP BY Region
//         |""".stripMargin
//
//    client.query(sql)(tableResult => {
//      println(tableResult.getSchema)
//
//      tableResult
//        .iterateAll()
//        .forEach(row => {
//          row.forEach(value => print(value) + ", ")
//          println()
//        })
//    })
//  }
//
//  test("test query date column") {
//    val sql =
//      s"""
//         |SELECT Order_Date
//         |FROM test.sales
//         |LIMIT 10
//         |""".stripMargin
//
//    client.query(sql)(tableResult => {
//      println(tableResult.getSchema)
//
//      tableResult
//        .iterateAll()
//        .forEach(row => {
//          row.forEach(value => print(value) + ", ")
//          println()
//        })
//    })
//  }
//
//  test("test query null") {
//    val sql =
//      s"""
//         |SELECT null as `null`
//         |FROM test.sales
//         |""".stripMargin
//
//    client.query(sql)(tableResult => {
//      println(tableResult.getSchema)
//
//      tableResult
//        .iterateAll()
//        .forEach(row => {
//          row.forEach(value => print(value) + ", ")
//          println()
//        })
//    })
//  }
//
//  test("test query with cte") {
//    val sql =
//      s"""
//         |with profits as (select Total_Profit / 23000 as profit_usd from test.sales)
//         |select profit_usd
//         |from profits
//         |limit 10 offset 0
//         |""".stripMargin
//
//    client.query(sql)(tableResult => {
//      println(tableResult.getSchema)
//
//      tableResult
//        .iterateAll()
//        .forEach(row => {
//          row.forEach(value => print(value) + ", ")
//          println()
//        })
//    })
//  }
//
//}
