## Data Cook

- Yêu cầu 
  - `clickhouse-client` version `21.7.3.14`
  - `zip`
- 👉 [**Offline docs**](./docs/data_cook/README.md)
- ♥ [**Online docs**](https://pale-cousin-401.notion.site/Data-Cook-API-documents-a72d6042a106464d80b70d28ccb01a32)

## Ingest data

- Method: `POST`
- Endpoint: `/ingestion`
- Headers:
    + DI-SERVICE-KEY: Your service key to ingest data

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo POST \
  --url http://localhost:8489/ingestion \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
	"db_name": "shopping",
	"tbl_name": "pucharsed",
	"records": [
		{
			"product_id": "6",
			"purchased_at": "2020-01-12 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 5570000
		},
		{
			"product_id": "3",
			"purchased_at": "2020-01-09 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 1570000
		},
		{
			"product_id": "45",
			"purchased_at": "2020-01-11 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 150000,
			"color": "Red"
		},
		{
			"product_id": "56",
			"purchased_at": "2020-01-11 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 150000,
			"color": "Yello",
			"is_discount": true,
			"is_gift": true,
			"weight": 0.5
		},
		{
			"product_id": "890",
			"purchased_at": "2020-01-11 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 150000,
			"color": "Yello",
			"is_discount": true,
			"shipping": true
		}
	]
}'
```

- Example response:

```json5
{
  "total_records": 5,
  "total_invalid_records": 0,
  "total_invalid_fields": 0,
  "total_skipped_records": 0,
  "total_inserted_records": 5,
  "total_failed_records": 0
}
```

## Delete data

- Method: `DELETE`
- Endpoint: `/ingestion/:db/:tbl`
- Headers:
    + DI-SERVICE-KEY: Your service key to ingest/delete data

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo DELETE \
  --url http://localhost:8489/ingestion/shopping/purchased \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678'
```

- Example response:

```json5
true
```

## Schema Service

### List databases

- Method: `GET`
- Endpoint: `/databases`

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo GET \
  --url dev.datainsider.co/api/databases \
  --header 'Content-Type: application/json'
```

-Example response:

```json
[
  {
    "name": "analytics_1",
    "organization_id": 1,
    "display_name": "Analytics"
  },
  {
    "name": "analytics_report_1",
    "organization_id": 1,
    "display_name": "Analytics Report"
  },
  {
    "name": "org1_SalesRecords",
    "organization_id": 1,
    "display_name": "Salesrecords"
  }
]
```

### Get database detail

- Method: `GET`
- Endpoint: `/databases/<db_name>`

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo GET \
  --url dev.datainsider.co/api/databases/org1_csv_db \
  --header 'Content-Type: application/json'
```

-Example response:

```json
{
  "name": "org1_csv_db",
  "organization_id": 1,
  "display_name": "Csv Db",
  "tables": [
    {
      "name": "baby_names",
      "db_name": "csv_db",
      "organization_id": 1,
      "display_name": "Baby Names",
      "conditions": [
        {
          "class_name": "int32",
          "name": "Year",
          "display_name": "Year",
          "is_nullable": true
        },
        {
          "class_name": "string",
          "name": "FirstName",
          "display_name": "FirstName",
          "is_nullable": true
        },
        {
          "class_name": "string",
          "name": "County",
          "display_name": "County",
          "is_nullable": true
        },
        {
          "class_name": "string",
          "name": "Sex",
          "display_name": "Sex",
          "is_nullable": true
        },
        {
          "class_name": "int32",
          "name": "Count",
          "display_name": "Count",
          "is_nullable": true
        }
      ],
      "primary_keys": [],
      "partition_by": [],
      "order_bys": []
    }
  ]
}
```

### Create database

