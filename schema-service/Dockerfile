FROM openjdk:8-jre

ENV NAME ingestion-service
ENV MODE development
ENV HTTP_PORT 8489
ENV THRIFT_PORT 8487

WORKDIR /app

#install clickhouse-client
RUN curl -O https://repo.yandex.ru/clickhouse/tgz/stable/clickhouse-common-static-21.12.4.1.tgz
RUN curl -O https://repo.yandex.ru/clickhouse/tgz/stable/clickhouse-client-21.12.4.1.tgz
RUN tar -xzvf clickhouse-common-static-21.12.4.1.tgz
RUN clickhouse-common-static-21.12.4.1/install/doinst.sh
RUN tar -xzvf clickhouse-client-21.12.4.1.tgz
RUN clickhouse-client-21.12.4.1/install/doinst.sh

#install zip
RUN apt-get update -qq
RUN apt-get install -y zip

# install python3 for data-cook
RUN apt-get install -y python3 python3-pip
RUN pip3 install clickhouse-connect

COPY ./dist /app/dist
COPY ./conf /app/conf
COPY ./sql /app/sql
COPY ./cmd /app/cmd
COPY ./entrypoint.sh /app/entrypoint.sh

# set the startup command to execute the jar
VOLUME ["/app/conf"]
VOLUME ["/app/logs"]
VOLUME ["/app/sql"]

EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
