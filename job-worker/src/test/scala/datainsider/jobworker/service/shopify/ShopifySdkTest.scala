package datainsider.jobworker.service.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import datainsider.jobworker.domain.ShopifySource
import datainsider.jobworker.repository.reader.shopify._
import datainsider.jobworker.util.{JsonUtils, ZConfig}
import org.scalatest.FunSuite

import java.util.concurrent.TimeUnit
import scala.jdk.CollectionConverters.asScalaBufferConverter

class ShopifySdkTest extends FunSuite {
  val apiUrl = ZConfig.getString("database_test.shopify.api_url")
  val accessToken = ZConfig.getString("database_test.shopify.access_token")
  val apiVersion = ZConfig.getString("database_test.shopify.api_version")
  val source = ShopifySource(12, 121217, "ShopifyWorker", apiUrl, accessToken, apiVersion)

  private lazy val client = ShopifySdk
    .newBuilder()
    .withApiUrl(source.getAdminUrl())
    .withAccessToken(source.accessToken)
    .withApiVersion(source.apiVersion)
    .withMaximumRequestRetryRandomDelay(10000, TimeUnit.MILLISECONDS)
    .withMinimumRequestRetryRandomDelay(500, TimeUnit.MILLISECONDS)
    .withMaximumRequestRetryTimeout(500, TimeUnit.MILLISECONDS)
    .build()

  test("list orders") {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().build()
    val orders: ShopifyPage[JsonNode] = client.getOrders(request)
    println(s"number items: ${orders.size()}")
    assert(orders.isEmpty == false)
    assert(orders.getNextPageInfo == null)
  }

  test("list orders with since_id") {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId("477771687549111").build()
    val orders: ShopifyPage[JsonNode] = client.getOrders(request)
    println(s"number items: ${orders.size()}")
    assert(orders.isEmpty == true)
    assert(orders.getNextPageInfo == null)
  }

  test("list order risk with since_id") {
    val shopifyOrderRisks: Seq[JsonNode] = client.getOrderRisks("4783258173667").asScala
    println(s"number items: ${shopifyOrderRisks.length}")
    assert(shopifyOrderRisks.nonEmpty)
  }

  test("MarketingEventReader serialize json") {
    val json =
      """{
        |		"id": 186064601315,
        |		"event_type": "ad",
        |		"remote_id": null,
        |		"started_at": "2022-12-15T07:00:00+07:00",
        |		"ended_at": null,
        |		"scheduled_to_end_at": "2022-12-15T07:00:00+07:00",
        |		"budget": "10.75",
        |		"currency": "USD",
        |		"manage_url": null,
        |		"preview_url": null,
        |		"utm_campaign": "Camping 1567",
        |		"utm_source": "facebook",
        |		"utm_medium": "cpc",
        |		"budget_type": "lifetime",
        |		"description": "Buffet",
        |		"marketing_channel": "social",
        |		"paid": true,
        |		"referring_domain": "facebook.com",
        |		"breadcrumb_id": null,
        |		"marketing_activity_id": 140686557411,
        |		"admin_graphql_api_id": "gid:\/\/shopify\/MarketingEvent\/186064601315",
        |		"marketed_resources": [
        |			{
        |				"type": "product",
        |				"id": 7691057365219
        |			}
        |		]
        |	}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = MarketingEventReader.serialize(node)

    assert(
      JsonUtils.toJson(
        record,
        false
      ) == """[186064601315,null,"ad","social",true,"facebook.com",10.75,"USD","lifetime",1671062400000,1671062400000,null,"Buffet",null,null,"[{\"type\":\"product\",\"id\":7691057365219}]","Camping 1567","facebook","cpc","140686557411",null]"""
    )
  }

  test("MetaField serialize json") {
    val json =
      """		{
        |			"id": 22697352560867,
        |			"namespace": "my_fields_1",
        |			"key": "product",
        |			"value": "{\"meo\":123,\"dogs\":\"456\"}",
        |			"description": "help",
        |			"owner_id": 64641466595,
        |			"created_at": "2022-05-31T17:45:30+07:00",
        |			"updated_at": "2022-05-31T17:45:30+07:00",
        |			"owner_resource": "shop",
        |			"type": "json",
        |			"admin_graphql_api_id": "gid:\/\/shopify\/Metafield\/22697352560867"
        |		}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = MetaFieldReader.serialize(node)

    assert(
      JsonUtils.toJson(
        record,
        false
      ) == """[22697352560867,"my_fields_1",1653993930000,"help","product","64641466595","shop",1653993930000,"{\"meo\":123,\"dogs\":\"456\"}","json"]"""
    )

  }

