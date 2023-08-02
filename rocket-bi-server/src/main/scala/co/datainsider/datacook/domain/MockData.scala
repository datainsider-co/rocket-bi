package co.datainsider.datacook.domain

import datainsider.client.domain.query.SqlQuery
import datainsider.client.domain.scheduler.{ScheduleHourly, ScheduleOnce}
import co.datainsider.caas.user_profile.domain.user.{UserGender, UserProfile}
import datainsider.client.util.JsonParser
import co.datainsider.datacook.domain.operator._
import co.datainsider.datacook.domain.response.{EtlJobHistoryResponse, EtlJobResponse, TableResponse}
import co.datainsider.schema.domain.{PageResult, TableSchema}
import co.datainsider.schema.domain.column.{DateColumn, StringColumn}

/**
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 2:29 PM
  */
object MockData {
  lazy val mockTableSchema: TableSchema = TableSchema(
    name = "animal",
    dbName = "db_testing",
    organizationId = 1212,
    displayName = "Table For Testing",
    columns = Seq(
      StringColumn(
        name = "gender",
        displayName = "Gender",
        description = Some("Hola"),
        defaultValue = Some("Female"),
        isNullable = true
      ),
      DateColumn(
        name = "birth_day",
        displayName = "Birth day",
        description = Some("Birth day of animal"),
        defaultValue = Some(System.currentTimeMillis()),
        isNullable = true
      )
    )
  )

  lazy val mockOperator: OldOperator = OldJoinOperator(
    joinConfigs = Array(
      JoinConfig(
        leftOperator = OldGetDataOperator(mockTableSchema),
        rightOperator = OldGetDataOperator(mockTableSchema),
        conditions = Array.empty,
        JoinType.Left
      )
    ),
    destTableConfiguration = DestTableConfig(
      tblName = "cat",
      dbDisplayName = "casting",
      tblDisplayName = "catting"
    )
  )

  lazy val mockHistoryData: PageResult[EtlJobHistoryResponse] = PageResult(
    10,
    Array(
      EtlJobHistoryResponse(
        id = 1,
        etlJobId = 2,
        totalExecutionTime = System.currentTimeMillis(),
        message = "",
        status = ETLStatus.Done,
        etlInfo = Some(
          EtlJobResponse(
            1,
            "ETL name 1",
            operators = Array(mockOperator),
            "tvc12",
            ScheduleHourly(1),
            Some(System.currentTimeMillis()),
            owner = Some(
              UserProfile(
                "tvc12",
                Some("Thien"),
                Some("Vi"),
                Some("Chi"),
                avatar = Some("https://github.com/tvc12.png"),
                gender = Some(UserGender.Male)
              )
            ),
            config = EtlConfig()
          )
        )
      ),
      EtlJobHistoryResponse(
        id = 3,
        etlJobId = 4,
        totalExecutionTime = System.currentTimeMillis(),
        status = ETLStatus.Done
      )
    )
  )

  lazy val mockListSharedEtlJobs: PageResult[EtlJobResponse] = PageResult(
    10,
    Array(
      EtlJobResponse(
        1,
        "ETL name 1",
        operators = Array(mockOperator),
        "tvc12",
        ScheduleHourly(1),
        Some(System.currentTimeMillis()),
        config = EtlConfig()
      ),
      EtlJobResponse(
        2,
        "ETL name 2",
        operators = Array(mockOperator),
        "meomeo",
        ScheduleHourly(1),
        Some(System.currentTimeMillis()),
        Some(System.currentTimeMillis()),
        config = EtlConfig()
      ),
      EtlJobResponse(
        4,
        "ETL name 3",
        operators = Array(mockOperator),
        "ohloha",
        ScheduleHourly(1),
        Some(System.currentTimeMillis()),
        config = EtlConfig()
      )
    )
  )

  lazy val mockMyEtlJobs: PageResult[EtlJobResponse] = PageResult(
    10,
    Array(
      EtlJobResponse(
        1,
        "ETL name 1",
        operators = Array(mockOperator),
        "tvc12",
        ScheduleHourly(1),
        Some(System.currentTimeMillis()),
        owner = Some(
          UserProfile(
            "tvc12",
            Some("Thien"),
            Some("Vi"),
            Some("Chi"),
            avatar = Some("https://github.com/tvc12.png"),
            gender = Some(UserGender.Male)
          )
        ),
        config = EtlConfig()
      ),
      EtlJobResponse(
        2,
        "ETL name 2",
        operators = Array(mockOperator),
        "meomeo",
        ScheduleHourly(1),
        Some(System.currentTimeMillis()),
        Some(System.currentTimeMillis()),
        config = EtlConfig()
      ),
      EtlJobResponse(
        4,
        "ETL name 3",
        operators = Array(mockOperator),
        "ohloha",
        ScheduleHourly(1),
        Some(System.currentTimeMillis()),
        config = EtlConfig()
      )
    )
  )

  lazy val mockEtlJob: EtlJobResponse = EtlJobResponse(
    1,
    "ETL name 1",
    operators = Array(mockOperator),
    "tvc12",
    ScheduleHourly(1),
    Some(System.currentTimeMillis()),
    owner = Some(
      UserProfile(
        "tvc12",
        Some("Thien"),
        Some("Vi"),
        Some("Chi"),
        avatar = Some("https://github.com/tvc12.png"),
        gender = Some(UserGender.Male)
      )
    ),
    config = EtlConfig()
  )

  lazy val mockSqlQuery = new SqlQuery("select * from animal")

  lazy val mockTableResponse: TableResponse =
    JsonParser.fromJson[TableResponse]("""
      |{
      |    "class_name": "json_table_response",
      |    "headers": [
      |        {
      |            "key": "0",
      |            "label": "name",
      |            "is_group_by": false,
      |            "is_text_left": true
      |        },
      |        {
      |            "key": "1",
      |            "label": "age",
      |            "is_group_by": false,
      |            "is_text_left": false
      |        },
      |        {
      |            "key": "2",
      |            "label": "is_naughty",
      |            "is_group_by": false,
      |            "is_text_left": false
      |        }
      |    ],
      |    "records": [
      |        {
      |            "0": "kiki",
      |            "1": "2",
      |            "2": "1"
      |        },
      |        {
      |            "0": "datainsider",
      |            "1": "1",
      |            "2": "0"
      |        }
      |    ],
      |    "total": 2,
      |    "min_max_values": []
      |}""".stripMargin)

  lazy val mockJob = EtlJob(
    1,
    2,
    "Ahihi",
    Array(mockOperator),
    "user_123",
    ScheduleOnce(System.currentTimeMillis()),
    System.currentTimeMillis(),
    ETLStatus.Init,
    operatorInfo = OperatorInfo.default(),
    config = EtlConfig()
  )
}
