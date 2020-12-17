#!/bin/bash

while getopts k:f: option
do
case "${option}"
in
k) serviceKey=${OPTARG};;
f) file=${OPTARG};;
esac
done

echo "sk=$serviceKey"
echo "file=$file"

[ ! $serviceKey ] && { echo "DI Service Key not found"; exit 98;}

[ ! -f $file ] && { echo "$file file not found"; exit 99; }

OLDIFS=$IFS
IFS=','
headers =

while  read -r -a fields
do
	if [ !  -a $headers ]
	then
	  headers=$fields;
	  echo "$fields";
	else
	  echo "__"
	fi
done < $file

IFS=$OLDIFS
