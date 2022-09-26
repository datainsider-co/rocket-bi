#!/bin/sh
cd libs/ && ./install.sh && cd ..

mvn clean package && docker build --no-cache -t registry.gitlab.com/datainsider/bi-service:oss .
