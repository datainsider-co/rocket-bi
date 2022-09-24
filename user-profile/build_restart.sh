#!/bin/sh
mvn clean package -DskipTests && docker-compose build --force && docker-compose up -d