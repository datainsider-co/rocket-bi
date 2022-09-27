FROM openjdk:8-jre
#EVN vars
ENV NAME ""
ENV MODE development
ENV HTTP_PORT 0
ENV THRIFT_PORT 0

RUN mkdir -p /app

#install clickhouse-client
RUN curl -O https://repo.clickhouse.com/tgz/stable/clickhouse-common-static-21.12.4.1.tgz
RUN curl -O https://repo.clickhouse.com/tgz/stable/clickhouse-client-21.12.4.1.tgz
RUN tar -xzvf clickhouse-common-static-21.12.4.1.tgz
RUN clickhouse-common-static-21.12.4.1/install/doinst.sh
RUN tar -xzvf clickhouse-client-21.12.4.1.tgz
RUN clickhouse-client-21.12.4.1/install/doinst.sh

#install zip
RUN apt-get update -qq
RUN apt-get install -y zip

COPY ./dist /app/dist
COPY ./conf /app/conf
COPY ./cmd /app/cmd
COPY ./entrypoint.sh /app/entrypoint.sh

WORKDIR /app
# set the startup command to execute the jar
VOLUME ["/app/conf"]
VOLUME ["/app/logs"]
EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
