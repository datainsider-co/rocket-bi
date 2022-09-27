package datainsider.schema.controller

import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.schema.TestServer
import org.codehaus.jackson.map.ObjectMapper

class IngestionControllerTest extends FeatureTest {
  override val server = new EmbeddedHttpServer(new TestServer)

  test("test preview csv for the first time") {
    val postData =
      """
        |{
        |	"sample": "Margaret Njambi,Mbugua,Guiford,2019-02-12,1,247.5,256,Casual,Active,105.05,11.9\nThao Phuong Thi,Nguyen,St Johns Park,2018-10-15,1,214,214,Casual,Active,90.83,-21.6\nAziz,Binyamin,Fairfield West,2020-07-16,1,198,198,Casual,Active,84.04,-37.6\nChan Thavory,Chap,CABRAMATTA,2019-05-20,1,155,155,Casual,Active,65.79,-80.6\nHiu Yuet (Joan),Cheung,Elizabeth Hills,2019-09-20,1,151,151,Casual,Active,64.09,-84.6\nEmilia,Zwolak,Liverpool,2020-10-24,0,145.5,151,Casual,Inactive,61.76,-90.1\nMonalisa,Ordona,Westmead,2020-10-22,0,127,147,Casual,Inactive,53.9,-108.6\nSok Ngim,Hoy,BONNYRIGG,2018-11-26,1,144.5,144.5,Casual,Active,61.33,-91.1",
        |	"csv_setting": {
        |		"include_header": true,
        |		"delimiter": ",",
        |		"quote": "",
        |		"add_batch_info": false
        |	}
        |}
        |""".stripMargin

    val r = server.httpPost(
      path = "/ingestion/csv/preview",
      postBody = postData,
      andExpect = Status.Ok,
      headers = Map(
        "DI-SERVICE-KEY" -> "12345678"
      )
    )
    val response: String = r.getContentString()
    val expectedResponse =
      """
        |{
        |  "schema" : {
        |    "name" : "",
        |    "db_name" : "",
        |    "organization_id" : 0,
        |    "display_name" : "",
        |    "columns" : [
        |      {
        |        "class_name" : "string",
        |        "name" : "Margaret Njambi",
        |        "display_name" : "Margaret Njambi",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "string",
        |        "name" : "Mbugua",
        |        "display_name" : "Mbugua",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "string",
        |        "name" : "Guiford",
        |        "display_name" : "Guiford",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "datetime",
        |        "name" : "2019-02-12",
        |        "display_name" : "2019-02-12",
        |        "input_as_timestamp" : false,
        |        "input_formats" : [
        |          "yyyy-MM-dd"
        |        ],
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "int32",
        |        "name" : "1",
        |        "display_name" : "1",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "double",
        |        "name" : "247.5",
        |        "display_name" : "247.5",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "double",
        |        "name" : "256",
        |        "display_name" : "256",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "string",
        |        "name" : "Casual",
        |        "display_name" : "Casual",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "string",
        |        "name" : "Active",
        |        "display_name" : "Active",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "double",
        |        "name" : "105.05",
        |        "display_name" : "105.05",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      },
        |      {
        |        "class_name" : "double",
        |        "name" : "11.9",
        |        "display_name" : "11.9",
        |        "is_nullable" : true,
        |        "is_encrypted":false
        |      }
        |    ],
        |    "primary_keys" : [ ],
        |    "partition_by" : [ ],
        |    "order_bys" : [ ],
        |    "table_type":"default","temporary":false
        |  },
        |  "csv_setting" : {
        |    "include_header" : true,
        |    "delimiter" : ",",
        |    "add_batch_info" : false
        |  },
        |  "records" : [
        |    [
        |      "Thao Phuong Thi",
        |      "Nguyen",
        |      "St Johns Park",
        |      "2018-10-15T00:00:00.000+00:00",
        |      1,
        |      214.0,
        |      214.0,
        |      "Casual",
        |      "Active",
        |      90.83,
        |      -21.6
        |    ],
        |    [
        |      "Aziz",
        |      "Binyamin",
        |      "Fairfield West",
        |      "2020-07-16T00:00:00.000+00:00",
        |      1,
        |      198.0,
        |      198.0,
        |      "Casual",
        |      "Active",
        |      84.04,
        |      -37.6
        |    ],
        |    [
        |      "Chan Thavory",
        |      "Chap",
        |      "CABRAMATTA",
        |      "2019-05-20T00:00:00.000+00:00",
        |      1,
        |      155.0,
        |      155.0,
        |      "Casual",
        |      "Active",
        |      65.79,
        |      -80.6
        |    ],
        |    [
        |      "Hiu Yuet (Joan)",
        |      "Cheung",
        |      "Elizabeth Hills",
        |      "2019-09-20T00:00:00.000+00:00",
        |      1,
        |      151.0,
        |      151.0,
        |      "Casual",
        |      "Active",
        |      64.09,
        |      -84.6
        |    ],
        |    [
        |      "Emilia",
        |      "Zwolak",
        |      "Liverpool",
        |      "2020-10-24T00:00:00.000+00:00",
        |      0,
        |      145.5,
        |      151.0,
        |      "Casual",
        |      "Inactive",
        |      61.76,
        |      -90.1
        |    ],
        |    [
        |      "Monalisa",
        |      "Ordona",
        |      "Westmead",
        |      "2020-10-22T00:00:00.000+00:00",
        |      0,
        |      127.0,
        |      147.0,
        |      "Casual",
        |      "Inactive",
        |      53.9,
        |      -108.6
        |    ],
        |    [
        |      "Sok Ngim",
        |      "Hoy",
        |      "BONNYRIGG",
        |      "2018-11-26T00:00:00.000+00:00",
        |      1,
        |      144.5,
        |      144.5,
        |      "Casual",
        |      "Active",
        |      61.33,
        |      -91.1
        |    ]
        |  ]
        |}
        |""".stripMargin

    val mapper = new ObjectMapper()
    val actualJson = mapper.readTree(response)
    val expectedJson = mapper.readTree(expectedResponse)
    assert(actualJson != null)
  }

}
