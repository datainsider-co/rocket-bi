# Rocket BI

RocketBi is a self-service, web-based business intelligent product tailor-made for analytical databases. RocketBI is the core product of DataInsider
stack.
You can use RocketBI to analyze, visualize, and easily collaborate with your friends.

To learn more about DataInsider's stack and RocketBi's features, see our documentation

### Get started

##### Run RocketBI locally:

To try out RocketBI on your machine, the best way is using our pre-built Docker images.

1. Get our docker-compose file:

```bash
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/docker-compose.yml
```

2. Create a `.env` file with the following fields and fill those with your clickhouse's host, port, username, password and cluster name:

```
CLICKHOUSE_HOST: ""
CLICKHOUSE_HTTP_PORT: 8123
CLICKHOUSE_TCP_PORT: 9000
CLICKHOUSE_USERNAME: "default"
CLICKHOUSE_PASSWORD: ""
CLICKHOUSE_CLUSTER_NAME: ""
```

3. Start RocketBI with docker-compose:

```bash
docker-compose up -d
```

4. Explore your data:

- Open browser and go to `localhost:5050` to enter the web UI.
- Login to RocketBI with this default account:

```
username: hello@gmail.com
password: 123456
```

- Begin by creating a dashboard and adding desired charts into it.

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
  
### ExampLe: 

Adhoc-Query to explore data & quickly build visualization. There is also supported functions & autocompletion for sql query. 

![adhoc-query](https://user-images.githubusercontent.com/1466544/193296046-71bd45c9-cbd3-4550-ba35-cf417b499a64.gif)

Drag-n-Drop Chart Builder 

![chart-builder](https://user-images.githubusercontent.com/1466544/193296123-f03db4d9-f86d-4d7a-8046-97aa07d5fb05.gif)


Drilldown your data 

![drill-down](https://user-images.githubusercontent.com/1466544/193295771-1a7dc0a4-9fa6-48f8-a4cb-019c8a3c3183.gif)

No Code ETL data

![datacook](https://user-images.githubusercontent.com/1466544/193295814-447a184e-b0e7-4884-8c0f-b0234185895d.gif)

Share & Collaboration 

![share](https://user-images.githubusercontent.com/1466544/193295850-79b18ac6-9dd6-4cb1-8515-9b4a69ed6f29.gif)


.. and more 