- Method: `POST`
- Endpoint: `/databases?admin_secret_key=12345678`
- Headers:
    + DI-SERVICE-KEY: 12345678

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo GET \
  --url dev.datainsider.co/api/databases?admin_secret_key=12345678 \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
	"name": "csv_db",
	"display_name": "Csv Database"
}'
```

- Example response:

```json
{
  "name": "org1_csv_db",
  "organization_id": 1,
  "display_name": "Csv Database",
  "tables": []
}
```

### Delete database

- Method: `DELETE`
- Endpoint: `/databases/<db_name>?admin_secret_key=12345678`
- Headers:
    + DI-SERVICE-KEY: 12345678

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo GET \
  --url dev.datainsider.co/api/databases/org1_csv_db?admin_secret_key=12345678 \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
	"organization_id": 1
}'
```

### Create table

- Method: `POST`
- Endpoint: `/databases/<db_name>/tables?admin_secret_key=12345678`
- Headers:
    + DI-SERVICE-KEY: 12345678

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo GET \
  --url dev.datainsider.co/api/databases?admin_secret_key=12345678 \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
	"organization_id": 1,
	"tbl_name": "baby_names",
	"conditions": [
	  {
        "class_name": "int32",
        "name": "Year",
        "display_name": "Year",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "FirstName",
        "display_name": "FirstName",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "County",
        "display_name": "County",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "Sex",
        "display_name": "Sex",
        "is_nullable": true
      },
      {
        "class_name": "int32",
        "name": "Count",
        "display_name": "Count",
        "is_nullable": true
      }
	]
}'
```

- Example response:

```json
{
  "name": "baby_names",
  "db_name": "org1_csv_db",
  "organization_id": 1,
  "display_name": "baby_names",
  "conditions": [
    {
      "class_name": "int32",
      "name": "Year",
      "display_name": "Year",
      "is_nullable": true
    },
    {
      "class_name": "string",
      "name": "FirstName",
      "display_name": "FirstName",
      "is_nullable": true
    },
    {
      "class_name": "string",
      "name": "County",
      "display_name": "County",
      "is_nullable": true
    },
    {
      "class_name": "string",
      "name": "Sex",
      "display_name": "Sex",
      "is_nullable": true
    },
    {
      "class_name": "int32",
      "name": "Count",
      "display_name": "Count",
      "is_nullable": true
    }
  ],
  "primary_keys": [],
  "partition_by": [],
  "order_bys": []
}
```

## Csv Upload service

### Fetch

- Method: `GET`
- Endpoint: `/ingestion/csv/<csv_id>`
- Headers:
    + DI-SERVICE-KEY: 12345678

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo GET \
  --url dev.datainsider.co/api/ingestion/csv/baby_names.csv \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' 
```

- Example response:

```json
{
  "id": "baby_names.csv",
  "batch_size": 10,
  "schema": {
    "name": "baby_names",
    "db_name": "org1_csv_db",
    "organization_id": 1,
    "display_name": "Baby Names",
    "conditions": [
      {
        "class_name": "int32",
        "name": "Year",
        "display_name": "Year",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "FirstName",
        "display_name": "FirstName",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "County",
        "display_name": "County",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "Sex",
        "display_name": "Sex",
        "is_nullable": true
      },
      {
        "class_name": "int32",
        "name": "Count",
        "display_name": "Count",
        "is_nullable": true
      }
    ],
    "primary_keys": [],
    "partition_by": [],
    "order_bys": []
  },
  "csv_setting": {
    "include_header": false,
    "delimiter": ",",
    "quote": "",
    "add_batch_info": false
  },
  "last_success_batch_number": 0,
  "error_batch_numbers": [],
  "is_done": true
}
```

### Preview csv

- Method: `POST`
- Endpoint: `/ingestion/csv/preview`
- Headers:
    + DI-SERVICE-KEY: 12345678

* Note: field schema la field optional, nếu không gửi kèm lên thì sẽ hiểu là detect default schema (chủ yếu là để lấy
  thông tin của conditions), còn nếu được gửi kèm lên thì sẽ được hiểu là setting của user như là đổi tên column, đổi data
  type của column...

- Example Curl's tableFromQueryInfo:

