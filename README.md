# Rocket BI

RocketBI is a self-service, web-based business intelligent product tailor-made for analytical databases. RocketBI is the core product of DataInsider
stack.
You can use RocketBI to analyze, visualize, and easily collaborate with your friends.

To learn more about DataInsider's stack and RocketBi's features, see our documentation

### Get started

##### Run RocketBI locally:

To try out RocketBI on your machine, the best way is using our pre-built Docker images.

Prerequisites:
- docker engine 19.0+
- docker-compose 2.0+

1. Prepare:

```bash
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/docker-compose.yml

wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/.clickhouse.env
```

Edit `.clickhouse.env` with your clickhouse server's host, port, username, password and cluster name.

**NOTE:** If you're installing RocketBI on the same host with your clickhouse-server, please use `172.17.0.1` as  your CLICKHOUSE_HOST instead of `localhost` for docker to resolve hosts correctly.

2. Start RocketBI:

```bash
docker-compose up -d
```

3. Explore your data:

- Open browser and go to `localhost:5050` to enter the web UI.
- Login to RocketBI with this default account:

```
username: hello@gmail.com
password: 123456
```

- Begin by creating a dashboard and using drag-n-drop tool to explore your data.

### Build from source:

#### Server services:

Prerequisites:

- java 8
- maven 3
- mysql 5.7
- ssdb 1.9.9

There are 3 services that RocketBI relies on: `bi-service`, `caas-service` and `schema-service`.
To build a service:

```bash
cd <service_dir>

# install needed libraries:
./libs/install.sh

# build source:
mvn package

# config mysql and ssdb host/port (default port for mysql is localhost:3306 and for ssdb is localhost:8888):
vi conf/local.conf

# start service locally:
./runservice start local
```

Services will be start at specific port specify in `conf/local.conf` file. For example, the default http port for bi-service is 8080, to test if
bi-service is up and running, run:

```
curl localhost:8080/ping
```

To stop a service, run:

```
./runservice stop
```

#### Rocket-bi web UI:

Prerequisites:

- node v12.22.9
- yarn 1.22.19

Start building web client by running:

```bash
cd rocket-bi-web
yarn serve
```

Web will be served at port 8080.

### Documentation

For the complete documentation visit [datainsider.co](https://docs.datainsider.co/).

### Contribute

For contribution guidelines, see [contributing](/contributing.md).

### Questions? Problems? Suggestions?

* To report a bug or request a feature, create a
  [Issue](https://github.com/datainsider-co/rocket-bi/issues/new). Please make it easy for people to reproduce your issue.
  
### Example: 

![Animation](https://user-images.githubusercontent.com/19279051/194230899-e9911c22-93a8-465f-ab2d-09d59c0095e9.gif)


Adhoc-Query to explore data & quickly build visualization. There is also supported functions & autocompletion for sql query. 

![adhoc query](https://user-images.githubusercontent.com/19279051/193552439-9bc97cc4-d599-4a82-835d-c958932296eb.jpg)


Drag-n-Drop Chart Builder 

![chart builder](https://user-images.githubusercontent.com/19279051/193552493-290051b8-0056-449a-aa8f-6dcf639892e4.jpg)


Interactive Dashboard

![dashboard](https://user-images.githubusercontent.com/19279051/193552728-758d5501-e36e-424b-9232-7a2ab8a6f340.jpg)


Apply filter to Dashboard

![dash filter](https://user-images.githubusercontent.com/19279051/193552790-e0491b21-c57e-42e7-83d8-28db01f1b6bc.jpg)


Add Control to Chart

![chart control](https://user-images.githubusercontent.com/19279051/193552863-9e189c20-512b-4c86-bf17-795c85877ef9.jpg)


Drilldown your data 

![drill down](https://user-images.githubusercontent.com/19279051/193552519-221865d5-2adb-4624-8bd1-ac8c72d7cffd.jpg)


No Code ETL data

![no code etl](https://user-images.githubusercontent.com/19279051/193552548-93816afc-9fba-4549-931b-5b097604652a.jpg)


Row-Level Security

![rls](https://user-images.githubusercontent.com/19279051/193552945-6fd9175f-08a6-405f-a358-dcfa87957998.jpg)


Share & Collaboration 

![share](https://user-images.githubusercontent.com/19279051/193552578-59c9f5a6-095d-405f-832e-5b7133bc0d2e.jpg)


.. and more 
