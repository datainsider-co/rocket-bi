# INSTALL & START

1.  Install docker https://docs.docker.com/get-docker/
2.  Install docker compose https://docs.docker.com/compose/install/
3.  Clone this repos: `git clone https://github.com/datainsider-co/rocket-bi.git`
4.  Create a network: `docker network create di_network`
5.  Start this service: `docker-compose up -d`. 
6.  Access rocket-bi service at: `http://localhost:5050/`   

```yaml
hello@gmail.com/123456
```

## Add Accounts

You can add a new account in a configuration file: `./user-profile/conf/users.json`.

```yaml
[
  {
    "email": "hello@gmail.com",
    "password": "123456",
    "full_name": "Data Insider"
  }
]
```

Where:
  - `email`: `String` - login email -  **required**
  - `password`: `String` - login password -  **required**
  - `full_name`: `String` - full name -  **optional**


Let's say, you want to add a new account for `John Smith`, `email`=`john21@gmail.com` with `password`=`as231sf`. So the configuration file should look like this

File: `./user-profile/conf/users.json`.

```yaml
[
  {
    "email": "hello@gmail.com",
    "password": "123456",
    "full_name": "Tester"
  },
  {
    "email": "john21@gmail.com",
    "password": "as231sf",
    "full_name": "John Smith"
  }
]
```


# DATABASES

Each container has a name start with `di-`. You should not change this unless you do understand what you are going to
change.

### MySQL

- By default, MySQL server will run at port `3306`
- You can configure some settings via the docker `environment`.
    + MYSQL_USER: Create a new user
    + MYSQL_PASSWORD: Password for your new user.
    + MYSQL_ROOT_PASSWORD: Password for `root` user.
    + MYSQL_ALLOW_EMPTY_PASSWORD: `yes` or `no` - to indicate that an empty password is allowed or not.

- For other advanced settings, please check the folder: `./mysql`

### SSDB

- By default, MySQL server will run at port `8888`
- The data is mounted to folder: `./ssdb/data`
- The configuration file: `./ssdb/ssdb.conf`

# SERVICES

Our service's containers run and has its configs & logs in the following paths: `/app/conf` and `/app/logs`. There are
some important environment variables:

- MODE: The mode your service will run and use the corresponding configuration file: `$MODE.conf`
  For example, if you run with `MODE`=`production` it will use the config from file: `production.conf`

### User Profile

The configuration file is under the folder: `./user-profile/conf`

1. Config MySQL database

```yml
db {
  mysql {
  dbname = caas_dev #Do not change this 
  host = di-mysql
  port = 3306
  username = root
  password = "di@2020!"
  retry = 5
  }
}
```

**Note: Do not change `dbname`**

2. Config SSDB

```yml
db {
  ssdb {
  host = "di-ssdb"
  port = 8888
  timeout_in_ms = 60000
  username_key = "profiles"  #Do not change
  email_key = "profile.emails"  #Do not change
  phone_number_key = "profile.phones"  #Do not change
  }
}
```

3.  API

This service serves Restful API and Thrift API at port: `8580` & `8589. You can change these settings as below.

```yml
server {
  http {
  port = ":8580"
  }
  thrift {
  port = ":8589"
  }
}
```

4. Create users

You can create accounts automatically by using the pre-defined users in the setting file: `conf/users.json`

```json5
[
  {
    "email": "hello@gmail.com",
    "password": "123456",
    "full_name": "User 1"
  },
  {
    "email": "hello2@gmail.com",
    "password": "123456",
    "full_name": "User 2"
  }
]
```

The above example will create 2 accounts with the given information.  Then, you can use these accounts to login to this system.

### BI Service

1. Config MySQL database

```yml
database {
  mysql {
  url = "jdbc:mysql://di-mysql:3306?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
  user = "root"
  password = "di@2020!"
  }
}
```

2. Config SSDB

```yml
ssdb {
  config {
  host = di-ssdb
  port = 8888
  timeout_in_ms = 3000
  }
}

