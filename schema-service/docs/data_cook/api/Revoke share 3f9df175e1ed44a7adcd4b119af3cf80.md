# Revoke share

### Path

```latex
HTTP DELETE /data_cook/:id/share/revoke
```

### Query request

```scala
/**
 * revoke share 
 * @param id etl id
 * @param usernames username for revoke permission
 * @param request base request
 */
case class RevokeShareRequest(
    @RouteParam id: EtlId,
    @NotEmpty usernames: Seq[String],
    @Inject request: Request = null
)
```

### response

```scala
Map[String, Boolean]
```

### Sample:

```scala
HTTP DELETE /data_cook/345/share/revoke
{
  "id" : 123,
  "usernames" : [
    "tvc12",
    "hello"
  ]
}

response
{
  "tvc12" : true,
  "thien_vi" : false
}
```