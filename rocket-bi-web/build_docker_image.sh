#!/bin/sh
git pull

docker build --no-cache -t registry.gitlab.com/datainsider/rocketbi_v2/rocket-bi-web:dev .
