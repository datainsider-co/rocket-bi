#!/bin/sh
cd libs/ && ./script.sh && cd ..

mvn clean package -DskipTests && docker build --no-cache -t datainsiderco/schema-service:oss .
