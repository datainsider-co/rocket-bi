package datainsider.jobworker.util

import com.fasterxml.jackson.databind.JsonNode
import datainsider.jobworker.domain.response.NextJobResponse
import datainsider.jobworker.domain.{DataSource, JdbcProgress, JobStatus}
import org.scalatest.FunSuite

import scala.collection.mutable.ArrayBuffer
import scala.language.postfixOps
import scala.sys.process._

class UtilTest extends FunSuite {

  test("json serializer") {
    val json =
      s"""
         |{
         |  "has_job": true,
         |  "job": {
         |    "job": {
         |      "class_name": "jdbc_job",
         |      "job_id": 8,
         |      "job_type": "Jdbc",
         |      "source_id": 1,
         |      "last_successful_sync": 0,
         |      "sync_interval_in_mn": 10,
         |      "last_sync_status": "Initialized",
         |      "current_sync_status": "Initialized",
         |      "database_name": "bi_service_schema",
         |      "table_name": "dashboard",
         |      "incremental_column": "id",
         |      "last_synced_value": "0",
         |      "max_fetch_size": 1000
         |    },
         |    "data_source": {
         |      "class_name": "jdbc_source",
         |      "id": 1,
         |      "display_name": "local mysql",
         |      "jdbc_url": "jdbc:mysql://127.0.0.1:3306",
         |      "username": "root",
         |      "password": "di@2020!"
         |    }
         |  }
         |}
         |""".stripMargin

    val jobResp: NextJobResponse = JsonUtils.fromJson[NextJobResponse](json)
    assert(jobResp != null)
    println(jobResp)
  }

  test("deserialize job") {
    val json =
      """
        |{
        |      "class_name": "jdbc_job",
        |      "job_id": 8,
        |      "job_type": "Jdbc",
        |      "source_id": 1,
        |      "last_successful_sync": 0,
        |      "sync_interval_in_mn": 10,
        |      "last_sync_status": "Initialized",
        |      "current_sync_status": "Initialized",
        |      "database_name": "bi_service_schema",
        |      "table_name": "dashboard",
        |      "incremental_column": "id",
        |      "last_synced_value": "0",
        |      "max_fetch_size": 1000
        |    }
        |""".stripMargin
  }

  test("serialize progress") {
    val progress = JdbcProgress(1, 1, 1, 0L, JobStatus.Init, 0L, 0L, "hello")

    val json = JsonUtils.toJson(progress)
    println(json)
  }

  test("deserialize data source") {
    val json =
      s"""
         | {
         |    "class_name": "jdbc_source",
         |    "id": 3,
         |    "display_name": "Aws Oracle db test",
         |    "database_type": "Oracle",
         |    "jdbc_url": "jdbc:oracle:thin:@//oracle-db-test.cp163tfqt4gc.ap-southeast-1.rds.amazonaws.com:1521/ORCL",
         |    "username": "admin",
         |    "password": "datainsider"
         |  }
         |""".stripMargin

    val oracle = JsonUtils.fromJson[DataSource](json)
    println(oracle)
  }

