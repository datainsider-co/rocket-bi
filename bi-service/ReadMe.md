## How to run

```shell
cd libs/ && ./install.sh && cd..
```

## QueryService

## RelationshipService

### get all relationships of a table

tra ve 1 map cac table co relationship voi table hien tai, key cua map dc quy dinh la < DbName>.< TableName>

method: POST

path: `/table_relationships`

data:

```json
{
  "db_name": "org1_banh_mi_sai_gon",
  "tbl_name": "customers"
}
```

example response::

```json
{
  "table": "org1_banh_mi_sai_gon.customers",
  "relationship_map": {
    "org1_banh_mi_sai_gon.orders": [
      {
        "first": {
          "db_name": "org1_banh_mi_sai_gon",
          "tbl_name": "customers",
          "field_name": "_c0",
          "field_type": "UInt32"
        },
        "second": {
          "db_name": "org1_banh_mi_sai_gon",
          "tbl_name": "orders",
          "field_name": "_c1",
          "field_type": "UInt32"
        }
      }
    ]
  }
}
```

### get relationship between two tables

trả về 1 list các cặp field giữa hai table, mỗi cặp field là một reference link giữa hai table (giống như foreign key
trong RDBM)

method: POST

path: `/table_relationships/between`

data:

```json
{
  "left_tbl": {
    "db_name": "org1_banh_mi_sai_gon",
    "tbl_name": "customers"
  },
  "right_tbl": {
    "db_name": "org1_banh_mi_sai_gon",
    "tbl_name": "orders"
  }
}
```

example response::

```json
[
  {
    "first": {
      "db_name": "org1_banh_mi_sai_gon",
      "tbl_name": "customers",
      "field_name": "_c0",
      "field_type": "UInt32"
    },
    "second": {
      "db_name": "org1_banh_mi_sai_gon",
      "tbl_name": "orders",
      "field_name": "_c1",
      "field_type": "UInt32"
    }
  }
]
```

### tạo hoặc update relationship between two tables

ban đầu relationship giữa hai table là 1 List< FieldPair> rỗng

tạo hoặc ghi đè relationship giữa hai bảng bằng 1 List< FieldPair> mới

method: PUT

path: `/table_relationships/update`

data:

```json
{
  "left_tbl": {
    "db_name": "org1_banh_mi_sai_gon",
    "tbl_name": "customers"
  },
  "right_tbl": {
    "db_name": "org1_banh_mi_sai_gon",
    "tbl_name": "orders"
  },
  "relationship": [
    {
      "first": {
        "db_name": "org1_banh_mi_sai_gon",
        "tbl_name": "customers",
        "field_name": "_c0",
        "field_type": "UInt32"
      },
      "second": {
        "db_name": "org1_banh_mi_sai_gon",
        "tbl_name": "orders",
        "field_name": "_c1",
        "field_type": "UInt32"
      }
    }
  ]
}
```

example response::

```json

```

### delete relationship between two tables

xóa hết relationship giữa hai table

method: DELETE

path: `/table_relationships`

data:

```json
{
  "left_tbl": {
    "db_name": "org1_banh_mi_sai_gon",
    "tbl_name": "customers"
  },
  "right_tbl": {
    "db_name": "org1_banh_mi_sai_gon",
    "tbl_name": "orders"
  }
}
```

example response::

```json

```

## Cohort analysis

Cohort filter là 1 phần tử của cohort management, trong đó có field cohort là class chứa thông tin để render các ô tùy
chỉnh cohort

```
class CohortFilter(
     id: WidgetId = 0, // dummy id
     name: String,
     description: String,
     organizationId: OrganizationId,
     creatorId: UserId,
     ownerId: UserId,
     createdTime: Long,
     updatedTime: Long,
     cohort: Cohort
   )
```

Class cohort có 3 loại cohort, dùng để chứa thông tin các field của table:

- user: field chỉ tập hợp để phân tích cohort (thường là user_id)
- time: field để nhóm các tập hợp theo (thường là timestamp xảy ra hành )
- filters: (vd: actions = "view", age >=/ <=...)
- having: (total times >= / <=, min(time) >=/ <=, max(age) >=/ <= ...)
- between là 1 condition ngày để limit lại khoảng thời gian phân tích

