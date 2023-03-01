package datainsider.jobworker.client

import datainsider.jobworker.util.ZConfig
import org.scalatest.FunSuite

class JdbcClientTest extends FunSuite {

  test("test mysql client") {
    //val jdbcUrl: String = ZConfig.getString("database_config.mysql.url")
    val username: String = ZConfig.getString("database_config.mysql.username")
    val password: String = ZConfig.getString("database_config.mysql.password")
    val jdbcUrl: String = "jdbc:mysql://localhost:3306"

    val client: JdbcClient = HikariClient(jdbcUrl, username, password)

    val query = "select 1;"
    client.executeQuery(query)(rs => {
      if (rs.next()) {
        assert(rs.getInt(1) == 1)
      }
    })
  }

  test("test mssql client ") {
    val jdbcUrl: String = "jdbc:sqlserver://localhost:1433"
    val username: String = "sa"
    val password: String = "di@2020!"

    val client: JdbcClient = NativeJdbcClient(jdbcUrl, username, password)

    val query = "select 1;"
    client.executeQuery(query)(rs => {
      if (rs.next()) {
        assert(rs.getInt(1) == 1)
      }
    })

  }

//  test("test client oracle") {
//    val connectionTimeout: Int = ZConfig.getInt("connection_timeout", 30)
//    val jdbcUrl: String = "jdbc:oracle:thin:@//localhost/ORCLCDB.localdomain"
//    val username: String = "system"
//    val password: String = "Oradoc_db1"
//
//    val client: JdbcClient = NativeJdbcClient(jdbcUrl, username, password, connectionTimeout)
//
//    val query = "SELECT * FROM dual"
//    client.executeQuery(query)(rs => {
//      if (rs.next()) {
//        assert(rs.getString(1) == "X")
//      }
//    })
//  }
//
//  test("test redshift jdbc") {
//    val connectionTimeout: Int = ZConfig.getInt("connection_timeout", 30)
//    val jdbcUrl: String = "jdbc:redshift://redshift-cluster-1.ccuehoxyhjvi.ap-southeast-1.redshift.amazonaws.com:5439/dev"
//    val username: String = "awsuser"
//    val password: String = "di_Admin2021"
//
//    val client: JdbcClient = NativeJdbcClient(jdbcUrl, username, password, connectionTimeout)
//
//    val query = "select 1;"
//    client.executeQuery(query)(rs => {
//      if (rs.next()) {
//        val num = rs.getInt(1)
//        println(num)
//      }
//    })
//  }
}
