#!/bin/sh

tag=${1:-latest}

docker build -t rocket-bi-server:$tag .