```
class SingleCohort(
    class_name: "single_cohort"
    user: Field,
    time: Field,
    filters: Seq[FieldRelatedCondition],
    having: Seq[AggregateCondition],
    between: Between
) 

```

```
class AndCohort(class_name: "and_cohort", cohorts: Seq[Cohort])
```

```
class OrCohort(class_name: "or_cohort", cohorts: Seq[Cohort])
```

### Get cohort filter

- Method: GET
- Path: /cohorts/:id
- Example response::

```json
{
  "class_name": "cohort_filter",
  "id": 12,
  "name": "renamed to something else",
  "description": "test update description",
  "organization_id": 1,
  "creator_id": "test@gmail.com",
  "owner_id": "test@gmail.com",
  "created_time": 1631030305776,
  "updated_time": 1631030305974,
  "cohort": {
    "class_name": "single_cohort",
    "user": {
      "class_name": "table_field",
      "db_name": "fake_data",
      "tbl_name": "activities",
      "field_name": "user_id",
      "field_type": "String"
    },
    "time": {
      "class_name": "table_field",
      "db_name": "fake_data",
      "tbl_name": "activities",
      "field_name": "occurred_at",
      "field_type": "DateTime"
    },
    "filters": [],
    "having": [],
    "between": {
      "class_name": "between",
      "field": {
        "class_name": "table_field",
        "db_name": "fake_data",
        "tbl_name": "activities",
        "field_name": "occurred_at",
        "field_type": "DateTime"
      },
      "min": "2020-01-01 00:00:00",
      "max": "2020-08-30 00:00:00"
    }
  }
}
```

### List cohort filter

- Method: POST
- Path: /cohorts
- Data:

```shell
{
 "from": 0,
 "size": 10
}
```

- Example response:

```json
[
  {
    "id": 4,
    "name": "example cohort",
    "description": "user activities first half 2021",
    "organization_id": 1,
    "creator_id": "test@gmail.com",
    "owner_id": "test@gmail.com",
    "created_time": 1631331376700,
    "updated_time": 1631331376700,
    "cohort": {
      "class_name": "and_cohort",
      "cohorts": [
        {
          "class_name": "single_cohort",
          "user": {
            "class_name": "table_field",
            "db_name": "fake_data",
            "tbl_name": "activities",
            "field_name": "user_id",
            "field_type": "String"
          },
          "time": {
            "class_name": "table_field",
            "db_name": "fake_data",
            "tbl_name": "activities",
            "field_name": "occurred_at",
            "field_type": "DateTime"
          },
          "filters": [
            {
              "class_name": "equal",
              "field": {
                "class_name": "table_field",
                "db_name": "fake_data",
                "tbl_name": "activities",
                "field_name": "user_id",
                "field_type": "String"
              },
              "value": "view"
            }
          ],
          "having": [
            {
              "class_name": "aggregate_greater_than",
              "function": {
                "class_name": "count",
                "field": {
                  "class_name": "table_field",
                  "db_name": "fake_data",
                  "tbl_name": "activities",
                  "field_name": "user_id",
                  "field_type": "String"
                }
              },
              "value": "10"
            }
          ],
          "between": {
            "class_name": "between",
            "field": {
              "class_name": "table_field",
              "db_name": "fake_data",
              "tbl_name": "activities",
              "field_name": "occurred_at",
              "field_type": "DateTime"
            },
            "min": "2020-01-01 00:00:00",
            "max": "2020-08-30 00:00:00"
          }
        },
        {
          "class_name": "single_cohort",
          "user": {
            "class_name": "table_field",
            "db_name": "fake_data",
            "tbl_name": "activities",
            "field_name": "user_id",
            "field_type": "String"
          },
          "time": {
            "class_name": "table_field",
            "db_name": "fake_data",
            "tbl_name": "activities",
            "field_name": "occurred_at",
            "field_type": "DateTime"
          },
          "filters": [
            {
              "class_name": "equal",
              "field": {
                "class_name": "table_field",
                "db_name": "fake_data",
                "tbl_name": "activities",
                "field_name": "user_id",
                "field_type": "String"
              },
              "value": "edit"
            }
          ],
          "having": [
            {
              "class_name": "aggregate_equal",
              "function": {
                "class_name": "count",
                "field": {
                  "class_name": "table_field",
                  "db_name": "fake_data",
                  "tbl_name": "activities",
                  "field_name": "age",
                  "field_type": "UInt32"
                }
              },
              "value": "4"
            }
          ],
          "between": {
            "class_name": "between",
            "field": {
              "class_name": "table_field",
              "db_name": "fake_data",
              "tbl_name": "activities",
              "field_name": "occurred_at",
              "field_type": "DateTime"
            },
            "min": "2020-01-01 00:00:00",
            "max": "2020-08-30 00:00:00"
          }
        }
      ]
    }
  }
]
```

