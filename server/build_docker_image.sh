#!/bin/sh

tag=${1:-latest}

docker build -t datainsiderco/rocket-bi-server:$tag .
