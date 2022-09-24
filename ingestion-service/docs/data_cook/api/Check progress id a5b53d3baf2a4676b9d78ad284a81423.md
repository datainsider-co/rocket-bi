# Check progress id

API check progress of id

### Path

```latex
HTTP GET /data_cook/:id/:progress_id/check
```

### request

```scala
None
```

### response

```scala

/**
 * Trả về trạng thái của job 
 * Nếu status là synced thì sẽ trả về data
 * Nếu status là lỗi thì trả về error
 */
case class EtlJobStatusResponse(
    id: EtlJobId,
    @JsonScalaEnumeration(classOf[JobStatusRef]) status: JobStatus,
    data: Option[EtlJobData] = None,
    error: Option[EtlJobErrorResponse] = None
)

/**
  * Contains data of job
  */
case class EtlJobData(
    tableSchema: TableSchema
)

/**
  * Contains error of job, failure at table
  */
case class EtlJobErrorResponse(
    message: String,
    tableError: TblName
)
```

### Sample:

HTTP GET /data_cook/456/123/check

- Request None
- Response

```json
{
  "id" : 1,
  "status" : "Syncing"
}
```