  //  test("google big query") {
  //    import com.google.auth.oauth2.ServiceAccountCredentials
  //    import java.io.FileInputStream
  //
  //    //val credentialsPath = new File("/home/nkthien/test/big-query/sincere-elixir-234203-c0b291aee885.json")
  //
  //    val fileContent =
  //      "{\n  \"type\": \"service_account\",\n  \"project_id\": \"sincere-elixir-234203\",\n  \"private_key_id\": \"c0b291aee88523719487bfeaf80fc462b0c6d2ae\",\n  \"private_key\": \"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDIZNIDaIsE1tfy\\n9ncjJDHfmVwG00K9EbXQ1dgxWd7k+68rEaoD/wwk4xb4DijycXbxRkAMO6O6XqIZ\\nyqS1ODHnWOJAQn95gmGpiNZdUI7yYFzWH076zptwUy/RGHHpnBM43VE6zG3AFQdA\\nZP5FMJh1ESfwo80eKzZCqZtjZUKDk7/C8/rUwDpbIWCayWu+2F1UUy/acCPIpiay\\n+tbh16QMc0iX6ohiEDExU3pt/Q3FBvsdLZtmUMNvUG8YrwPEmF7SF9GqVVM5TJj0\\n6o3tZ7oa/gvDqBxKrYUAkkfWtuCJZqQI1R6gJ2+TRFFyIYfD7VdIshuxNFrs8cWT\\nmPOO3HSzAgMBAAECggEANGjJ1EJfOWDHEbAL8JDiykvdmZte9PvQxVFoPV/3v4Nj\\niKwR/wGRN4R82Vs6sk2ige+RiKGAbJmbY4twEEUmKA9C/PNnS2wiBqjXB4iuGg3B\\nue5uRYILfREEjHcMM8Cx9klLmUkl2vqk7t568bWH6fYWsATm/GDoy/53uUMeZjKj\\nZpV7GaMWiJp7B4OgaibhkHdhnDoI6g46yHOPHJL8C9161K+QnHqJvIiqQNvUSi1v\\nFYBdFDqguGtAhWSUNB6EcjzMv5ZxqofUU461oxlQ2lo9qbqXZ0T1uba/8ara3dp5\\nf8k6TBxaFd30GHgLWnPIJHCV+zyZE0iklxahVvpHAQKBgQDvqzkqfMrkaSvc1H9i\\n5eq5xnkUZoszih+fZaEuMw7/RIur8DOm3aYygIvXgF5z+nFr0qrvo8dYJhYmpqZm\\n5zoRDyNOxEeEvEPuQt2BRjp/6ma122miBe2Ckty5OuQJxie8we6CiJMUtwRWvA1V\\nrJmqniDfM2HmdgJbJd4VfnW3YQKBgQDWDHweM8fto1JcflGQMvjQq4e//djLJG4z\\nUqHlJBaZcmOokkpeJB7dTtMgEVCeXJIx/OmCpc39ffs9YiAgtS4kaGzowVLpLdoG\\nOzxoc5L4iXFl+oWOIqGV1cZhQd497cNN4dWNQXrPzfh/PtRF43uLU4KuuSsb/I4n\\n0aHjar0okwKBgQDNmpf6CQCNnmPQmEOH9jG9mbR5edblKhMizS7O0WKGPqmLoQ7O\\nkctn+7r77tYYrLrsgte9qUT0LAhItCKAmNDJnbDue5fXGSM1nQslQbgh0Fa4oDgo\\nlOlCYPcVuJ20fNfOKJiSRtPWq4L/XWgbHWzeX7VXhV7xND+lLgEtc0VNQQKBgQDF\\nZSIZYDtiBZnwvnVNfBRFq8o23kzNmj0ei3fNryhAPmN1k+ONSdZE1WqSSiWExW31\\nN33JBEshGMtXYmSqhSuWW88EHzTs4WINGReuY9cH6QhwuUXtPDazzT9zdaEUj23r\\nJvcfm2E8voAKKNDt2smWRV9g7la5KoGWaxbWeRsUjQKBgBcTpn53wOreMb1VHdZj\\n9LkG7rU4pXQKm0tggBJzcO0146pEte7EvmGOywvTzlmBBUv3nyFJTmyy/OJzFIRL\\nhBIxiP2LA5wqkhbp5swDK5+mWs/ipM8o/nZ3VxEsJZtGSsb6MYRhPvCqMhh7hsU6\\nneOkbQWtUJgSnQEGtheXCBRy\\n-----END PRIVATE KEY-----\\n\",\n  \"client_email\": \"test-big-query@sincere-elixir-234203.iam.gserviceaccount.com\",\n  \"client_id\": \"104124452508200046364\",\n  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n  \"token_uri\": \"https://oauth2.googleapis.com/token\",\n  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/test-big-query%40sincere-elixir-234203.iam.gserviceaccount.com\"\n}"
  //
  //    var credentials: ServiceAccountCredentials = null
  //    try {
  //      val serviceAccountStream: InputStream = new ByteArrayInputStream(fileContent.getBytes())
  //      try credentials = ServiceAccountCredentials.fromStream(serviceAccountStream)
  //      finally if (serviceAccountStream != null) serviceAccountStream.close()
  //    }
  //
  //    val bigQuery: BigQuery = BigQueryOptions
  //      .newBuilder()
  //      .setCredentials(credentials)
  //      .build()
  //      .getService
  //
  //    import com.google.cloud.bigquery.QueryJobConfiguration
  //    val query =
  //      s"""
  //         |SELECT name, gender, SUM(count) AS total
  //         |FROM babynames.baby2020
  //         |GROUP BY name, gender
  //         |ORDER BY total ASC
  //         |LIMIT 10
  //         |""".stripMargin
  //    val queryConfig = QueryJobConfiguration.newBuilder(query).build
  //
  //    val rows: lang.Iterable[FieldValueList] = bigQuery.query(queryConfig).iterateAll()
  //    rows.forEach(row => {
  //      row.forEach(v => print(v.getValue.toString + " "))
  //      println()
  //    })
  //
  //    /*val it = rows.iterator()
  //    while(it.hasNext) {
  //      val row: FieldValueList = it.next()
  //      val test =row.get("name").getAttribute.
  //      println(test)
  //    }*/
  //
  ////    client.executeQuery("select * from where")(it => while(it.next) {it.getString})
  //  }

