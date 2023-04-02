FROM openjdk:8-jre

WORKDIR /app

ENV NAME bi-service
ENV MODE development
ENV HTTP_PORT 8080
ENV THRIFT_PORT 8084

RUN curl -O https://repo.yandex.ru/clickhouse/tgz/stable/clickhouse-common-static-21.12.4.1.tgz
RUN curl -O https://repo.yandex.ru/clickhouse/tgz/stable/clickhouse-client-21.12.4.1.tgz
RUN tar -xzvf clickhouse-common-static-21.12.4.1.tgz
RUN clickhouse-common-static-21.12.4.1/install/doinst.sh
RUN tar -xzvf clickhouse-client-21.12.4.1.tgz
RUN clickhouse-client-21.12.4.1/install/doinst.sh

COPY ./dist /app/dist
COPY ./cmd /app/cmd
COPY ./conf /app/conf
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