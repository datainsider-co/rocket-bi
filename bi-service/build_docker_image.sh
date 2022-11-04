#!/bin/sh
cd libs/ && ./install.sh && cd ..

mvn clean package && docker build --no-cache -t datainsiderco/bi-service:main .