  test("Blog serialize json") {
    val json =
      """{
        |  "commentable": "no",
        |  "created_at": "2012-03-13T16:09:54-04:00",
        |  "feedburner": {
        |   "json": "a"
        |  },
        |  "metafields": [{"key": "123"}],
        |  "feedburner_location": "abc",
        |  "handle": "apple-blog",
        |  "id": 241253187,
        |  "tags": "tagged",
        |  "template_suffix": "olala",
        |  "title": "My Blog",
        |  "updated_at": "2021-12-01T14:52:12-04:00",
        |  "admin_graphql_api_id": "gid://shopify/OnlineStoreBlog/241253187"
        |}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = BlogReader.serialize(node)
    assert(
      JsonUtils.toJson(
        record,
        false
      ) == """[241253187,"no",1331669394000,"{\"json\":\"a\"}","abc","apple-blog","[{\"key\":\"123\"}]","tagged","olala","My Blog",1638384732000,"gid://shopify/OnlineStoreBlog/241253187"]"""
    )
  }

  test("Article serialize json") {
    val json =
      """{
        |  "author": "John",
        |  "blog_id": 241253187,
        |  "body_html": "<p>Welcome to my new blog!</p>",
        |  "created_at": "2008-12-31T19:00:00-05:00",
        |  "id": 989034056,
        |  "handle": "hello-world",
        |  "image": {
        |    "src": "https://cdn.myshopify.io/s/files/1/0000/0001/articles/Red_Cotton.jpg?v=1443721435",
        |    "created_at": "2008-12-31T19:00:00-05:00"
        |  },
        |  "metafields": {
        |    "key": "new",
        |    "value": "new value",
        |    "type": "single_line_text_field",
        |    "namespace": "global"
        |  },
        |  "published": false,
        |  "published_at": "2008-07-31T20:00:00-04:00",
        |  "summary_html": "<p>My first blog post!</p>",
        |  "tags": "tagsational",
        |  "template_suffix": null,
        |  "title": "Hello world!",
        |  "updated_at": "2009-01-31T19:00:00-05:00",
        |  "user_id": 799407056
        |}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = ArticleReader.serialize(node)
    assert(
      JsonUtils.toJson(
        record,
        false
      ) == """[989034056,"John",241253187,"<p>Welcome to my new blog!</p>",1230768000000,"hello-world","{\"src\":\"https://cdn.myshopify.io/s/files/1/0000/0001/articles/Red_Cotton.jpg?v=1443721435\",\"created_at\":\"2008-12-31T19:00:00-05:00\"}","{\"key\":\"new\",\"value\":\"new value\",\"type\":\"single_line_text_field\",\"namespace\":\"global\"}",false,1217548800000,"<p>My first blog post!</p>","tagsational",null,"Hello world!",1233446400000,799407056]"""
    )
  }

  test("Comment serialize json") {
    val json =
      """    {
        |      "id": 118373535,
        |      "body": "Hi author, I really _like_ what you're doing there.",
        |      "body_html": "<p>Hi author, I really <em>like</em> what you're doing there.</p>",
        |      "author": "Soleone",
        |      "email": "sole@one.de",
        |      "status": "published",
        |      "article_id": 134645308,
        |      "blog_id": 241253187,
        |      "created_at": "2022-04-05T13:05:24-04:00",
        |      "updated_at": "2022-04-05T13:05:24-04:00",
        |      "ip": "127.0.0.1",
        |      "user_agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_4; en-us) AppleWebKit/525.18 (KHTML, like Gecko) Version/3.1.2 Safari/525.20.1",
        |      "published_at": "2022-04-05T13:05:24-04:00"
        |    }""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = CommentReader.serialize(node)
    assert(
      JsonUtils.toJson(
        record,
        false
      ) == """[118373535,134645308,241253187,"Soleone","Hi author, I really _like_ what you're doing there.","<p>Hi author, I really <em>like</em> what you're doing there.</p>",1649178324000,"sole@one.de","127.0.0.1",1649178324000,"published",1649178324000,"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_4; en-us) AppleWebKit/525.18 (KHTML, like Gecko) Version/3.1.2 Safari/525.20.1"]"""
    )
  }

  test("PageReader Serializer json") {
    val json =
      """    {
        |      "id": 108828309,
        |      "title": "Sample Page",
        |      "shop_id": 548380009,
        |      "handle": "sample",
        |      "body_html": "<p>this is a <strong>sample</strong> page.</p>",
        |      "author": "Dennis",
        |      "created_at": "2008-07-15T20:00:00-04:00",
        |      "updated_at": "2008-07-16T20:00:00-04:00",
        |      "published_at": null,
        |      "template_suffix": "123",
        |      "admin_graphql_api_id": "gid://shopify/OnlineStorePage/108828309"
        |    }""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = PageReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    assert(
      recordAsJson == """[108828309,"Dennis","<p>this is a <strong>sample</strong> page.</p>",1216166400000,"sample",null,null,548380009,"123","Sample Page",1216252800000,"gid://shopify/OnlineStorePage/108828309"]"""
    )
  }

