#!/bin/sh
git pull

docker build --no-cache -t datainsiderco/rocket-bi-web:main .
