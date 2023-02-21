# Share ETL to User

### Path

```latex
HTTP POST /data_cook/:id/share
```

### Query request

```scala
/**
 * share etl to user
 * @param id etl id
 * @param userActions user and actions as Map
 */
case class ShareEtlToUsersRequest(
    @RouteParam id: EtlId,
    @NotEmpty userActions: Map[String, Seq[String]],
)
```

### response

```scala
Map[String, Boolean]
```

### Sample:

```scala
HTTP POST /data_cook/345/share
[Header]	Host -> 127.0.0.1:32827
[Header]	Content-Type -> application/json;charset=utf-8
[Header]	Content-Length -> 73
{
  "id" : 123,
  "user_actions" : {
    "123" : [
      "view",
      "edit"
    ]
  }
}

response
{
  "tvc12" : true,
  "thien_vi" : false
}
```