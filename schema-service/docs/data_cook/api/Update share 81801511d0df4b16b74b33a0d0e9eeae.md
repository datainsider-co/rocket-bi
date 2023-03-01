# Update share

### Path

```latex
HTTP PUT /data_cook/:id/share/update
```

### Query request

```scala
/**
 * Update share 
 * @param id etl id
 * @param shareIdActions share id and action as map
 * @param request base request
 */
case class UpdateShareRequest(
    @RouteParam id: EtlId,
    @NotEmpty shareIdActions: Map[ShareId, Seq[String]],
    @Inject request: Request = null
)
```

### response

```scala
Map[String, Boolean]
```

### Sample:

```scala
HTTP PUT /data_cook/345/share/update
{
  "id" : 123,
  "share_id_actions" : {
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