### Create a cohort filter

- Method: POST
- Path: /cohorts/create
- Post data:

```shell
{
  "name" : "example cohort",
  "description" : "user activities first half 2021",
  "cohort" : {
    "class_name" : "and_cohort",
    "cohorts" : [
      {
        "class_name" : "single_cohort",
        "user" : {
          "class_name" : "table_field",
          "db_name" : "fake_data",
          "tbl_name" : "activities",
          "field_name" : "user_id",
          "field_type" : "String"
        },
        "time" : {
          "class_name" : "table_field",
          "db_name" : "fake_data",
          "tbl_name" : "activities",
          "field_name" : "occurred_at",
          "field_type" : "DateTime"
        },
        "filters" : [
          {
            "class_name" : "equal",
            "field" : {
              "class_name" : "table_field",
              "db_name" : "fake_data",
              "tbl_name" : "activities",
              "field_name" : "user_id",
              "field_type" : "String"
            },
            "value" : "view",
            "scalar_function" : null
          }
        ],
        "having" : [
          {
            "class_name" : "aggregate_greater_than",
            "function" : {
              "class_name" : "count",
              "field" : {
                "class_name" : "table_field",
                "db_name" : "fake_data",
                "tbl_name" : "activities",
                "field_name" : "user_id",
                "field_type" : "String"
              },
              "scalar_function" : null
            },
            "value" : "10"
          }
        ],
        "between" : {
          "class_name" : "between",
          "field" : {
            "class_name" : "table_field",
            "db_name" : "fake_data",
            "tbl_name" : "activities",
            "field_name" : "occurred_at",
            "field_type" : "DateTime"
          },
          "min" : "2020-01-01 00:00:00",
          "max" : "2020-08-30 00:00:00",
          "scalar_function" : null
        }
      },
      {
        "class_name" : "single_cohort",
        "user" : {
          "class_name" : "table_field",
          "db_name" : "fake_data",
          "tbl_name" : "activities",
          "field_name" : "user_id",
          "field_type" : "String"
        },
        "time" : {
          "class_name" : "table_field",
          "db_name" : "fake_data",
          "tbl_name" : "activities",
          "field_name" : "occurred_at",
          "field_type" : "DateTime"
        },
        "filters" : [
          {
            "class_name" : "equal",
            "field" : {
              "class_name" : "table_field",
              "db_name" : "fake_data",
              "tbl_name" : "activities",
              "field_name" : "user_id",
              "field_type" : "String"
            },
            "value" : "edit",
            "scalar_function" : null
          }
        ],
        "having" : [
          {
            "class_name" : "aggregate_equal",
            "function" : {
              "class_name" : "count",
              "field" : {
                "class_name" : "table_field",
                "db_name" : "fake_data",
                "tbl_name" : "activities",
                "field_name" : "age",
                "field_type" : "UInt32"
              },
              "scalar_function" : null
            },
            "value" : "4"
          }
        ],
        "between" : {
          "class_name" : "between",
          "field" : {
            "class_name" : "table_field",
            "db_name" : "fake_data",
            "tbl_name" : "activities",
            "field_name" : "occurred_at",
            "field_type" : "DateTime"
          },
          "min" : "2020-01-01 00:00:00",
          "max" : "2020-08-30 00:00:00",
          "scalar_function" : null
        }
      }
    ]
  }
}
```

- Example response:

