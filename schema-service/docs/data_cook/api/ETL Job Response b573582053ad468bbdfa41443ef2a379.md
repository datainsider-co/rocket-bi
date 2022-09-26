# ETL Job Response

```scala
/**
  * Full info of etl contain owner profile
  * @param id etl id
  * @param displayName display name of etl
  * @param operators operators of etl
  * @param ownerId user name of user
  * @param scheduleTime schedule info of job
  * @param createdTime time create etl
  * @param updatedTime time update etl
  * @param owner short user info of owner
  * @param lastHistoryId last history id of job
  * @param extraData used by front-end
  */
case class EtlJobResponse(
    id: EtlJobId,
    displayName: String,
    operators: Array[EtlOperator] = Array.empty,
    ownerId: String,
    scheduleTime: ScheduleTime,
    createdTime: Option[Long] = None,
    updatedTime: Option[Long] = None,
    owner: Option[UserProfile] = None,
    lastHistoryId: Option[JobHistoryId] = None,
    extraData: Option[JsonNode] = None,
    @JsonScalaEnumeration(classOf[JobStatusRef]) status: Option[JobStatus] = None,
    nextExecuteTime: Option[Long] = None
 )
```