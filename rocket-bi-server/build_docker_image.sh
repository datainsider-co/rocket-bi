#!/bin/sh
cd libs/ && ./install.sh && cd ..

mvn clean package && docker build --no-cache -t registry.gitlab.com/datainsider/rocketbi_v2/rocket-bi-server:dev .
