# INSTALL & START

1. Install docker https://docs.docker.com/get-docker/
2. Install docker compose https://docs.docker.com/compose/install/
3. Clone this repos: `git clone https://github.com/datainsider-co/rocket-bi.git`
4. Create a network: `docker network create di_network`
5. Start this service: `docker-compose up -d`.
6. Access rocket-bi service at: `http://localhost:5050/`

```yaml
hello@gmail.com/123456
```

## Add New Accounts

You can add a new account in a configuration file: `./user-profile/conf/users.json`.

```yaml
[
  {
    "email": "hello@gmail.com",
    "password": "123456",
    "full_name": "Data Insider",
    "password_mode": "raw",
  },
]
```

Where:

- `email`: `String` - login email - **required**
- `password`: `String` - login password - **required**
- `full_name`: `String` - full name - **optional**
- `password_mode`: `String` - password mode - **required** - Accept `raw` or `hash` only.
  - `raw`: A raw password string.
  - `hash`: SHA-256 hash string of your password.

**Note**: You can generate SHA-256 hash at: https://emn178.github.io/online-tools/sha256.html

Let's say, you want to add a new account for `John Smith`, `email`=`john21@gmail.com` with `password`=`as231sf` in hash mode.

We have SHA256 of `as231sf` is: `79743f89e5f84ac802a05795d2b21bf1eba411adaeb3766fb4c0df71cf21a865`.

Then, the configuration file ( `./user-profile/conf/users.json`) should looks like below:

```yaml
[
  {
    "email": "hello@gmail.com",
    "password": "123456",
    "full_name": "Tester",
    "password_mode": "raw",
  },
  {
    "email": "john21@gmail.com",
    "password": "79743f89e5f84ac802a05795d2b21bf1eba411adaeb3766fb4c0df71cf21a865",
    "full_name": "John Smith",
    "password_mode": "hash",
  },
]
```

## DI Service Key

In order to ingest data, you need to have a `service key`. You can find it at `./ingestion-service/conf/production.conf`. Default value is `12345678`

```yaml
service_key = 12345678
```

## Ingest Data

- Method: `POST`
- Endpoint: `/api/ingestion`
- Headers:

  - DI-SERVICE-KEY: Your service key

- Body: A JSONObject

  - `db_name`: Database name - Only [a-zA-Z0-9] character.
  - `tbl_name`: Table name
  - `records`: An array of map with the key is your property's name and the value is its value.

- Example CURL:

The following example will ingest data to database `shopping` and table `purchased`. It will create a new database and
table if the database or table is not exists yet.

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
  total_records: 5,
  total_invalid_records: 0,
  total_invalid_fields: 0,
  total_skipped_records: 0,
  total_inserted_records: 5,
  total_failed_records: 0,
}
```

## Delete Data

You can delete the whole data in a specific table

- Method: `DELETE`
- Endpoint: `/api/ingestion/:db/:tbl`
- Headers:
  - DI-SERVICE-KEY: Your service key to ingest/delete data
- Route params:

  - `db`: The database name
  - `tbl`: Table name

- Example cURL:

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