```shell
curl --tableFromQueryInfo POST \
  --url dev.datainsider.co/api/ingestion/csv/preview \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
  "sample" : "Year,FirstName,County,Sex,Count\n2007,ZOEY,KINGS,F,11\n2007,ZOEY,SUFFOLK,F,6\n2007,ZOEY,MONROE,F,6\n2007,ZOEY,ERIE,F,9\n2007,ZOE,ULSTER,F,5\n2007,ZOE,WESTCHESTER,F,24\n2007,ZOE,BRONX,F,13\n2007,ZOE,NEW YORK,F,55\n2007,ZOE,NASSAU,F,15\n2007,ZOE,ERIE,F,6",
  "schema": {
    "name": "",
    "db_name": "",
    "organization_id": 1,
    "display_name": "",
    "conditions": [
      {
        "class_name": "int32",
        "name": "Year",
        "display_name": "Year",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "FirstName",
        "display_name": "FirstName",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "County",
        "display_name": "County",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "Sex",
        "display_name": "Sex",
        "is_nullable": true
      },
      {
        "class_name": "int32",
        "name": "Count",
        "display_name": "Count",
        "is_nullable": true
      }
    ]
  },
  "csv_setting" : {
    "include_header" : true,
    "delimiter" : ",",
    "quote" : "",
    "add_batch_info" : false
  }
}'
```

- Example response:

```json5
{
  "schema": {
    "name": "",
    "db_name": "",
    "organization_id": 1,
    "display_name": "",
    "conditions": [
      {
        "class_name": "int32",
        "name": "Year",
        "display_name": "Year",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "FirstName",
        "display_name": "FirstName",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "County",
        "display_name": "County",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "Sex",
        "display_name": "Sex",
        "is_nullable": true
      },
      {
        "class_name": "int32",
        "name": "Count",
        "display_name": "Count",
        "is_nullable": true
      }
    ],
    "primary_keys": [],
    "partition_by": [],
    "order_bys": []
  },
  "csv_setting": {
    "include_header": true,
    "delimiter": ",",
    "quote": "",
    "add_batch_info": false
  },
  "records": [
    [
      2007,
      "ZOEY",
      "KINGS",
      "F",
      11
    ],
    [
      2007,
      "ZOEY",
      "SUFFOLK",
      "F",
      6
    ],
    [
      2007,
      "ZOEY",
      "MONROE",
      "F",
      6
    ],
    [
      2007,
      "ZOEY",
      "ERIE",
      "F",
      9
    ],
    [
      2007,
      "ZOE",
      "ULSTER",
      "F",
      5
    ],
    [
      2007,
      "ZOE",
      "WESTCHESTER",
      "F",
      24
    ],
    [
      2007,
      "ZOE",
      "BRONX",
      "F",
      13
    ],
    [
      2007,
      "ZOE",
      "NEW YORK",
      "F",
      55
    ],
    [
      2007,
      "ZOE",
      "NASSAU",
      "F",
      15
    ],
    [
      2007,
      "ZOE",
      "ERIE",
      "F",
      6
    ]
  ]
}
```

### register csv file to server

- Method: `POST`
- Endpoint: `/ingestion/csv/register`
- Headers:
    + DI-SERVICE-KEY: 12345678

- example tableFromQueryInfo:

```shell
curl --tableFromQueryInfo POST \
  --url dev.datainsider.co/api/ingestion/csv/register \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
  "file_name" : "baby_names.csv",
  "batch_size" : 10,
  "schema": {
    "name": "baby_names",
    "db_name": "org1_csv_db",
    "organization_id": 1,
    "display_name": "Baby Names",
    "conditions": [
      {
        "class_name": "int32",
        "name": "Year",
        "display_name": "Year",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "FirstName",
        "display_name": "FirstName",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "County",
        "display_name": "County",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "Sex",
        "display_name": "Sex",
        "is_nullable": true
      },
      {
        "class_name": "int32",
        "name": "Count",
        "display_name": "Count",
        "is_nullable": true
      }
    ],
    "primary_keys": [],
    "partition_by": [],
    "order_bys": []
  },
  "csv_setting" : {
    "include_header" : false,
    "delimiter" : ",",
    "quote" : "",
    "add_batch_info" : false
  }
}'
```

