#!/bin/sh
git pull

docker build --no-cache -t registry.gitlab.com/datainsider/web:dev .
