package co.datainsider.jobscheduler.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object DatabaseType extends Enumeration {
  type DatabaseType = Value
  val MySql: DatabaseType = Value("MySql")
  val Oracle: DatabaseType = Value("Oracle")
  val SqlServer: DatabaseType = Value("SqlServer")
  val Postgres: DatabaseType = Value("Postgres")
  val BigQuery: DatabaseType = Value("BigQuery")
  val Redshift: DatabaseType = Value("Redshift")
  val GoogleSheet: DatabaseType = Value("GoogleSheet")
  val GenericJdbc: DatabaseType = Value("GenericJdbc")
  val Vertica: DatabaseType = Value("Vertica")
  val Other: DatabaseType = Value("Others")
}

class DatabaseTypeRef extends TypeReference[DatabaseType.type]
