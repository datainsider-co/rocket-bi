package co.datainsider.jobworker.client

import co.datainsider.caas.user_profile.util.JsonParser
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.service.hubspot.client.{
  APIKeyHubspotClient,
  HsPageResponse,
  HsPropertiesClient,
  HsPropertyInfo,
  HubspotReader,
  Response
}
import org.scalatest.FunSuite

class HubspotClientTest extends FunSuite {
  private val apiKey = "pat-na1-5a7c134c-9be6-48d0-aa44-e1d37c591e76"

  val job = HubspotJob(
    orgId = 0,
    syncMode = SyncMode.FullSync,
    subType = HubspotObjectType.Contact,
    sourceId = 0,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = "hubspot_data",
    destTableName = "",
    destinations = Seq.empty
  )

  test("test api key client") {
    val client = new APIKeyHubspotClient(apiKey)
    val response = client.GET("https://api.hubapi.com/crm/v3/objects/contacts")
    println(response)
  }

  test("test contact client") {
    val contactClient = new APIKeyHubspotClient(apiKey, debug = false) with HsPropertiesClient
    val prop: Response[HsPageResponse[HsPropertyInfo]] = contactClient.getProperties(HubspotObjectType.Company)
    prop.data.get.results.foreach(field => println(field.name, field.`type`))
  }

  test("test contact reader") {
    val jobFromJson = JsonParser.fromJson[Job](JsonParser.toJson(job))
    val reader = new HubspotReader(apiKey, jobFromJson.asInstanceOf[HubspotJob])
    val tableSchema = reader.getSchema
    val columns = tableSchema.columns

    val records = reader.next(columns)
    records.foreach(r => println(JsonParser.toJson(r)))
  }
}