  test("ThemeReader Serializer json") {
    val json =
      """    {
        |      "id": 828155753,
        |      "name": "Comfort",
        |      "created_at": "2022-04-05T13:17:47-04:00",
        |      "updated_at": "2022-04-05T13:17:47-04:00",
        |      "role": "main",
        |      "theme_store_id": 12345,
        |      "previewable": true,
        |      "processing": false,
        |      "admin_graphql_api_id": "gid://shopify/Theme/828155753"
        |    },""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = ThemeReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    assert(recordAsJson == "[828155753,1649179067000,\"Comfort\",true,false,\"main\",12345,1649179067000]")
  }

  test("AssetReader Serializer json") {
    val json =
      """{
        |      "key": "assets/bg-content.gif",
        |      "attachment": "R0lGODlhAQABAPABAP///wAAACH5Ow==\n",
        |      "public_url": "https://cdn.shopify.com/s/files/1/0005/4838/0009/t/1/assets/bg-content.gif?v=1649179242",
        |      "created_at": "2010-07-12T15:31:50-04:00",
        |      "updated_at": "2022-04-05T13:20:42-04:00",
        |      "content_type": "image/gif",
        |      "size": 134,
        |      "checksum": "7a5aab7934b2c80df50d061e70287507",
        |      "theme_id": 828155753,
        |      	"value": "<div id=\"page\">\n<h1>404 Page not found</h1>\n<p>We couldn't find the page you were looking for.</p>\n</div>"
        |    }""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = AssetReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    assert(
      recordAsJson == "[\"assets/bg-content.gif\",\"R0lGODlhAQABAPABAP///wAAACH5Ow==\\n\",\"7a5aab7934b2c80df50d061e70287507\",\"image/gif\",1278963110000,\"https://cdn.shopify.com/s/files/1/0005/4838/0009/t/1/assets/bg-content.gif?v=1649179242\",134.0,828155753,1649179242000,\"<div id=\\\"page\\\">\\n<h1>404 Page not found</h1>\\n<p>We couldn't find the page you were looking for.</p>\\n</div>\"]"
    )
  }

  test("ScriptTagReader Serializer json") {
    val json =
      """{
        |  "created_at": "2012-08-24T14:01:47-04:00",
        |  "event": "onload",
        |  "id": 596726825,
        |  "src": "https://js.example.org/foo.js",
        |  "display_scope": "online_store",
        |  "cache": true,
        |  "updated_at": "2012-08-24T14:01:47-04:00"
        |}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = ScriptTagReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    assert(
      recordAsJson == "[596726825,\"https://js.example.org/foo.js\",\"online_store\",\"onload\",1345831307000,true,1345831307000]"
    )
  }

  test("RedirectReader Serializer json") {
    val json =
      """    {
        |      "id": 304339089,
        |      "path": "/products.php",
        |      "target": "/products"
        |    }""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = RedirectReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    assert(
      recordAsJson == "[304339089,\"/products.php\",\"/products\"]"
    )
  }

  test("GiftCard Serializer json") {
    val json =
      """{
        |  "api_client_id": 431223487,
        |  "balance": 80.17,
        |  "code": "1234 4567 8901 2ABC",
        |  "created_at": "2008-12-31T19:00:00-05:00",
        |  "currency": "CAD",
        |  "customer_id": {
        |    "customer_id": 368407052327
        |  },
        |  "disabled_at": "2009-01-31T19:00:00-05:00",
        |  "expires_on": "2020-01-31",
        |  "id": 989034056,
        |  "initial_value": 100,
        |  "last_characters": "2ABC",
        |  "line_item_id": 241253183,
        |  "note": "A note",
        |  "order_id": 2412531834,
        |  "template_suffix": "birthday",
        |  "user_id": 2412531835,
        |  "updated_at": "2009-01-31T19:00:00-05:00"
        |}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = GiftCardReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    println(recordAsJson)
    assert(
      recordAsJson == "[989034056,431223487,80.17,\"1234 4567 8901 2ABC\",1230768000000,\"CAD\",\"{\\\"customer_id\\\":368407052327}\",1233446400000,1580428800000,100.0,\"2ABC\",241253183,\"A note\",2412531834,\"birthday\",2412531835,1233446400000]"
    )
  }

  test("Users Serializer json") {
    val json =
      """{
        |    "id": 548380009,
        |    "first_name": "John",
        |    "email": "j.smith@example.com",
        |    "url": "www.example.com",
        |    "im": null,
        |    "screen_name": null,
        |    "phone": null,
        |    "last_name": "Smith",
        |    "account_owner": true,
        |    "receive_announcements": 1,
        |    "bio": null,
        |    "permissions": [
        |      "applications"
        |    ],
        |    "locale": "en",
        |    "user_type": "regular",
        |    "admin_graphql_api_id": "gid://shopify/StaffMember/548380009",
        |    "tfa_enabled?": false
        |  }""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = UserReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    println(recordAsJson)
    assert(
      recordAsJson == "[548380009,true,null,\"j.smith@example.com\",\"John\",null,\"Smith\",\"[\\\"applications\\\"]\",null,1,null,\"www.example.com\",\"en\",\"regular\"]"
    )
  }

