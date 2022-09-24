#!/bin/sh

#
# Common options need to change: JVM_XMX, JVM_JMX_HOST, JVM_JMX_PORT
#
#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# common attributes
CONF_FILES=config.ini

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# app arguments: empty means disable or not-available

APP_ARGS=""

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# jvm arguments: empty means disable or not-available

#auto the heap max size ($MAX_HEAP_SIZE) or leave it's empty  or custom the heap max size
JVM_XMX=2048M
#auto the heap min size ($JVM_XMX) or leave it's empty  or custom the heap min size
JVM_XMS=
#auto the heap new size ($HEAP_NEWSIZE) or leave it's empty  or custom the heap new size
JVM_XMN=
#jmx monitoring
JVM_JMX_HOST=
JVM_JMX_PORT=
#remote debug
JVM_JDWP_PORT=

#jvm extra options
JVM_EXTRA_ARGS=""

