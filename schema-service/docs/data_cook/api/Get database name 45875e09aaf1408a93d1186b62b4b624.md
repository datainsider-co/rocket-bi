# Get database name

API để get database name of preview

### Path

```latex
HTTP GET /data_cook/:id/preview/database_name
```

### request

```scala
None
```

### response

```scala
case class EtlDatabaseNameResponse(
    id: EtlJobId,
    databaseName: String
)
```

### Sample:

HTTP GET /data_cook/4/preview/database_name

- Request: None
- Response

```json
{
  "id" : 4,
  "database_name" : "preview_etl_1_4"
}
```