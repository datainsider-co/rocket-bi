# Rocket BI

RocketBi is a self-service, web-based business intelligent product tailor-made for analytical databases. RocketBI is the core product of DataInsider stack. 
You can use RocketBI to analyze, visualize, and easily collaborate with your friends. 

To learn more about DataInsider's stack and RocketBi's features, see our documentation


### Get started


##### Run RocketBI locally:

To try out RocketBI on your machine, the best way is using our pre-built Docker images.

1. Open docker directory:
```
cd docker/
```

2. Update `clickhouse_connection_settings.json` with your clickhouse's host, port, username, password and cluster name.


3. Start RocketBI with docker-compose:
```
docker-compose up -d
```

4. Explore your data:
- Open browser and go to `localhost` to enter the web UI.
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
```
cd <service_dir>

// install needed libraries:
./libs/install.sh

// build source:
mvn package

// config mysql and ssdb host/port (default port for mysql is localhost:3306 and for ssdb is localhost:8888):
// vi conf/local.conf

// start service locally:
./runservice start local
```

Services will be start at specific port specify in `conf/local.conf` file. For example, the default http port for bi-service is 8080, to test if bi-service is up and running, run:
```
curl localhost:8080/ping
```

To stop a service, run:
```
./runservice stop
```


#### Web client:
Prerequisites:
- node v12.22.9
- yarn 1.22.19


Start building web client by running:
```
cd client/

// build and serve web
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
