#!/bin/sh
cd libs/ && ./script.sh && cd ..

mvn clean package -DskipTests && docker build --no-cache -t registry.gitlab.com/datainsider/schema-service:oss .
