# List shared User

### Path

```latex
HTTP GET /data_cook/:id/share/list
```

### Query request

```scala
/**
 * List shared user of etl
 * @param id etl id
 * @param from get user from
 * @param size size of list
 * @param request
 */
case class ListSharedUserRequest(
    @RouteParam id: EtlId,
    @QueryParam @Min(0) from: Int = 0,
    @QueryParam @Min(1) size: Int = 20,
)
```

### response

```scala
case class ResourceInfo(
    owner: Option[UserProfile],
    totalUserSharing: Long,
    usersSharing: Seq[UserSharingInfo]
)
```

### Sample:

```scala
HTTP GET /data_cook/345/share/list?from=20&size=30

response
{
  "owner" : {
    "username" : "tvc12",
    "full_name" : "Thien Vi",
    "already_confirmed" : true
  },
  "total_user_sharing" : 0,
  "users_sharing" : [ ]
}
```