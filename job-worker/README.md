### job-worker

⚠️ Need clickhouse-client version `21.12.4.1`

+ Install clickhouse-client
```bash
curl -O https://repo.clickhouse.com/tgz/stable/clickhouse-common-static-21.12.4.1.tgz
curl -O https://repo.clickhouse.com/tgz/stable/clickhouse-client-21.12.4.1.tgz
tar -xzvf clickhouse-common-static-21.12.4.1.tgz
sudo clickhouse-common-static-21.12.4.1/install/doinst.sh
tar -xzvf clickhouse-client-21.12.4.1.tgz
sudo clickhouse-client-21.12.4.1/install/doinst.sh
```
+ Install 3rd party

```bash
cd libs
bash install.sh
```