- example response

```json
{
  "id": "baby_names.csv",
  "batch_size": 10,
  "schema": {
    "name": "baby_names",
    "db_name": "csv_db",
    "organization_id": 1,
    "display_name": "Baby Names",
    "conditions": [
      {
        "class_name": "int32",
        "name": "Year",
        "display_name": "Year",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "FirstName",
        "display_name": "FirstName",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "County",
        "display_name": "County",
        "is_nullable": true
      },
      {
        "class_name": "string",
        "name": "Sex",
        "display_name": "Sex",
        "is_nullable": true
      },
      {
        "class_name": "int32",
        "name": "Count",
        "display_name": "Count",
        "is_nullable": true
      }
    ],
    "primary_keys": [],
    "partition_by": [],
    "order_bys": []
  },
  "csv_setting": {
    "include_header": false,
    "delimiter": ",",
    "quote": "",
    "add_batch_info": false
  },
  "last_success_batch_number": 0,
  "error_batch_numbers": [],
  "is_done": false
}
```

### upload csv data

- Method: `POST`
- Endpoint: `/ingestion/csv/upload`
- Headers:
    + DI-SERVICE-KEY: 12345678

- example tableFromQueryInfo:

```shell
curl --tableFromQueryInfo POST \
  --url dev.datainsider.co/api/ingestion/csv/upload \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
  "csv_id" : "baby_names.csv",
  "batch_number" : 0,
  "data" : "2007,ZOEY,KINGS,F,11\n2007,ZOEY,SUFFOLK,F,6\n2007,ZOEY,MONROE,F,6\n2007,ZOEY,ERIE,F,9\n2007,ZOE,ULSTER,F,5\n2007,ZOE,WESTCHESTER,F,24\n2007,ZOE,BRONX,F,13\n2007,ZOE,NEW YORK,F,55\n2007,ZOE,NASSAU,F,15\n2007,ZOE,ERIE,F,6",
  "is_end" : true
}'
```

- example response

```json
{
  "csv_id": "baby_names.csv",
  "succeed": true,
  "batch_number": 0,
  "row_inserted": 10
}
```

# Tracking API

## Batch tracking

Ingest tracking event to specific tables, a tableFromQueryInfo can contain multiple events

An event will be ingested to a table with table name is name of event, and table fields are event's properties.

Tracking tables are located in `analytics` database.

- Method: `POST`
- Endpoint: `/tracking/events/track`

- example tableFromQueryInfo:

```shell
curl --tableFromQueryInfo POST \
  --url dev.datainsider.co/api/tracking/events/track \
  --header 'Content-Type: application/json' \
  --data '{
   "tracking_api_key":"c2c09332-14a1-4eb1-8964-2d85b2a561c8",
   "events":[
      {
         "name":"purchase",
         "properties":{
            "card_number": "1123123-123123-1232135",
            "order_id": "123123",
            "user_id": "ng-van-a-1999",
            "user_device":"iphone xs",
            "item": "mac pro 2020",
            "total_price": "1999",
            "created_time": "1627379100000"
         }
      },
      {
         "name":"purchase",
         "properties":{
            "card_number": "1123123-123123-1232135",
            "order_id": "123123",
            "user_id": "ng-van-a-1999",
            "user_device":"iphone xs",
            "item": "ipad pro 2020",
            "total_price": "999",
            "created_time": "1627379110000"
         }
      },
      {
         "name":"view_products",
         "properties":{
            "user_id": "ng-van-a-1999",
            "start_time": "1627379101263",
            "end_time": "1627379200000",
            "total_product_views": "123",
            "is_checkout_out": true
         }
      }
   ]
}'
```

- example response

```json
{
  "success": true
}
```
