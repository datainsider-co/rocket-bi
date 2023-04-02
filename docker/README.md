Rocket-BI 

Start RocketBI with our pre-built docker images.

Requirements:
- docker engine 20.10.0 or later.
- docker-compose v2.3.4 or later.

Steps:
1. Get docker-compose.yml and configuration file:
```
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/docker-compose.yml
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/.clickhouse.env
```
2. Edit `.clickhouse.env`, add clickhouse server information.
**NOTE:** If you're installing RocketBI on the same host with your clickhouse-server, please use Docker host network IP (normally  `172.17.0.1`) as  your CLICKHOUSE_HOST instead of `localhost` for docker to resolve IP correctly.

3. Start RocketBI by run command: `docker-compose up -d`.
4. Open browser, go to `localhost:5050`, login with this account: `hello@gmail.com/123456`.
