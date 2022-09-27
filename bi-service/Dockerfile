FROM openjdk:8-jre

WORKDIR /app

ENV NAME bi-service
ENV MODE development
ENV HTTP_PORT 8080
ENV THRIFT_PORT 8084

COPY ./dist /app/dist
COPY ./cmd /app/cmd
COPY ./conf /app/conf
COPY ./entrypoint.sh /app/entrypoint.sh

VOLUME ["/app/logs"]

EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