```json
{
  "class_name": "cohort_filter",
  "id": 11,
  "name": "example cohort",
  "description": "user activities first half 2021",
  "organization_id": 1,
  "creator_id": "test@gmail.com",
  "owner_id": "test@gmail.com",
  "created_time": 1631030179748,
  "updated_time": 1631030179748,
  "cohort": {
    "class_name": "and_cohort",
    "cohorts": [
      {
        "class_name": "single_cohort",
        "user": {
          "class_name": "table_field",
          "db_name": "fake_data",
          "tbl_name": "activities",
          "field_name": "user_id",
          "field_type": "String"
        },
        "time": {
          "class_name": "table_field",
          "db_name": "fake_data",
          "tbl_name": "activities",
          "field_name": "occurred_at",
          "field_type": "DateTime"
        },
        "filters": [
          {
            "class_name": "equal",
            "field": {
              "class_name": "table_field",
              "db_name": "fake_data",
              "tbl_name": "activities",
              "field_name": "user_id",
              "field_type": "String"
            },
            "value": "view"
          }
        ],
        "having": [
          {
            "class_name": "aggregate_greater_than",
            "function": {
              "class_name": "count",
              "field": {
                "class_name": "table_field",
                "db_name": "fake_data",
                "tbl_name": "activities",
                "field_name": "user_id",
                "field_type": "String"
              }
            },
            "value": "10"
          }
        ],
        "between": {
          "class_name": "between",
          "field": {
            "class_name": "table_field",
            "db_name": "fake_data",
            "tbl_name": "activities",
            "field_name": "occurred_at",
            "field_type": "DateTime"
          },
          "min": "2020-01-01 00:00:00",
          "max": "2020-08-30 00:00:00"
        }
      },
      {
        "class_name": "single_cohort",
        "user": {
          "class_name": "table_field",
          "db_name": "fake_data",
          "tbl_name": "activities",
          "field_name": "user_id",
          "field_type": "String"
        },
        "time": {
          "class_name": "table_field",
          "db_name": "fake_data",
          "tbl_name": "activities",
          "field_name": "occurred_at",
          "field_type": "DateTime"
        },
        "filters": [
          {
            "class_name": "equal",
            "field": {
              "class_name": "table_field",
              "db_name": "fake_data",
              "tbl_name": "activities",
              "field_name": "user_id",
              "field_type": "String"
            },
            "value": "edit"
          }
        ],
        "having": [
          {
            "class_name": "aggregate_equal",
            "function": {
              "class_name": "count",
              "field": {
                "class_name": "table_field",
                "db_name": "fake_data",
                "tbl_name": "activities",
                "field_name": "age",
                "field_type": "UInt32"
              }
            },
            "value": "4"
          }
        ],
        "between": {
          "class_name": "between",
          "field": {
            "class_name": "table_field",
            "db_name": "fake_data",
            "tbl_name": "activities",
            "field_name": "occurred_at",
            "field_type": "DateTime"
          },
          "min": "2020-01-01 00:00:00",
          "max": "2020-08-30 00:00:00"
        }
      }
    ]
  }
}
```

### Update a cohort filter

- Method: PUT
- Path: /cohorts/:id
- Put data:

```shell
{
  "name" : "renamed to something else",
  "description" : "test update description",
  "cohort" : {
    "class_name" : "single_cohort",
    "user" : {
      "class_name" : "table_field",
      "db_name" : "fake_data",
      "tbl_name" : "activities",
      "field_name" : "user_id",
      "field_type" : "String"
    },
    "time" : {
      "class_name" : "table_field",
      "db_name" : "fake_data",
      "tbl_name" : "activities",
      "field_name" : "occurred_at",
      "field_type" : "DateTime"
    },
    "filters" : [ ],
    "having" : [ ],
    "between" : {
      "class_name" : "between",
      "field" : {
        "class_name" : "table_field",
        "db_name" : "fake_data",
        "tbl_name" : "activities",
        "field_name" : "occurred_at",
        "field_type" : "DateTime"
      },
      "min" : "2020-01-01 00:00:00",
      "max" : "2020-08-30 00:00:00",
      "scalar_function" : null
    }
  }
}
```

- Example response:

```json
{
  "success": true
}
```

### Delete a cohort filter

- Method: DELETE
- Path: /cohorts/:id
- Data:

```shell

```

- Example response:

```json
{
  "success": true
}
```

### Query a cohort

query data từ 1 cohort: có thể nhận "single_cohort", " "and_cohort" và "or_cohort"

chart type hiện tại chỉ mới có "CohortPivotTable"

