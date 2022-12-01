#!/bin/bash -e
DIR=$(cd $(dirname $0) && pwd)
REGISTRY='datainsiderco'
COMPILE=false
BUILD=false
PUSH=false
TAG=latest

while [[ $# -gt 0 ]]; do
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
  cd ${DIR}/bi-service && ./build.sh
#  cd ${DIR}/caas-service && ./build.sh
#  cd ${DIR}/schema-service && ./build.sh
fi

cd $DIR

if [[ "x$BUILD" == "xtrue" ]]; then
  echo "Building images..."
  docker build -f ${DIR}/bi-service/Dockerfile -t ${REGISTRY}/bi-service:${TAG} ${DIR}/bi-service

  if [[ "x$TAG" != "xlatest" ]]; then
    echo "Create latest tag."
    docker tag ${REGISTRY}/bi-service:${TAG} ${REGISTRY}/bi-service:latest
  fi
fi

if [[ "x$PUSH" == "xtrue" ]]; then
  echo "Push images to registry..."
  docker push ${REGISTRY}/bi-service:${TAG}

  if [[ "x$TAG" != "xlatest" ]]; then
    docker push ${REGISTRY}/bi-service:latest
  fi
fi
