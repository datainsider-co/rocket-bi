#!/bin/sh

tag=${1:-latest}

docker build --no-cache -t datainsiderco/rocket-bi-server:$tag .