  private def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+)?([eE]\d+)?$"""
    if (str.matches(numberRegex)) str
    else s"'$str'"
  }

  test("test match regex") {
    val numberRegex = """^-?\d+(.?\d+)?$"""
    //    val numberRegex = """^-?\d+.?\d+?$"""
    val str = "1.1"
    println(str.matches(numberRegex))
  }

  test("test temporary table regex ") {
    val tableName = "__di_tmp_directory_1626686483900"
    val tmpTableRegex = """^__di_([\w]+)_(\d{13})$""".r
    tableName match {
      case tmpTableRegex(name, timestamp) => println(name, timestamp)
      case _                              => false
    }
  }

  test("test get client id from service account") {
    val serviceAccount =
      """
        |{
        |  "type": "service_account",
        |  "project_id": "skillful-coil-317808",
        |  "private_key_id": "51fabad17df36596084362507b1df23647ac2e79",
        |  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDP7FCDKRKAivdv\n/IX/fWZnMhdVPLtFZbA8cYagRcdFsPeUNkhyDuaLLJIJx4l/lbMlx/mPE2XgqT3W\nNTHefo3vLePDcmJuBfwwT5XlqcNSFpP6nGo2HgTVkI/Gffi4Aia4ROqm+zukgOpt\nc5xwMoGdHdJdshzgUR9UXF85CiQ01RtK8rHDwnlX5AJ55ApzvuJzz8+D2w8LTYgJ\nY5gHNHNuH8L07+ONFgDiSh208E0NizDnuYP4ycWR0+tpXxRdSAeJSgaxIPa73XBh\nE6Ty3oplvm84udf9foCwfB8dfN/tvQCE3mL1TLzrSvSWzcd6FTcu5bK0t3MpXSTr\nItIMaA+TAgMBAAECggEARwlHNpB1PEp+IBoH09KNhmtEMoBlwN9tlzD4HFDKtKIx\n68ah+KnjlR/8ou+zp83G330TY5DuiRN5R3J0H75gEpu8iZ1OSKWt0/mUzlqyGx0Q\noJoI5YVbBHX30Qpfy8ocXW9aNgN2jIzoys0pYOG4i6vRH+bG29KLYCCQ/eVbmlqo\nIbYYlhHc/yQzEBZS4GW66Wi9yhujWUk3J0gOtvI2squA/pvtRBm1Q4gWCWEpyklt\n4eOLiTIQWY3uIDVDdeM/UL75gepjEzhWaJrsMNegUNS8YvpV/ITcZcAw5vfDxtVJ\nDb0kArjvL4/43PrA1EIPnpchES27yXCiQ0BWpaBzCQKBgQD+9SQIUpff6h11U6xA\neBxLgj7s5x/okkGVi8WSn7IokB1AwsVgYJo2zMpvOarWWwc/V2FqqfwjrX66UY4j\nX+hwIGUgguVIvjAr9q72PXPMdGVSyE7NSQbw3nyQrnHBaOPEGZzWvitbUYHZER/M\nOxevZQ4W7ZoXwBGQuVo41H//+wKBgQDQxfGTfmPFedvE+yqraE79mkr8Fm3gxRV6\nSRQK6kp7+Z/6rKFdPjqAGe5Q981Hgab03sRMxcoq5Dt+O5TIUb/qapyOlyW7uhnA\ndRpFNxXhnZMn9LNEY2IKEiT7YBM+3mILPOK12gpFB1VFSf14AG8DpRwJJXikU3Jm\nFD6DNZ5jSQKBgAoFeLUbCf0zJpVGBK9ECViudeq56vcpSIqoQ8vPmyEdCQlSno97\nPJSK2ConCiAC0/YZaSrYI6EDYMfSDNQ3INvHajIs8vY5A4u21om3QKX4rULjvLU0\n+aDeHedR9Aa2KL28g/2s2+dq/L+bfLR6XiP2xOcBz9y/H/GgV3uEXsOhAoGBAK5C\nuw0g70iTGZUHDSu7yks2caaPVjHKb839l6QwwfFPgHBtjddVrODmRB0Dai5okyJL\nm1B1u/UnQl1wgBTg369cQ8dldFKI2Rvi4wWpIDONIpq0Trojtl6vnHzSSd4tI2s7\n7ARctju+DjfitZZnzkIdnBQqWdPX72IzPaapp8Y5AoGBAIadWEgRrvLQG9c7fRWH\nP9iG3CHW3txKlvk+/Qj9UvuRxiQ0bRqp7LyQHUfarMQ7bmxQhvTmcJ2hnCf/cPmE\nbhgtc1TXvCQvRC4M/iO2hTyAAAZarZxbDtYfZx6NGouKtXNrG6j2BQeVNpVhtvIE\nyO7MXiTus1AEi23fSUpRgEdu\n-----END PRIVATE KEY-----\n",
        |  "client_email": "data-insider@skillful-coil-317808.iam.gserviceaccount.com",
        |  "client_id": "116035308601510446459",
        |  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        |  "token_uri": "https://oauth2.googleapis.com/token",
        |  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        |  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/data-insider%40skillful-coil-317808.iam.gserviceaccount.com"
        |}
        |""".stripMargin

    val serviceAccountJson = JsonUtils.fromJson[JsonNode](serviceAccount)
    println(serviceAccountJson.get("project_id").asText())
  }

  test("test process cmd") {
    val password = ""
    val filePath = "./tmp/text.csv"
    val cmds = ArrayBuffer.empty[String]
    cmds += "clickhouse-client"
    cmds += "--host=localhost"
    cmds += "--port=9000"
    cmds += "--user=default"
    if (password.nonEmpty) cmds += s"--password=$password"
    cmds += "--query=INSERT INTO bigquery_storage.test_import_query_3 select state, gender, year/10, name, number from input('state String, gender String, year Int64, name String, number Int64') FORMAT JSONCompactEachRow"
    Process(s"tail -n +2 $filePath").#|(cmds).lineStream_!
  }
}
