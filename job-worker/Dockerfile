FROM openjdk:8-jre
#EVN vars
ENV NAME job-worker
ENV MODE development
ENV HTTP_PORT 8080
ENV THRIFT_PORT 0

WORKDIR /app

RUN curl -O https://repo.yandex.ru/clickhouse/tgz/stable/clickhouse-common-static-21.12.4.1.tgz
RUN curl -O https://repo.yandex.ru/clickhouse/tgz/stable/clickhouse-client-21.12.4.1.tgz
RUN tar -xzvf clickhouse-common-static-21.12.4.1.tgz
RUN clickhouse-common-static-21.12.4.1/install/doinst.sh
RUN tar -xzvf clickhouse-client-21.12.4.1.tgz
RUN clickhouse-client-21.12.4.1/install/doinst.sh

COPY ./dist /app/dist
COPY ./conf /app/conf
COPY ./cmd /app/cmd
COPY ./runservice /app/runservice
COPY ./entrypoint.sh /app/entrypoint.sh

# set the startup command to execute the jar
VOLUME ["/app/conf"]
VOLUME ["/app/logs"]
VOLUME ["/app/cmd"]

EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