  test("Tender Transaction Serializer json") {
    val json =
      """{
        |  "id": 999225661,
        |  "order_id": 450789469,
        |  "amount": "10.00",
        |  "currency": "USD",
        |  "user_id": 106045196,
        |  "test": true,
        |  "processed_at": "2012-03-13T16:09:54-04:00",
        |  "remote_reference": "ch_1AtJu6CktlpKSclI4zjeQb2t",
        |  "payment_details": {
        |    "credit_card_number": "•••• •••• •••• 4242",
        |    "credit_card_company": "Visa"
        |  },
        |  "payment_method": "credit_card"
        |}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = TenderTransactionReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    println(recordAsJson)
    assert(
      recordAsJson == "[999225661,450789469,10.0,\"USD\",106045196,true,1331669394000,\"ch_1AtJu6CktlpKSclI4zjeQb2t\",\"{\\\"credit_card_number\\\":\\\"•••• •••• •••• 4242\\\",\\\"credit_card_company\\\":\\\"Visa\\\"}\",\"credit_card\"]"
    )
  }


  test("Order Serializer json") {
    val json =
      """		{
        |			"id": 4777716875491,
        |			"admin_graphql_api_id": "gid:\/\/shopify\/Order\/4777716875491",
        |			"app_id": 1354745,
        |			"browser_ip": null,
        |			"buyer_accepts_marketing": true,
        |			"cancel_reason": null,
        |			"cancelled_at": null,
        |			"cart_token": null,
        |			"checkout_id": 32745504407779,
        |			"checkout_token": "016710a43dc069d27d0a1b9467683ac3",
        |			"client_details": {
        |				"accept_language": null,
        |				"browser_height": null,
        |				"browser_ip": null,
        |				"browser_width": null,
        |				"session_hash": null,
        |				"user_agent": null
        |			},
        |			"closed_at": "2022-05-20T18:30:20+07:00",
        |			"confirmed": true,
        |			"contact_email": "meomeocf98@gmail.com",
        |			"created_at": "2022-05-20T18:29:59+07:00",
        |			"currency": "VND",
        |			"current_subtotal_price": "1000000",
        |			"current_subtotal_price_set": {
        |				"shop_money": {
        |					"amount": "1000000",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "1000000",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"current_total_discounts": "0",
        |			"current_total_discounts_set": {
        |				"shop_money": {
        |					"amount": "0",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "0",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"current_total_duties_set": null,
        |			"current_total_price": "1100000",
        |			"current_total_price_set": {
        |				"shop_money": {
        |					"amount": "1100000",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "1100000",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"current_total_tax": "100000",
        |			"current_total_tax_set": {
        |				"shop_money": {
        |					"amount": "100000",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "100000",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"customer_locale": "en",
        |			"device_id": null,
        |			"discount_codes": [],
        |			"email": "meomeocf98@gmail.com",
        |			"estimated_taxes": false,
        |			"financial_status": "paid",
        |			"fulfillment_status": "fulfilled",
        |			"gateway": "manual",
        |			"landing_site": null,
        |			"landing_site_ref": null,
        |			"location_id": null,
        |			"name": "#1004",
        |			"note": null,
        |			"note_attributes": [],
        |			"number": 4,
        |			"order_number": 1004,
        |			"order_status_url": "https:\/\/dev-datainsider.myshopify.com\/64641466595\/orders\/38e45874d19ce90ffee4dcc443cb098b\/authenticate?key=b04ff78936dd503866550ca96b0bb258",
        |			"original_total_duties_set": null,
        |			"payment_gateway_names": [
        |				"manual"
        |			],
        |			"phone": "+84966144938",
        |			"presentment_currency": "VND",
        |			"processed_at": "2022-05-20T18:29:59+07:00",
        |			"processing_method": "manual",
        |			"reference": null,
        |			"referring_site": null,
        |			"source_identifier": null,
        |			"source_name": "shopify_draft_order",
        |			"source_url": null,
        |			"subtotal_price": "1000000",
        |			"subtotal_price_set": {
        |				"shop_money": {
        |					"amount": "1000000",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "1000000",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"tags": "vip",
        |			"tax_lines": [
        |				{
        |					"price": "100000",
        |					"rate": 0.1,
        |					"title": "VAT",
        |					"price_set": {
        |						"shop_money": {
        |							"amount": "100000",
        |							"currency_code": "VND"
        |						},
        |						"presentment_money": {
        |							"amount": "100000",
        |							"currency_code": "VND"
        |						}
        |					},
        |					"channel_liable": false
        |				}
        |			],
        |			"taxes_included": false,
        |			"test": false,
        |			"token": "38e45874d19ce90ffee4dcc443cb098b",
        |			"total_discounts": "0",
        |			"total_discounts_set": {
        |				"shop_money": {
        |					"amount": "0",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "0",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"total_line_items_price": "1000000",
        |			"total_line_items_price_set": {
        |				"shop_money": {
        |					"amount": "1000000",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "1000000",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"total_outstanding": "0",
        |			"total_price": "1100000",
        |			"total_price_set": {
        |				"shop_money": {
        |					"amount": "1100000",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "1100000",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"total_price_usd": "47.51",
        |			"total_shipping_price_set": {
        |				"shop_money": {
        |					"amount": "0",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "0",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"total_tax": "100000",
        |			"total_tax_set": {
        |				"shop_money": {
        |					"amount": "100000",
        |					"currency_code": "VND"
        |				},
        |				"presentment_money": {
        |					"amount": "100000",
        |					"currency_code": "VND"
        |				}
        |			},
        |			"total_tip_received": "0",
        |			"total_weight": 0,
        |			"updated_at": "2022-05-20T18:30:36+07:00",
        |			"user_id": 84347683043,
        |			"billing_address": {
        |				"first_name": "Lam",
        |				"address1": "43 Đường Nguyễn Chí Thanh",
        |				"phone": "+84355121214",
        |				"city": "HCM",
        |				"zip": "71000",
        |				"province": null,
        |				"country": "Vietnam",
        |				"last_name": "Lan",
        |				"address2": "partment 1",
        |				"company": "4pet",
        |				"latitude": null,
        |				"longitude": null,
        |				"name": "Lam Lan",
        |				"country_code": "VN",
        |				"province_code": null
        |			},
        |			"customer": {
        |				"id": 6240252330211,
        |				"email": "meomeocf98@gmail.com",
        |				"accepts_marketing": true,
        |				"created_at": "2022-05-20T18:28:25+07:00",
        |				"updated_at": "2022-05-26T17:44:50+07:00",
        |				"first_name": "Lam",
        |				"last_name": "Lan",
        |				"orders_count": 1,
        |				"state": "disabled",
        |				"total_spent": "1100000.00",
        |				"last_order_id": 4777716875491,
        |				"note": "Meos",
        |				"verified_email": true,
        |				"multipass_identifier": null,
        |				"tax_exempt": false,
        |				"phone": "+84966144938",
        |				"tags": "??, alo",
        |				"last_order_name": "#1004",
        |				"currency": "VND",
        |				"accepts_marketing_updated_at": "2022-05-20T18:28:25+07:00",
        |				"marketing_opt_in_level": "single_opt_in",
        |				"tax_exemptions": [],
        |				"email_marketing_consent": {
        |					"state": "subscribed",
        |					"opt_in_level": "single_opt_in",
        |					"consent_updated_at": null
        |				},
        |				"sms_marketing_consent": {
        |					"state": "subscribed",
        |					"opt_in_level": "single_opt_in",
        |					"consent_updated_at": "2022-05-20T18:28:26+07:00",
        |					"consent_collected_from": "SHOPIFY"
        |				},
        |				"admin_graphql_api_id": "gid:\/\/shopify\/Customer\/6240252330211",
        |				"default_address": {
        |					"id": 7709556932835,
        |					"customer_id": 6240252330211,
        |					"first_name": "Lam",
        |					"last_name": "Lan",
        |					"company": "4pet",
        |					"address1": "43 Đường Nguyễn Chí Thanh",
        |					"address2": "partment 1",
        |					"city": "HCM",
        |					"province": "",
        |					"country": "Vietnam",
        |					"zip": "71000",
        |					"phone": "+84355121214",
        |					"name": "Lam Lan",
        |					"province_code": null,
        |					"country_code": "VN",
        |					"country_name": "Vietnam",
        |					"default": true
        |				}
        |			},
        |			"discount_applications": [],
        |			"fulfillments": [
        |				{
        |					"id": 4275562971363,
        |					"admin_graphql_api_id": "gid:\/\/shopify\/Fulfillment\/4275562971363",
        |					"created_at": "2022-05-20T18:30:19+07:00",
        |					"location_id": 69243011299,
        |					"name": "#1004.1",
        |					"order_id": 4777716875491,
        |					"origin_address": {},
        |					"receipt": {},
        |					"service": "manual",
        |					"shipment_status": null,
        |					"status": "success",
        |					"tracking_company": "Other",
        |					"tracking_number": "Dongnai",
        |					"tracking_numbers": [
        |						"Dongnai"
        |					],
        |					"tracking_url": null,
        |					"tracking_urls": [],
        |					"updated_at": "2022-05-20T18:30:28+07:00",
        |					"line_items": [
        |						{
        |							"id": 12175036776675,
        |							"admin_graphql_api_id": "gid:\/\/shopify\/LineItem\/12175036776675",
        |							"destination_location": {
        |								"id": 3486846451939,
        |								"country_code": "VN",
        |								"province_code": "",
        |								"name": "Lam Lan",
        |								"address1": "43 Đường Nguyễn Chí Thanh",
        |								"address2": "partment 1",
        |								"city": "HCM",
        |								"zip": "71000"
        |							},
        |							"fulfillable_quantity": 0,
        |							"fulfillment_service": "manual",
        |							"fulfillment_status": "fulfilled",
        |							"gift_card": false,
        |							"grams": 0,
        |							"name": "Marvel UT Áo Thun Ngắn Tay",
        |							"origin_location": {
        |								"id": 3486846419171,
        |								"country_code": "VN",
        |								"province_code": "",
        |								"name": "dev_datainsider",
        |								"address1": "40\/7 Nguyen Gian Thanh",
        |								"address2": "",
        |								"city": "District 10",
        |								"zip": "710000"
        |							},
        |							"price": "250000",
        |							"price_set": {
        |								"shop_money": {
        |									"amount": "250000",
        |									"currency_code": "VND"
        |								},
        |								"presentment_money": {
        |									"amount": "250000",
        |									"currency_code": "VND"
        |								}
        |							},
        |							"product_exists": true,
        |							"product_id": 7690516070627,
        |							"properties": [],
        |							"quantity": 4,
        |							"requires_shipping": true,
        |							"sku": "1",
        |							"taxable": true,
        |							"title": "Marvel UT Áo Thun Ngắn Tay",
        |							"total_discount": "0",
        |							"total_discount_set": {
        |								"shop_money": {
        |									"amount": "0",
        |									"currency_code": "VND"
        |								},
        |								"presentment_money": {
        |									"amount": "0",
        |									"currency_code": "VND"
        |								}
        |							},
        |							"variant_id": 42883373596899,
        |							"variant_inventory_management": "shopify",
        |							"variant_title": "",
        |							"vendor": "dev_datainsider",
        |							"tax_lines": [
        |								{
        |									"channel_liable": false,
        |									"price": "100000",
        |									"price_set": {
        |										"shop_money": {
        |											"amount": "100000",
        |											"currency_code": "VND"
        |										},
        |										"presentment_money": {
        |											"amount": "100000",
        |											"currency_code": "VND"
        |										}
        |									},
        |									"rate": 0.1,
        |									"title": "VAT"
        |								}
        |							],
        |							"duties": [],
        |							"discount_allocations": []
        |						}
        |					]
        |				}
        |			],
        |			"line_items": [
        |				{
        |					"id": 12175036776675,
        |					"admin_graphql_api_id": "gid:\/\/shopify\/LineItem\/12175036776675",
        |					"destination_location": {
        |						"id": 3486846451939,
        |						"country_code": "VN",
        |						"province_code": "",
        |						"name": "Lam Lan",
        |						"address1": "43 Đường Nguyễn Chí Thanh",
        |						"address2": "partment 1",
        |						"city": "HCM",
        |						"zip": "71000"
        |					},
        |					"fulfillable_quantity": 0,
        |					"fulfillment_service": "manual",
        |					"fulfillment_status": "fulfilled",
        |					"gift_card": false,
        |					"grams": 0,
        |					"name": "Marvel UT Áo Thun Ngắn Tay",
        |					"origin_location": {
        |						"id": 3486846419171,
        |						"country_code": "VN",
        |						"province_code": "",
        |						"name": "dev_datainsider",
        |						"address1": "40\/7 Nguyen Gian Thanh",
        |						"address2": "",
        |						"city": "District 10",
        |						"zip": "710000"
        |					},
        |					"price": "250000",
        |					"price_set": {
        |						"shop_money": {
        |							"amount": "250000",
        |							"currency_code": "VND"
        |						},
        |						"presentment_money": {
        |							"amount": "250000",
        |							"currency_code": "VND"
        |						}
        |					},
        |					"product_exists": true,
        |					"product_id": 7690516070627,
        |					"properties": [],
        |					"quantity": 4,
        |					"requires_shipping": true,
        |					"sku": "1",
        |					"taxable": true,
        |					"title": "Marvel UT Áo Thun Ngắn Tay",
        |					"total_discount": "0",
        |					"total_discount_set": {
        |						"shop_money": {
        |							"amount": "0",
        |							"currency_code": "VND"
        |						},
        |						"presentment_money": {
        |							"amount": "0",
        |							"currency_code": "VND"
        |						}
        |					},
        |					"variant_id": 42883373596899,
        |					"variant_inventory_management": "shopify",
        |					"variant_title": "",
        |					"vendor": "dev_datainsider",
        |					"tax_lines": [
        |						{
        |							"channel_liable": false,
        |							"price": "100000",
        |							"price_set": {
        |								"shop_money": {
        |									"amount": "100000",
        |									"currency_code": "VND"
        |								},
        |								"presentment_money": {
        |									"amount": "100000",
        |									"currency_code": "VND"
        |								}
        |							},
        |							"rate": 0.1,
        |							"title": "VAT"
        |						}
        |					],
        |					"duties": [],
        |					"discount_allocations": []
        |				}
        |			],
        |			"payment_terms": null,
        |			"refunds": [],
        |			"shipping_address": {
        |				"first_name": "Lam",
        |				"address1": "43 Đường Nguyễn Chí Thanh",
        |				"phone": "+84355121214",
        |				"city": "HCM",
        |				"zip": "71000",
        |				"province": null,
        |				"country": "Vietnam",
        |				"last_name": "Lan",
        |				"address2": "partment 1",
        |				"company": "4pet",
        |				"latitude": null,
        |				"longitude": null,
        |				"name": "Lam Lan",
        |				"country_code": "VN",
        |				"province_code": null
        |			},
        |			"shipping_lines": []
        |		}""".stripMargin

    val node = JsonUtils.fromJson[JsonNode](json)

    val record = OrderReader.serialize(node)
    val recordAsJson = JsonUtils.toJson(record, false)
    println(recordAsJson)
    assert(
      recordAsJson == """[4777716875491,1354745,"#1004","{\"first_name\":\"Lam\",\"address1\":\"43 Đường Nguyễn Chí Thanh\",\"phone\":\"+84355121214\",\"city\":\"HCM\",\"zip\":\"71000\",\"province\":null,\"country\":\"Vietnam\",\"last_name\":\"Lan\",\"address2\":\"partment 1\",\"company\":\"4pet\",\"latitude\":null,\"longitude\":null,\"name\":\"Lam Lan\",\"country_code\":\"VN\",\"province_code\":null}",null,true,null,null,null,"016710a43dc069d27d0a1b9467683ac3","{\"accept_language\":null,\"browser_height\":null,\"browser_ip\":null,\"browser_width\":null,\"session_hash\":null,\"user_agent\":null}",1653046220000,1653046199000,"VND",0.0,"{\"shop_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"}}",null,1100000.0,"{\"shop_money\":{\"amount\":\"1100000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"1100000\",\"currency_code\":\"VND\"}}",1000000.0,"{\"shop_money\":{\"amount\":\"1000000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"1000000\",\"currency_code\":\"VND\"}}","100000","{\"shop_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"}}",6240252330211,"en","[]","[]","meomeocf98@gmail.com",false,"paid","[{\"id\":4275562971363,\"admin_graphql_api_id\":\"gid://shopify/Fulfillment/4275562971363\",\"created_at\":\"2022-05-20T18:30:19+07:00\",\"location_id\":69243011299,\"name\":\"#1004.1\",\"order_id\":4777716875491,\"origin_address\":{},\"receipt\":{},\"service\":\"manual\",\"shipment_status\":null,\"status\":\"success\",\"tracking_company\":\"Other\",\"tracking_number\":\"Dongnai\",\"tracking_numbers\":[\"Dongnai\"],\"tracking_url\":null,\"tracking_urls\":[],\"updated_at\":\"2022-05-20T18:30:28+07:00\",\"line_items\":[{\"id\":12175036776675,\"admin_graphql_api_id\":\"gid://shopify/LineItem/12175036776675\",\"destination_location\":{\"id\":3486846451939,\"country_code\":\"VN\",\"province_code\":\"\",\"name\":\"Lam Lan\",\"address1\":\"43 Đường Nguyễn Chí Thanh\",\"address2\":\"partment 1\",\"city\":\"HCM\",\"zip\":\"71000\"},\"fulfillable_quantity\":0,\"fulfillment_service\":\"manual\",\"fulfillment_status\":\"fulfilled\",\"gift_card\":false,\"grams\":0,\"name\":\"Marvel UT Áo Thun Ngắn Tay\",\"origin_location\":{\"id\":3486846419171,\"country_code\":\"VN\",\"province_code\":\"\",\"name\":\"dev_datainsider\",\"address1\":\"40/7 Nguyen Gian Thanh\",\"address2\":\"\",\"city\":\"District 10\",\"zip\":\"710000\"},\"price\":\"250000\",\"price_set\":{\"shop_money\":{\"amount\":\"250000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"250000\",\"currency_code\":\"VND\"}},\"product_exists\":true,\"product_id\":7690516070627,\"properties\":[],\"quantity\":4,\"requires_shipping\":true,\"sku\":\"1\",\"taxable\":true,\"title\":\"Marvel UT Áo Thun Ngắn Tay\",\"total_discount\":\"0\",\"total_discount_set\":{\"shop_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"}},\"variant_id\":42883373596899,\"variant_inventory_management\":\"shopify\",\"variant_title\":\"\",\"vendor\":\"dev_datainsider\",\"tax_lines\":[{\"channel_liable\":false,\"price\":\"100000\",\"price_set\":{\"shop_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"}},\"rate\":0.1,\"title\":\"VAT\"}],\"duties\":[],\"discount_allocations\":[]}]}]","fulfilled","manual",null,"[{\"id\":12175036776675,\"admin_graphql_api_id\":\"gid://shopify/LineItem/12175036776675\",\"destination_location\":{\"id\":3486846451939,\"country_code\":\"VN\",\"province_code\":\"\",\"name\":\"Lam Lan\",\"address1\":\"43 Đường Nguyễn Chí Thanh\",\"address2\":\"partment 1\",\"city\":\"HCM\",\"zip\":\"71000\"},\"fulfillable_quantity\":0,\"fulfillment_service\":\"manual\",\"fulfillment_status\":\"fulfilled\",\"gift_card\":false,\"grams\":0,\"name\":\"Marvel UT Áo Thun Ngắn Tay\",\"origin_location\":{\"id\":3486846419171,\"country_code\":\"VN\",\"province_code\":\"\",\"name\":\"dev_datainsider\",\"address1\":\"40/7 Nguyen Gian Thanh\",\"address2\":\"\",\"city\":\"District 10\",\"zip\":\"710000\"},\"price\":\"250000\",\"price_set\":{\"shop_money\":{\"amount\":\"250000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"250000\",\"currency_code\":\"VND\"}},\"product_exists\":true,\"product_id\":7690516070627,\"properties\":[],\"quantity\":4,\"requires_shipping\":true,\"sku\":\"1\",\"taxable\":true,\"title\":\"Marvel UT Áo Thun Ngắn Tay\",\"total_discount\":\"0\",\"total_discount_set\":{\"shop_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"}},\"variant_id\":42883373596899,\"variant_inventory_management\":\"shopify\",\"variant_title\":\"\",\"vendor\":\"dev_datainsider\",\"tax_lines\":[{\"channel_liable\":false,\"price\":\"100000\",\"price_set\":{\"shop_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"}},\"rate\":0.1,\"title\":\"VAT\"}],\"duties\":[],\"discount_allocations\":[]}]",null,null,"[]",4,1004,null,null,null,"[\"manual\"]","+84966144938","VND",1653046199000,"manual",null,"[]","{\"first_name\":\"Lam\",\"address1\":\"43 Đường Nguyễn Chí Thanh\",\"phone\":\"+84355121214\",\"city\":\"HCM\",\"zip\":\"71000\",\"province\":null,\"country\":\"Vietnam\",\"last_name\":\"Lan\",\"address2\":\"partment 1\",\"company\":\"4pet\",\"latitude\":null,\"longitude\":null,\"name\":\"Lam Lan\",\"country_code\":\"VN\",\"province_code\":null}","[]","shopify_draft_order",null,null,1000000.0,"{\"shop_money\":{\"amount\":\"1000000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"1000000\",\"currency_code\":\"VND\"}}","vip","[{\"price\":\"100000\",\"rate\":0.1,\"title\":\"VAT\",\"price_set\":{\"shop_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"100000\",\"currency_code\":\"VND\"}},\"channel_liable\":false}]",false,false,"38e45874d19ce90ffee4dcc443cb098b",0.0,"{\"shop_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"}}",1000000.0,"{\"shop_money\":{\"amount\":\"1000000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"1000000\",\"currency_code\":\"VND\"}}",0.0,1100000.0,"{\"shop_money\":{\"amount\":\"1100000\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"1100000\",\"currency_code\":\"VND\"}}","{\"shop_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"},\"presentment_money\":{\"amount\":\"0\",\"currency_code\":\"VND\"}}",100000.0,0.0,0.0,1653046236000,84347683043,"https://dev-datainsider.myshopify.com/64641466595/orders/38e45874d19ce90ffee4dcc443cb098b/authenticate?key=b04ff78936dd503866550ca96b0bb258"]"""    )
  }
}
