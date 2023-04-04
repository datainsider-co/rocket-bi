Rocket-BI 

Start RocketBI with our pre-built docker images.

Requirements:
- docker engine 20.10.0 or later.
- docker-compose v2.3.4 or later.

**Step #1**
Get docker-compose.yml and configuration file:
```
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/docker-compose.yml
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/.clickhouse.env
```
**Step #2**

Edit `.clickhouse.env`, add clickhouse server information:
- Provide host, http port, tcp port, username and password of the clickhouse server that you want to connect RocketBI to. 
- If you want to connect to a specific cluster, please provide that cluster name in CLICKHOUSE_CLUSTER_NAME field, else leave it blank.
- If you connect to a Clickhouse Cloud instance, please use encrypted http and tcp ports (default is 8443 and 9440 for http port and tcp port respectively), and with CLICKHOUSE_ENCRYPTED_CONN flag set to true.

NOTE: If you're installing RocketBI on the same host with your clickhouse-server, please use Docker host network IP (normally  `172.17.0.1`) as  your CLICKHOUSE_HOST instead of `localhost` for docker to resolve IP correctly.

**Step #3** Start RocketBI by run command: `docker-compose up -d`

**Step #4** Open browser, go to `localhost:5050`, login with this account: `hello@gmail.com/123456`
