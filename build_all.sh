#!/bin/bash -e
DIR=$(cd $(dirname $0) && pwd)
REGISTRY='datainsiderco'
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
  build)
    BUILD=true
    ;;
  push)
    PUSH=true
    ;;
  all)
    BUILD=true
    PUSH=true
    ;;
  *)
    # unknown option
    ;;
  esac
  shift # past argument or value
done

echo "Build sources:   ${BUILD}"
echo "Push images:    ${PUSH}"

if [[ "x$TAG" == "x" ]]; then
  echo "Tag name cannot be empty"
  exit 1
fi

if [[ "x$BUILD" == "xtrue" ]]; then
  cd ${DIR}/bi-service && ./build.sh
  cd ${DIR}/caas-service && ./build.sh
#  cd ${DIR}/schema-service && ./build.sh
fi

cd $DIR

if [[ "x$PUSH" == "xtrue" ]]; then
  echo "Build and push images to registry..."
  # bi-service
  docker build -f ${DIR}/bi-service/Dockerfile -t ${REGISTRY}/bi-service:${TAG} ${DIR}/bi-service
  docker push ${REGISTRY}/bi-service:${TAG}
  # caas-service
  docker build -f ${DIR}/caas-service/Dockerfile -t ${REGISTRY}/caas-service:${TAG} ${DIR}/caas-service
  docker push ${REGISTRY}/caas-service:${TAG}

  # build tag 'latest' for every build except for tag latest itself
  if [[ "x$TAG" != "xlatest" ]]; then
    echo "Create latest tags..."
    # bi-service
    docker tag ${REGISTRY}/bi-service:${TAG} ${REGISTRY}/bi-service:latest
    docker push ${REGISTRY}/bi-service:latest
    # caas-service
    docker tag ${REGISTRY}/caas-service:${TAG} ${REGISTRY}/caas-service:latest
    docker push ${REGISTRY}/caas-service:latest
  fi
fi
