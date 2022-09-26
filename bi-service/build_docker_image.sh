#!/bin/sh
cd libs/ && ./install.sh && cd ..

mvn clean package -DskipTests && docker build --no-cache -t registry.gitlab.com/datainsider/bi-service:oss .
