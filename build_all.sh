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
  cd ${DIR}/rocket-bi-server && ./build.sh
fi

cd $DIR

if [[ "x$PUSH" == "xtrue" ]]; then
  echo "Build and push images to registry..."
  # rocket-bi-server
  docker build -f ${DIR}/rocket-bi-server/Dockerfile -t ${REGISTRY}/rocket-bi-server:${TAG} ${DIR}/rocket-bi-server
  docker push ${REGISTRY}/rocket-bi-server:${TAG}
  # rocket-bi-web
  docker build -f ${DIR}/rocket-bi-web/Dockerfile -t ${REGISTRY}/rocket-bi-web:${TAG} ${DIR}/rocket-bi-web
  docker push ${REGISTRY}/rocket-bi-web:${TAG}
fi
