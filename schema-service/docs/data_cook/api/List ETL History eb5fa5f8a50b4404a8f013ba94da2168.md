# List ETL History

### Path

```latex
POST: /data_cook/history
```

### request

```scala
/**
  * request for list etls
  * @param keyword list etl by keyword, if keyword is empty string, return full list etls
  * @param sorts sort etls by field name
  * @param from pagination from
  * @param size item size
  * @param request
  */
case class ListEtlJobsRequest(
    keyword: String = "",
    sorts: Array[Sort] = Array.empty,
    from: Int = 0,
    size: Int = 1000,
    @Inject request: Request = null
) extends LoggedInRequest
    with PageRequest
    with SortRequest
```

### response

```scala
case class PageResult[EtlJobHistoryResponse](
														total: Long,
													 data: Seq[EtlJobHistoryResponse])

/**
  * Full history of etl job
  * @param id id of history
  * @param etlJobId id of etl
  * @param lastSyncTime last sync time of job in milliseconds
  * @param totalRunningTime total sync time of job in milliseconds
  * @param syncStatus current status of job
  * @param totalRowsInserted total synced
  * @param message message of job
  * @param etlInfo full info of etl
  */
case class EtlJobHistoryResponse(
    id: JobHistoryId,
    etlJobId: EtlJobId,
    lastSyncTime: Long,
    totalRunningTime: Int,
    @JsonScalaEnumeration(classOf[JobStatusRef]) syncStatus: JobStatus,
    totalRowsInserted: Int,
    message: String = "",
    etlInfo: Option[EtlJobResponse] = None
)
```

### Sample:

```json
HTTP POST /data_cook/history
request:
{
  "keyword" : "",
  "sorts" : [ ],
  "from" : 0,
  "size" : 100
}
```

```json
{
  "total" : 10,
  "data" : [
    {
      "id" : 1,
      "etl_job_id" : 2,
      "last_sync_time" : 1632735838491,
      "total_running_time" : 150,
      "sync_status" : "Synced",
      "total_rows_inserted" : 150,
      "message" : "",
      "etl_info" : {
        "id" : 1,
        "display_name" : "ETL name 1",
        "operators" : [
          {
            "class_name" : "join_operator",
            "join_configs" : [
              {
                "left_operator" : {
                  "class_name" : "get_data_operator",
                  "table_schema" : {
                    "name" : "animal",
                    "db_name" : "db_testing",
                    "organization_id" : 1212,
                    "display_name" : "Table For Testing",
                    "columns" : [
                      {
                        "class_name" : "string",
                        "name" : "gender",
                        "display_name" : "Gender",
                        "description" : "Hola",
                        "default_value" : "Female",
                        "is_nullable" : true
                      },
                      {
                        "class_name" : "date",
                        "name" : "birth_day",
                        "display_name" : "Birth day",
                        "description" : "Birth day of animal",
                        "input_formats" : [ ],
                        "default_value" : 1632735838402,
                        "is_nullable" : true
                      }
                    ],
                    "primary_keys" : [ ],
                    "partition_by" : [ ],
                    "order_bys" : [ ],
                    "temporary" : false
                  },
                  "is_persistent" : false
                },
                "right_operator" : {
                  "class_name" : "get_data_operator",
                  "table_schema" : {
                    "name" : "animal",
                    "db_name" : "db_testing",
                    "organization_id" : 1212,
                    "display_name" : "Table For Testing",
                    "columns" : [
                      {
                        "class_name" : "string",
                        "name" : "gender",
                        "display_name" : "Gender",
                        "description" : "Hola",
                        "default_value" : "Female",
                        "is_nullable" : true
                      },
                      {
                        "class_name" : "date",
                        "name" : "birth_day",
                        "display_name" : "Birth day",
                        "description" : "Birth day of animal",
                        "input_formats" : [ ],
                        "default_value" : 1632735838402,
                        "is_nullable" : true
                      }
                    ],
                    "primary_keys" : [ ],
                    "partition_by" : [ ],
                    "order_bys" : [ ],
                    "temporary" : false
                  },
                  "is_persistent" : false
                },
                "conditions" : [ ],
                "join_type" : "left"
              }
            ],
            "dest_table_configuration" : {
              "tbl_name" : "cat",
              "db_display_name" : "casting",
              "tbl_display_name" : "catting"
            },
            "is_persistent" : false
          }
        ],
        "owner_id" : "tvc12",
        "schedule_info" : {
          "class_name" : "schedule_hourly",
          "recur_every" : 1
        },
        "created_time" : 1632735838492,
        "owner" : {
          "username" : "tvc12",
          "full_name" : "Thien",
          "last_name" : "Vi",
          "first_name" : "Chi",
          "gender" : 1,
          "avatar" : "https://github.com/tvc12.png"
        }
      }
    },
    {
      "id" : 3,
      "etl_job_id" : 4,
      "last_sync_time" : 1632735838492,
      "total_running_time" : 150,
      "sync_status" : "Synced",
      "total_rows_inserted" : 150,
      "message" : ""
    }
  ]
}
```