```

2. Config Clickhouse database

```yml
database {
  clickhouse {
  url = "jdbc:clickhouse://clickhouse_server_di:9000"
  user = "default"
  password = ""
  }
}
```

3. Config User Profile Thrift Client

```yml
caas {
  thrift {
  host = "di-user-profile"
  port = "8589" // Thrift API port
  timeout_sec = 5
  client_id = "caas-client-from-bi-service"
  }
}
```

4. Config Ingestion Thrift Client

```yml
schema {
  thrift {
  host = "di-ingestion-service"
  port = "8487"  // Thrift API port
  timeout_sec = 5
  client_id = "ingestion-service-from-bi-service"
  }
}
```

5. API

Restful API is serves at port: `8080`. You can change these settings as below.

```yml
server {
  http {
  port = ":8080"
  }
}
```

### Ingestion Service

1. Config SSDB

```yml
db {
  ssdb {
  host = "di-ssdb"
  port = 8888
  timeout_in_ms = 60000
  }
}

```

2. Config Clickhouse database

```yml
db {
  clickhouse {
  driver_class = "com.github.housepower.jdbc.ClickHouseDriver"
  url = "jdbc:clickhouse://clickhouse_server_di:9000"
  user = "default"
  password = ""
  }
}
```

3. Config User Profile Thrift Client

```yml
caas {
  thrift {
  host = "di-user-profile"
  port = "8589"
  timeout_sec = 5
  client_id = "caas-client-from-ingestion-service"
  }
}
```

4. API

Restful API is serves at port: `8489`. Thrift API is serves at port: `8487`. You can change these settings as below.

```yml
server {
  http {
  port = ":8489"
  }
  thrift {
  port = ":8487"
  }
}
```

5. Data Ingestion Key

- In order to ingest your data into our DI platform. You have to setup a secret service key.
- Default value is: `12345678`. But, you can use another value in the configuration file:

```yaml
service_key = 12345678 // Change this value as you wish
```

6. Ingest Data

- Method: `POST`
- Endpoint: `/api/ingestion`
- Headers:
    + DI-SERVICE-KEY: Your service key
  
- Body: A JSONObject
  + `db_name`: Database name - Only [a-zA-Z0-9] character.
  + `tbl_name`: Table name
  + `records`: An array of map with the key is your property's name and the value is its value.

- Example Curl's request:

The following example will ingest data to database `shopping` and table `purchased`. 
It will create a new database and table if the database or table is not exists yet.

```shell
curl --request POST \
  --url http://localhost:5050/api/ingestion \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678' \
  --data '{
	"db_name": "shopping",
	"tbl_name": "purchased",
	"records": [
		{
			"product_id": "6",
			"purchased_at": "2020-01-12 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 5570000
		},
		{
			"product_id": "3",
			"purchased_at": "2020-01-09 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 1570000
		},
		{
			"product_id": "45",
			"purchased_at": "2020-01-11 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 150000,
			"color": "Red"
		},
		{
			"product_id": "56",
			"purchased_at": "2020-01-11 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 150000,
			"color": "Yello",
			"is_discount": true,
			"is_gift": true,
			"weight": 0.5
		},
		{
			"product_id": "890",
			"purchased_at": "2020-01-11 09:12:09",
			"city": "Ho Chi Minh",
			"shop": "Yame",
			"amount": 150000,
			"color": "Yello",
			"is_discount": true,
			"shipping": true
		}
	]
}'
```

- Example response:

```json5
{
  "total_records": 5,
  "total_invalid_records": 0,
  "total_invalid_fields": 0,
  "total_skipped_records": 0,
  "total_inserted_records": 5,
  "total_failed_records": 0
}
```

7. Delete Data

You can delete the whole data in a specific table 

- Method: `DELETE`
- Endpoint: `/api/ingestion/:db/:tbl`
- Headers:
  + DI-SERVICE-KEY: Your service key to ingest/delete data
- Route params:
  + `db`: The database name
  + `tbl`: Table name

- Example Curl's request:

```shell
curl --request DELETE \
  --url http://localhost:5050/api/ingestion/shopping/purchased \
  --header 'Content-Type: application/json' \
  --header 'DI-SERVICE-KEY: 12345678'
```

- Example response:

```json5
true
```