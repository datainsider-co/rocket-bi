#!/bin/sh
cd libs && ./install.sh && cd ../

mvn clean package -DskipTests && docker build --no-cache -t datainsiderco/caas-service:main .
