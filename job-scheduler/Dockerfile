FROM openjdk:8-jre
#EVN vars
ENV NAME job-scheduler
ENV MODE production
ENV HTTP_PORT 8080
ENV THRIFT_PORT 0

RUN mkdir -p /app
COPY ./dist /app/dist
COPY ./conf /app/conf
COPY ./cmd /app/cmd
COPY ./runservice /app/runservice
COPY ./entrypoint.sh /app/entrypoint.sh

WORKDIR /app
# set the startup command to execute the jar
VOLUME ["/app/conf"]
VOLUME ["/app/logs"]
VOLUME ["/app/cmd"]

EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]