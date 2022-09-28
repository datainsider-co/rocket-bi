#!/bin/bash -e
DIR=$( cd `dirname $0` && pwd )
COMPILE=false
BUILD=false
PUSH=false
TAG=latest
while [[ $# -gt 0 ]]
do
key="$1"
echo "Recieved key: ${key}"
case $key in
    -t)
        TAG=$2
	shift
    ;;
    compile)
	COMPILE=true
    ;;
    build)
	BUILD=true
    ;;
    push)
	PUSH=true
    ;;
    all)
	COMPILE=true
	BUILD=true
	PUSH=true
	;;
    *)
            # unknown option
    ;;
esac
shift # past argument or value
done
echo "Compile source: ${COMPILE}"
echo "Build images:   ${BUILD}"
echo "Push images:    ${PUSH}"
if [[ "x$TAG" == "x" ]]; then
    echo "Tag name cannot be empty"
    exit 1
fi
if [[ "x$COMPILE" == "xtrue" ]]; then
    cd ${DIR} && mvn clean && mvn package -DskipTests
fi
cd $DIR
if [[ "x$BUILD" == "xtrue" ]]; then
    echo "Building images..."
    docker build --no-cache -f ${DIR}/caas-service/Dockerfile -t datainsiderco/caas-service:${TAG} ${DIR}/caas-service
    docker build --no-cache -f ${DIR}/bi-service/Dockerfile -t datainsiderco/bi-service:${TAG} ${DIR}/bi-service
    docker build --no-cache -f ${DIR}/schema-service/Dockerfile -t datainsiderco/schema-service:${TAG} ${DIR}/schema-service
    docker build --no-cache -f ${DIR}/rocket-bi-web/Dockerfile -t datainsiderco/rocket-bi-web:${TAG} ${DIR}/rocket-bi-web
fi
