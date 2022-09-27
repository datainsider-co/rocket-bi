FROM openjdk:8-jre

WORKDIR /app

ENV NAME user-profile
ENV MODE development
ENV HTTP_PORT 8580
ENV THRIFT_PORT 8589

COPY ./dist /app/dist
COPY ./conf /app/conf
COPY ./sql /app/sql
COPY ./cmd /app/cmd
COPY ./entrypoint.sh /app/entrypoint.sh

VOLUME ["/app/logs"]

EXPOSE $HTTP_PORT
EXPOSE $THRIFT_PORT

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
