## Rocket-BI

### Installation

#### For new installation

Run RocketBI with our pre-built docker images.

Requirements:

+ docker engine 20.10.0 or later.
+ docker-compose v2.3.4 or later.

**1.** Get docker-compose.yml and configuration file:

```bash
wget https://raw.githubusercontent.com/datainsider-co/rocket-bi/main/docker/docker-compose.yml
```

**2.** Start RocketBI by run command:

```bash
docker-compose up -d
```

**3.** Open browser, go to [localhost:5050](http://localhost:5050), login with this
account: `hello@gmail.com/123456`

#### For existing installation

1. Checkout release note and breaking changes in [CHANGELOG.md](../rocket-bi-web/CHANGELOG.md).
2. [Optional] Backup your data in mysql database.
3. Run command for update docker images:

```bash
docker-compose pull
```

4. Run command for complete update RocketBI:

```bash
docker-compose up -d
```
