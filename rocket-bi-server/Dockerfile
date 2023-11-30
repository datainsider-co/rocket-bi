FROM openjdk:8-jre

WORKDIR /app

ENV NAME rocket-bi-server
ENV MODE development
ENV HTTP_PORT 8080
ENV THRIFT_PORT 8084

RUN wget https://github.com/ClickHouse/ClickHouse/releases/download/v21.12.3.32-stable/clickhouse-common-static-21.12.3.32.tgz
RUN wget https://github.com/ClickHouse/ClickHouse/releases/download/v21.12.3.32-stable/clickhouse-client-21.12.3.32.tgz
RUN tar -xzvf clickhouse-common-static-21.12.3.32.tgz
RUN clickhouse-common-static-21.12.3.32/install/doinst.sh
RUN tar -xzvf clickhouse-client-21.12.3.32.tgz
RUN clickhouse-client-21.12.3.32/install/doinst.sh

#install zip
RUN apt-get update -qq
RUN apt-get install -y zip

# install python3 for data-cook
RUN apt-get install -y python3 python3-pip
RUN pip3 install clickhouse-connect

COPY ./dist /app/dist
COPY ./cmd /app/cmd
COPY ./conf /app/conf
COPY ./sql /app/sql
COPY ./mapdata /app/mapdata
COPY ./runservice /app/runservice
COPY ./entrypoint.sh /app/entrypoint.sh

VOLUME ["/app/conf"]
VOLUME ["/app/logs"]
VOLUME ["/app/cmd"]

EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
