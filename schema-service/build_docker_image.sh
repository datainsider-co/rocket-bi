#!/bin/sh
cd libs/ && ./script.sh && cd ..

<<<<<<< Updated upstream
mvn clean package -DskipTests && docker build --no-cache -t registry.gitlab.com/datainsider/ingestion-service:dev .
=======
mvn clean package -DskipTests && docker build --no-cache -t registry.gitlab.com/datainsider/ingestion-service:oss .
>>>>>>> Stashed changes
