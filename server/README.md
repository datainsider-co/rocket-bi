### Rocket-BI Server

In order to start the project, you need to install the following software:

- [java:8](https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html)
- [maven:3.6.3](https://maven.apache.org/download.cgi)
- [clickhouse-server:21.12](https://clickhouse.com/docs/en/install)
- [clickhouse-client](https://clickhouse.com/docs/en/install)
- [ssdb:1.9.9](https://github.com/ideawu/ssdb)
- [mysql:5.7](https://dev.mysql.com/downloads/mysql/5.7.html)
- [python3](https://www.python.org/downloads/)
- [clickhouse-connect](https://clickhouse.com/docs/en/integrations/superset)
- [zip](https://linuxize.com/post/how-to-unzip-files-in-linux/)

### Getting Started

#### Start in development

+ Install dependencies:

```sh
chmod +x install_dependencies.sh
./install_dependencies.sh
```

+ Build project:

```sh
mvn clean package -DskipTests
```

+ Start project with development:

```sh
./runservice.sh start development
```

Test service is running:

```sh
curl localhost:8080/ping

# Response:
{"status":"ok","data":"pong"}
```

+ Run test case:

```sh
mvn test
```

#### Production in docker

+ Build docker image:

```sh
chmod +x build_docker_image.sh
./build_docker_image.sh
```

+ Start project with production:

```sh
docker-compose up -d
```

### Microservice Modules

Use can run each module independently.

```sh
./runservice.sh start development <class-path>
```

| class-path                               | description                    |
|------------------------------------------|--------------------------------|
| co.datainsider.bi.JobWorkerServer        | Job worker module              |
| co.datainsider.bi.JobSchedulerServer     | Scheduler module               |
| co.datainsider.bi.BiServer               | BI application                 |
| co.datainsider.bi.CaasServer             | Authentication & Authorization |
| co.datainsider.bi.DataCookWorkerServer   | Datacook worker                |
| co.datainsider.bi.DataCookScheduleServer | Datacook application           |

### License

View [Here](LICENSE).
