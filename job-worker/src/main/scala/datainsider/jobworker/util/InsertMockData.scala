package datainsider.jobworker.util

import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}

import scala.io.Source

object InsertMockData {
  def insertMysqlMockData(jdbcUrl: String, username: String, password: String): Unit = {
    val client: JdbcClient = NativeJdbcClient(jdbcUrl = jdbcUrl, username = username, password = password)
    val dbName: String = "highschool"
    val tblName: String = ZConfig.getString("fake_data.table.student.name")

    val createDatabaseQuery: String = s"create database if not exists `$dbName`"
    val createTableQuery: String =
      s"""
        |create table $dbName.$tblName (
        | id int primary key,
        | name varchar(100),
        | address varchar(100),
        | age int,
        | birthday date,
        | gender int,
        | average_score real,
        | email varchar(100)
        |)
        |""".stripMargin

    client.executeUpdate(createDatabaseQuery)
    client.executeUpdate(createTableQuery)

    val dataCsv = Source.fromFile("sql/student.csv")
    for (line <- dataCsv.getLines) {
      val Array(id, name, address, age, birthday, gender, average_score, email) = line.split(",").map(_.trim)
      client.executeUpdate(
        s"insert into $dbName.$tblName values($id, '$name', '$address', '$age', '$birthday', '$gender', '$average_score', '$email')"
      )
    }
    dataCsv.close()
  }

  def insertPostgresMockData(jdbcUrl: String, username: String, password: String): Unit = {
    val client: JdbcClient = NativeJdbcClient(jdbcUrl = jdbcUrl, username = username, password = password)
    val dbName: String = "public"
    val tblName: String = ZConfig.getString("fake_data.table.student.name")

    val createTableQuery: String =
      s"""
         |create table $dbName.$tblName (
         | id serial primary key,
         | name varchar(100),
         | address varchar(100),
         | age bigint,
         | birthday timestamp,
         | gender bigint,
         | average_score real,
         | email varchar(100)
         |)
         |""".stripMargin

    client.executeUpdate(createTableQuery)

    val dataCsv = Source.fromFile("sql/student.csv")
    for (line <- dataCsv.getLines) {
      val Array(id, name, address, age, birthday, gender, average_score, email) = line.split(",").map(_.trim)
      client.executeUpdate(
        s"insert into $dbName.$tblName values($id, '$name', '$address', '$age', '$birthday', '$gender', '$average_score', '$email')"
      )
    }
    dataCsv.close()
  }
  def insertMssqlMockData(jdbcUrl: String, username: String, password: String): Unit = {
    val client: JdbcClient = NativeJdbcClient(jdbcUrl = jdbcUrl, username = username, password = password)
    val dbName: String = "dbo"
    val tblName: String = ZConfig.getString("fake_data.table.student.name")

    val createTableQuery: String =
      s"""
         |create table $dbName.$tblName (
         | id int primary key,
         | name varchar(100),
         | address varchar(100),
         | age int,
         | birthday date,
         | gender int,
         | average_score real,
         | email varchar(100)
         |)
         |""".stripMargin

    client.executeUpdate(createTableQuery)

    val dataCsv = Source.fromFile("sql/student.csv")
    for (line <- dataCsv.getLines) {
      val Array(id, name, address, age, birthday, gender, average_score, email) = line.split(",").map(_.trim)
      client.executeUpdate(
        s"insert into $dbName.$tblName values($id, '$name', '$address', '$age', '$birthday', '$gender', '$average_score', '$email')"
      )
    }
    dataCsv.close()
  }
}