response trả về ở dạng json có thể dùng bảng pivot bên chart builder để render

- Method: POST
- Path: /cohorts/query
- Data:

```shell
{
	"chart_type": "CohortPivotTable",
	"cohort": {
		"class_name": "and_cohort",
		"cohorts": [
			{
				"class_name": "single_cohort",
				"user": {
					"class_name": "table_field",
					"db_name": "user_activities",
					"tbl_name": "data",
					"field_name": "username",
					"field_type": "String"
				},
				"time": {
					"class_name": "table_field",
					"db_name": "user_activities",
					"tbl_name": "data",
					"field_name": "at_time",
					"field_type": "DateTime"
				},
				"filters": [
					{
						"class_name": "equal",
						"field": {
							"class_name": "table_field",
							"db_name": "user_activities",
							"tbl_name": "data",
							"field_name": "action_type",
							"field_type": "String"
						},
						"value": "checkout",
						"scalar_function": null
					},
					{
						"class_name": "between",
						"field": {
							"class_name": "table_field",
							"db_name": "user_activities",
							"tbl_name": "data",
							"field_name": "at_time",
							"field_type": "DateTime"
						},
						"min": "2021-07-21",
						"max": "2021-08-21"
					}
				],
				"having": [
					{
            "class_name" : "aggregate_less_than",
            "function" : {
              "class_name" : "count",
              "field" : {
                "class_name" : "table_field",
                "db_name" : "user_activities",
                "tbl_name" : "data",
                "field_name" : "username",
                "field_type" : "String"
              },
              "scalar_function" : null
            },
            "value" : "4"
          }
				]
			}
		]
	},
	"between": {
		"class_name": "between",
		"field": {
			"class_name": "table_field",
			"db_name": "user_activities",
			"tbl_name": "data",
			"field_name": "at_time",
			"field_type": "DateTime"
		},
		"min": "2021-07-21",
		"max": "2021-08-21"
	},
	"time_metric": "Week"
}
```

- Example response:

```json
{
  "class_name": "json_table_response",
  "headers": [
    {
      "key": 0,
      "label": "date",
      "is_group_by": false,
      "is_text_left": false
    },
    {
      "key": 1,
      "label": "0",
      "is_group_by": false,
      "is_text_left": false
    },
    {
      "key": 2,
      "label": "1",
      "is_group_by": false,
      "is_text_left": false
    },
    {
      "key": 3,
      "label": "2",
      "is_group_by": false,
      "is_text_left": false
    },
    {
      "key": 4,
      "label": "3",
      "is_group_by": false,
      "is_text_left": false
    },
    {
      "key": 5,
      "label": "4",
      "is_group_by": false,
      "is_text_left": false
    }
  ],
  "records": [
    {
      "0": "2021-W29",
      "1": "1897",
      "2": "1896",
      "3": "1894",
      "4": "1890",
      "5": "1860"
    },
    {
      "0": "2021-W30",
      "1": "1921",
      "2": "1918",
      "3": "1914",
      "4": "1882"
    },
    {
      "0": "2021-W31",
      "1": "1919",
      "2": "1912",
      "3": "1880"
    },
    {
      "0": "2021-W32",
      "1": "1915",
      "2": "1876"
    },
    {
      "0": "2021-W33",
      "1": "1883"
    }
  ],
  "total": 5,
  "min_max_values": []
}
```

- Cấp quyền cho thư mục:

```aidl
Owner: Hau

Create: root(id = 1) => Hau -> 1:directory:*:1

Hau create: data(id=2) => {
	check quyen cua Hau => cap quyen => 1:directory:*:2
	check quyen user shared => khong ai duoc share => bo qua
}

Hau cap quyen cho Thien view, create thu muc data => 1:directory:view:2, 1:directory:create:2

Hau create: sale2020(id=3) trong folder data => {
	check quyen cua Hau => cap quyen => 1:directory:*:3 
	check quyen user shared => Thien: view,create => 1:directory:view:3, 1:directory:create:3 (chay binh thuong)
}

Thien create: sale1010(id=4) trong folder data => {
	check quyen cua Hau => cap quyen => 1:directory:*:4
	check quyen user shared => Thien: view,create => 1:directory:view:4, 1:directory:create:4 (chay binh thuong)
}
```