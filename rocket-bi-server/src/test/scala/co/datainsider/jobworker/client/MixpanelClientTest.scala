package co.datainsider.jobworker.client

import co.datainsider.bi.util.Using
import co.datainsider.jobworker.client.mixpanel.{ExportRequest, MixpanelClient, USMixpanelClient}
import com.twitter.inject.Test

import java.nio.file.{Files, Path}
import java.sql.Date

class MixpanelClientTest extends Test {
  val client: MixpanelClient = new USMixpanelClient(
    accountUsername = "alo.c9d563.mp-service-account",
    accountSecret = "MDJwLqsb3FAMzqC4j1ZMMUnewr2YoKIO"
  )

  test("get profile success") {
    val response = client.getProfile()
    assert(response != null)
    assert(response.isSuccess)
    assert(response.results != null)
    println(s"response:: ${response.results.toString}")
  }

  test("test export") {
    val request = ExportRequest(
      projectId = "2690017",
      fromDate = Date.valueOf("2021-01-01"),
      toDate = Date.valueOf("2023-11-08")
    )
    val filePath: Path = client.export(request)

    assert(filePath != null)
    println(s"response to file path:: ${filePath.toString}")

    Using(scala.io.Source.fromFile(filePath.toFile)) { source =>
      val lines: Iterator[String] = source.getLines()

      lines.foreach { line =>
        println("line:: " + line);
      }
    }

    assert(filePath.toFile.exists())
    Files.deleteIfExists(filePath)
  }
}
