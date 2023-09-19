FROM openjdk:8-jre

WORKDIR /app

ENV NAME rocket-bi-server
ENV MODE development
ENV HTTP_PORT 8080
ENV THRIFT_PORT 8084

#install zip
RUN apt-get update -qq
RUN apt-get install -y zip
RUN apt-get install -y clickhouse-client

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
