#!/bin/bash

for entry in ./*.jar
do
  mvn org.apache.maven.plugins:maven-install-plugin:2.5.2:install-file -Dfile=$entry
done

for entry in ./*.pom
do
  mvn org.apache.maven.plugins:maven-install-plugin:2.5.2:install-file -Dfile=$entry -Dpackaging=pom -DpomFile=$entry
done
