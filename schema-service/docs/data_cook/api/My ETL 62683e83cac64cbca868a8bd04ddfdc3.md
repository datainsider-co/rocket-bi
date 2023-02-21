# My ETL

### Path

```latex
HTTP POST /data_cook/my_etl
```

### request

```scala
/**
* request for list etls
 * @param keyword: list etl by keyword, if keyword is empty string => return full list etls
 * @param sorts sort etls by field name
 * @param from: pagination from
 * @param size: item size
**/
case class ListEtlsRequest(
    keyword: String = "",
    sorts: Array[Sort] = Array.empty,
    from: Int = 0,
    size: Int = 1000,
)
```

### response

```scala
case class PageResult[EtlJobResponse](data: Seq[EtlJobResponse], total: Int
```

- [Etl Job Response](ETL%20Job%20Response%20b573582053ad468bbdfa41443ef2a379.md)

### Sample:

```scala
HTTP POST /data_cook/my_etl

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
      "created_time" : 1632735838406,
      "owner" : {
        "username" : "tvc12",
        "full_name" : "Thien",
        "last_name" : "Vi",
        "first_name" : "Chi",
        "gender" : 1,
        "avatar" : "https://github.com/tvc12.png"
      }
    },
    {
      "id" : 2,
      "display_name" : "ETL name 2",
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
      "owner_id" : "meomeo",
      "schedule_info" : {
        "class_name" : "schedule_hourly",
        "recur_every" : 1
      },
      "created_time" : 1632735838408,
      "updated_time" : 1632735838408
    },
    {
      "id" : 4,
      "display_name" : "ETL name 3",
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
      "owner_id" : "ohloha",
      "schedule_info" : {
        "class_name" : "schedule_hourly",
        "recur_every" : 1
      },
      "created_time" : 1632735838408
    }
  ]
}
```