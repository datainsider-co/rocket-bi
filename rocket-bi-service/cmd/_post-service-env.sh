#!/bin/sh

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# jvm arguments

if [ "$APP_PROF" = "development" ]; then
JVM_EA="-ea"
fi

#jmx
if [ "x$JVM_JMX_HOST" != "x" ] && [ "x$JVM_JMX_PORT" != "x" ]; then
JVM_JMX_ARGS="-Djava.rmi.server.hostname=$JVM_JMX_HOST \
	-Dcom.sun.management.jmxremote.port=$JVM_JMX_PORT \
	-Dcom.sun.management.jmxremote.ssl=false \
	-Dcom.sun.management.jmxremote.authenticate=false"
fi

#jdwp
if [ "x$JVM_JDWP_PORT" != "x" ]; then
JVM_JDWP_ARGS="-Xdebug -Xrunjdwp:transport=dt_socket,address=$JVM_JDWP_PORT,server=y,suspend=n"
fi

# GC tuning
JVM_GCTUNE_ARGS="-XX:+UseParNewGC \
	-XX:+UseConcMarkSweepGC \
	-XX:+CMSParallelRemarkEnabled \
	-XX:SurvivorRatio=8 \
	-XX:MaxTenuringThreshold=1 \
	-XX:CMSInitiatingOccupancyFraction=75 \
	-XX:+UseCMSInitiatingOccupancyOnly \
	-XX:+UseTLAB"

# note: bash evals '1.7.x' as > '1.7' so this is really a >= 1.7 jvm check
if [ "$JVM_VERSION" \> "1.7" ] && [ "$JVM_ARCH" = "64-Bit" ] ; then
	JVM_GCTUNE_ARGS="$JVM_GCTUNE_ARGS -XX:+UseCondCardMark"
fi

#jvm args
JVM_ARGS="$JVM_EA \
	-Dname=$APP_NAME \
	-Dmode=$APP_PROF"

if [ "x$JVM_JMX_ARGS" != "x" ]; then
JVM_ARGS="$JVM_ARGS $JVM_JMX_ARGS"
fi

if [ "x$JVM_JDWP_ARGS" != "x" ]; then
JVM_ARGS="$JVM_ARGS $JVM_JDWP_ARGS"
fi

if [ "x$JVM_XMS" != "x" ]; then
JVM_ARGS="$JVM_ARGS -Xms$JVM_XMS"
fi

if [ "x$JVM_XMX" != "x" ]; then
JVM_ARGS="$JVM_ARGS -Xmx$JVM_XMX"
fi

if [ "x$JVM_XMN" != "x" ]; then
JVM_ARGS="$JVM_ARGS -Xmn$JVM_XMN"
fi

# enable thread priorities, primarily so we can give periodic tasks
# a lower priority to avoid interfering with client workload
JVM_ARGS="$JVM_ARGS -XX:+UseThreadPriorities"
# allows lowering thread priority without being root.  see
# http://tech.stolsvik.com/2010/01/linux-java-thread-priorities-workaround.html
JVM_ARGS="$JVM_ARGS -XX:ThreadPriorityPolicy=42"

if [ "x$JVM_GCTUNE_ARGS" != "x" ]; then
JVM_ARGS="$JVM_ARGS $JVM_GCTUNE_ARGS"
fi

if [ "x$JVM_EXTRA_ARGS" != "x" ]; then
JVM_ARGS="$JVM_ARGS $JVM_EXTRA_ARGS"
fi

