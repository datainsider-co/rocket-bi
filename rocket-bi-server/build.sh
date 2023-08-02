#!/bin/sh
cd libs/ && ./install.sh && cd ..

mvn clean package
