JobScheduler đọc job từ database => maintain 1 internal job queue để worker lấy thông tin xử lí. JobScheduler là Single
Point Failure, cần monitor restart, có thể áp dụng actor-cluster sau này.

JobScheduler mở endpoint để quản lí job status, job sync history, gồm 3 tables:

1/ JobInfo(datasource_id,job_id,job_data)
2/ JobScheduler(job_id, last_time_sync, sync_internal , sync_data, last_sync_status)
3/ JobHistory(job_id, sync_time, stats_data)
4/ JobStatus( job_id,current_status)

current_status = [ Init, Syncing, Synced, Error, Unknown]
Sync_data chứa dữ liệu hữu ích cho schedule job, phụ thuộc vào loại job

JobScheduler khi start/restart sẽ thực hiện lock table JobScheduler và:
1/ Đọc dữ liệu những record nào last_sync < (current_time - sync_internal) thực hiện resync. 2/ Enqueue cho việc chuẩn
bị sync, update JobStatus

Jobworker đọc config lấy endpoint của JobScheduler để thực hiện Job. Job có 3 dạng:
=> Sync DB => Sync Data From Services => Sync File from remote storage (s3, gg sheet etc)

# Lake job curl

Có 3 loại job: java job, spark sql job và python job

## create lake job (java job)

- method: post
- url: /lake/job/create
- request example:

```json
{
  "job": {
    "class_name": "java_job",
    "creator_id": "",
    "org_id": 1,
    "job_id": 13,
    "display_name": "test",
    "job_type": "Java",
    "last_run_time": 100,
    "last_sync_status": "Initialized",
    "current_sync_status": "Initialized",
    "schedule_time": {
      "class_name": "schedule_once",
      "start_time": 0
    },
    "git_url": "abcd",
    "build_tool": "maven",
    "build_cmd": "execute cute cute cute"
  }
}
```

- response example:

```json
{
  "job": {
    "class_name": "java_job",
    "org_id": 1,
    "job_id": 3,
    "creator_id": "test@gmail.com",
    "display_name": "test",
    "job_type": "Java",
    "last_run_time": 100,
    "next_run_time": 1639113936764,
    "last_sync_status": "Initialized",
    "current_sync_status": "Initialized",
    "schedule_time": {
      "class_name": "schedule_once",
      "start_time": 0
    },
    "git_url": "abcd",
    "build_tool": "maven",
    "build_cmd": "execute cute cute cute"
  }
}
```

## Get lake job (java job)

- method: get
- url: /lake/job/:id
- request example:

```json
{}
```

- response example:

```json
{
  "job": {
    "class_name": "java_job",
    "org_id": 1,
    "job_id": 3,
    "creator_id": "test@gmail.com",
    "display_name": "test",
    "job_type": "Java",
    "last_run_time": 100,
    "next_run_time": 1639113936764,
    "last_sync_status": "Initialized",
    "current_sync_status": "Initialized",
    "schedule_time": {
      "class_name": "schedule_once",
      "start_time": 0
    },
    "git_url": "abcd",
    "build_tool": "maven",
    "build_cmd": "execute cute cute cute"
  }
}
```

## Update lake job (java job)

- method: put
- url: /lake/job/:id
- request example:

```json
{
  "job": {
    "class_name": "java_job",
    "creator_id": "",
    "org_id": 1,
    "job_id": 2,
    "display_name": "test",
    "job_type": "Java",
    "last_run_time": 100,
    "last_sync_status": "Initialized",
    "current_sync_status": "Initialized",
    "schedule_time": {
      "class_name": "schedule_once",
      "start_time": 0
    },
    "git_url": "abcd",
    "build_tool": "sbt",
    "build_cmd": "execute cute cute cute"
  }
}
```

- response example:

```json
{
  "success": true
}
```

## List lake job

- method: post
- url: /lake/job/list
- request example:

```json
{
  "from": 0,
  "size": 100
}

```

- response example:

```json
{
  "data": [
    {
      "job": {
        "class_name": "java_job",
        "org_id": 1,
        "job_id": 3,
        "creator_id": "test@gmail.com",
        "display_name": "test",
        "job_type": "Java",
        "last_run_time": 100,
        "next_run_time": 1639113936764,
        "last_sync_status": "Initialized",
        "current_sync_status": "Queued",
        "schedule_time": {
          "class_name": "schedule_once",
          "start_time": 0
        },
        "git_url": "abcd",
        "build_tool": "maven",
        "build_cmd": "execute cute cute cute"
      }
    }
  ],
  "total": 1
}
```

## Delete lake job

- method: delete
- url: /lake/job/:id
- request example:

```json
{}
```

- response example:

```json
{
  "success": true
}
```

## Create lake job (sql job)

- method: post
- url: /lake/job/create
- request example:

```json
{
  "job": {
    "class_name": "sql_job",
    "creator_id": "",
    "org_id": 1,
    "job_id": 13,
    "display_name": "test",
    "job_type": "Sql",
    "last_run_time": 100,
    "last_sync_status": "Initialized",
    "current_sync_status": "Initialized",
    "schedule_time": {
      "class_name": "schedule_once",
      "start_time": 0
    },
    "query_info": {
      "query": "select * from abc",
      "outputs": [
        {
          "type": "text_file",
          "config": {
            "class_name": "hadoop_config",
            "hdfs_uri": "localhost:9000",
            "result_path": "/data/abc"
          }
        }
      ]
    }
  }
}
```

- response example:

```json
{
  "job": {
    "class_name": "sql_job",
    "org_id": 1,
    "job_id": 9,
    "creator_id": "test@gmail.com",
    "display_name": "test",
    "job_type": "Sql",
    "last_run_time": 100,
    "next_run_time": 1639378659025,
    "last_sync_status": "Initialized",
    "current_sync_status": "Initialized",
    "schedule_time": {
      "class_name": "schedule_once",
      "start_time": 0
    },
    "query_info": {
      "query": "select * from abc",
      "outputs": [
        {
          "type": "text_file",
          "config": {
            "class_name": "hadoop_config",
            "hdfs_uri": "localhost:9000",
            "result_path": "/data/abc"
          }
        }
      ]
    }
  }
}
```

- Note: Table info is table of spark
- Query_info include query and outputs. Outputs: list of output:

+ Hadoop output:

```json
{
  "type": "text_file",
  "config": {
    "class_name": "hadoop_config",
    "hdfs_uri": "localhost:9000",
    "result_path": "/data/abc"
  }
}
```

+ Clickhouse output:
```json
{
  "type": "datainsider",
  "config": {
    "class_name": "clickhouse_config",
    "database": "test_db",
    "table_name": "product",
    "write_mode": "append"
  }
}
```