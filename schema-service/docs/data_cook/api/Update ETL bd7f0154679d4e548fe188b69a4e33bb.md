# Update ETL

### Path

```latex
HTTP PUT /data_cook/:id
```

### request

```scala
/**
  * Edit etl job
  * @param id id hiện tại của etl, update thông tin của etl job, nếu None thì không update property đó.
  * @param displayName display name muốn chỉnh sửa
  * @param operators operators đang có
  * @param scheduleTime setup time cho schedule
  * @param request base request
  */
case class UpdateEtlJobRequest(
    @RouteParam id: EtlJobId,
    displayName: Option[String] = None,
    operators: Option[Array[EtlOperator]] = None,
    scheduleTime: Option[ScheduleTime] = None,
    extraData: Option[JsonNode] = None,
    @Inject request: Request = null
) extends LoggedInRequest
```

### response

```scala
case class EtlJobResponse()
```

### Sample:

```scala
HTTP PUT /data_cook/456
{
  "id" : 123,
  "display_name" : "Test edit etl",
  "operators" : [
    {
      "class_name" : "join_operator",
      "operators" : [
        {
          "class_name" : "get_data_operator",
          "data_source" : {
            "display_name" : "New table",
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
                  "is_nullable" : true,
                  "default_expr" : null,
                  "default_expression" : null
                },
                {
                  "class_name" : "date",
                  "name" : "birth_day",
                  "display_name" : "Birth day",
                  "description" : "Birth day of animal",
                  "input_formats" : [ ],
                  "default_value" : 1632285467965,
                  "is_nullable" : true,
                  "default_expr" : null,
                  "default_expression" : null
                }
              ],
              "engine" : null,
              "primary_keys" : [ ],
              "partition_by" : [ ],
              "order_bys" : [ ],
              "query" : null,
              "table_type" : null,
              "temporary" : false
            }
          }
        },
        {
          "class_name" : "get_data_operator",
          "data_source" : {
            "display_name" : "Two table",
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
                  "is_nullable" : true,
                  "default_expr" : null,
                  "default_expression" : null
                },
                {
                  "class_name" : "date",
                  "name" : "birth_day",
                  "display_name" : "Birth day",
                  "description" : "Birth day of animal",
                  "input_formats" : [ ],
                  "default_value" : 1632285467965,
                  "is_nullable" : true,
                  "default_expr" : null,
                  "default_expression" : null
                }
              ],
              "engine" : null,
              "primary_keys" : [ ],
              "partition_by" : [ ],
              "order_bys" : [ ],
              "query" : null,
              "table_type" : null,
              "temporary" : false
            }
          }
        }
      ],
      "conditions" : [ ],
      "join_type" : "left"
    }
  ],
  "schedule_info" : {
    "class_name" : "schedule_monthly",
    "recur_on_days" : 15,
    "recur_every_month" : 2,
    "at_time" : 1632285468401
  }
}
response:
{
  "id" : 1,
  "display_name" : "ETL name 1",
  "operators" : [
    {
      "class_name" : "join_operator",
      "operators" : [
        {
          "class_name" : "get_data_operator",
          "data_source" : {
            "display_name" : "New table",
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
                  "default_value" : 1632285467484,
                  "is_nullable" : true
                }
              ],
              "primary_keys" : [ ],
              "partition_by" : [ ],
              "order_bys" : [ ],
              "temporary" : false
            }
          }
        },
        {
          "class_name" : "get_data_operator",
          "data_source" : {
            "display_name" : "Two table",
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
                  "default_value" : 1632285467484,
                  "is_nullable" : true
                }
              ],
              "primary_keys" : [ ],
              "partition_by" : [ ],
              "order_bys" : [ ],
              "temporary" : false
            }
          }
        }
      ],
      "conditions" : [ ],
      "join_type" : "left"
    }
  ],
  "owner_id" : "tvc12",
  "schedule_info" : {
    "class_name" : "schedule_hourly",
    "recur_every" : 1
  },
  "created_time" : 1632285468435
}
```