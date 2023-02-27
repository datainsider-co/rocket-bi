Rocket-BI 

Start RocketBI with our pre-built docker images.

Steps:
1. Get docker-compose.yml and configuration file:
```
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/docker-compose.yml
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/.clickhouse.env
```
2. Edit `.clickhouse.env`, add clickhouse server information.
3. Start RocketBI by run command: `docker-compose up -d`.
4. Open browser, go to `localhost:5050`, login with this account: `hello@gmail.com/123456`.
