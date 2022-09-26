# Restore

Move từ trash về my etl

### Path

```latex
POST: /data_cook/trash/:id/restore
```

### request

```scala
NONE
```

### response

```scala
case class EtlJobResponse()
```

### Sample:

```scala
HTTP POST /data_cook/trash/123/restore

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
  "created_time" : 1632285467917
}
```