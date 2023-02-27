#!/bin/sh
################################################################################
# Required: run this script from the project home directory
#
# Guide: to be able use this script, project should be built by ant or maven
#  , so that it will pack a manifest info for execution into distrib jar file
#  To build a netbeans project with ant, go to project home directory (location of build.xml)
#  , then run "ant jar" command (may run "ant clean" for clean the previous build before)
#
################################################################################
#
# Common options need to change: APP_NAME, APP_VER
#
# $1: Service action: try/start/stop/restart/status
# $2: Application profile: production/development (default is production)
#
#
OS="`uname`"
case $OS in
	'Darwin')
		alias readlink=greadlink
		;;
esac

ENTRY_PATH=`readlink -f $0`
PROJECT_HOME=`dirname $ENTRY_PATH`
CMD_DIR=cmd
CONF_DIR=conf
JAR_DIR=dist
cd $PROJECT_HOME
#setup JAVA environment
. $PROJECT_HOME/$CMD_DIR/_sys-env.sh

################################################################################
#setup Application environment
APP_NAME="$NAME"
#APP_VER="1.0"
#JAR_NAME= #define if JAR_NAME is a customized name which is not based on APP_NAME & APP_VER
APP_PROF="$MODE"
################################################################################
#do work
#
#name of jar
if [ "x$JAR_NAME" = "x" ]; then
if [ "x$APP_VER" != "x" ]; then
JAR_NAME="$APP_NAME-$APP_VER"
else
JAR_NAME="$APP_NAME"
fi
fi

TMP_DIR="logs/tmp"
LOG_DIR="logs"



#pid file
PID_FILE="$APP_NAME.pid"
if [ "x$PID_FILE" != "x" ]; then
PID_PATH="$TMP_DIR/$PID_FILE"
fi

#run-log file
RUNLOG_FILE="$APP_NAME.log"
if [ "x$RUNLOG_FILE" != "x" ]; then
RUNLOG_PATH="$TMP_DIR/$RUNLOG_FILE"
fi

testLaunchService() {
	########## inline setup ##########
	echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Setup Info ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
	echo " * setup run-arguments from: $PROJECT_HOME/$CMD_DIR/$APP_PROF-service-env.sh"
	. $PROJECT_HOME/$CMD_DIR/_pre-service-env.sh
	. $PROJECT_HOME/$CMD_DIR/$APP_PROF-service-env.sh
	. $PROJECT_HOME/$CMD_DIR/_post-service-env.sh
	echo " * app configuration will be loaded from: $PROJECT_HOME/$CONF_DIR/$APP_PROF.$CONF_FILES"
	echo
	echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Execution Info ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
	########## prepare ##########
	RUN_CMD="${JAVA:-java} $JVM_ARGS -jar $PROJECT_HOME/$JAR_DIR/$JAR_NAME.jar $APP_ARGS"
	echo Run command: $RUN_CMD
	echo Console log: $RUNLOG_PATH
	mkdir -p $TMP_DIR
}



checkService() {
	if [ -e "$PID_PATH" ]; then
	_PID="`cat $PID_PATH`"
	_PINF="`ps -fp $_PID | grep $_PID`"
	if [ "x$_PINF" = "x" ]; then
	rm -f "$PID_PATH"
	fi
	fi
}

cleanLog() {
	echo "Cleaning up: $TMP_DIR ..."
	rm -f $TMP_DIR/*.log
	echo "Cleaning up: $LOG_DIR ..."
	rm -f $LOG_DIR/*.log
}

printStatus() {
	if [ -e "$PID_PATH" ]; then
	echo "Application is running!"
	echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Process Info ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
	ps -fp `cat $PID_PATH` | grep ""
	else
	echo "Application stopped!"
	fi
}

testLaunchService
########## execute ##########
$RUN_CMD 1>>"$RUNLOG_PATH" 2>>"$RUNLOG_PATH"