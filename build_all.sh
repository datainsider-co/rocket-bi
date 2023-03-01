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
  cd ${DIR}/schema-service && ./build.sh
  cd ${DIR}/job-scheduler && ./build.sh
  cd ${DIR}/job-worker && ./build.sh
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
  # schema-service
  docker build -f ${DIR}/schema-service/Dockerfile -t ${REGISTRY}/schema-service:${TAG} ${DIR}/schema-service
  docker push ${REGISTRY}/schema-service:${TAG}
  # job-scheduler
  docker build -f ${DIR}/job-scheduler/Dockerfile -t ${REGISTRY}/job-scheduler:${TAG} ${DIR}/job-scheduler
  docker push ${REGISTRY}/job-scheduler:${TAG}
  # job-worker
  docker build -f ${DIR}/job-worker/Dockerfile -t ${REGISTRY}/job-worker:${TAG} ${DIR}/job-worker
  docker push ${REGISTRY}/job-worker:${TAG}
  # rocket-bi-web
  docker build -f ${DIR}/rocket-bi-web/Dockerfile -t ${REGISTRY}/rocket-bi-web:${TAG} ${DIR}/rocket-bi-web
  docker push ${REGISTRY}/rocket-bi-web:${TAG}
fi
