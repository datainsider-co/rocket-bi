FROM java:8-jdk

WORKDIR /app

COPY ./dist /app/dist
COPY ./cmd /app/cmd
COPY ./conf /app/conf
COPY ./sql /app/sql
COPY ./mapdata /app/mapdata
COPY ./runservice /app/runservice

VOLUME ["/app/conf"]
VOLUME ["/app/logs"]
VOLUME ["/app/cmd"]

ENV NAME rocket-bi-server
ENV CLASS_PATH ""
ENV MODE development
ENV HTTP_PORT 8080
ENV THRIFT_PORT 8084

EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./runservice
ENTRYPOINT ["./runservice", "run"]
