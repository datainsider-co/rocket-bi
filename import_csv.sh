#!/bin/bash
hello="hello"
echo $hello
# conf
API_HOST="http://localhost:5050/api/ingestion"
INPUT_FILE=""
OUTPUT_FILE="data.json"
DELIMITER=","
DB_NAME="db_test"
TBL_NAME="tbl_test"
SERVICE_KEY=""
CHUNK_SIZE=100
while getopts h:k:f:s:d:t: option; do
  case "${option}" in
  h) API_HOST=${OPTARG} ;;
  k) SERVICE_KEY=${OPTARG} ;;
  f) INPUT_FILE=${OPTARG} ;;
  s) DELIMITER="," ;;
  d) DB_NAME=${OPTARG} ;;
  t) TBL_NAME=${OPTARG} ;;
  *) ;;
  esac
done
echo "Endpoint=$API_HOST"
echo "Service Key=$SERVICE_KEY"
echo "Input CSV File=$INPUT_FILE"

function show_help() {
  echo "___________________________________________"
  echo " HELP"
  echo "-------------------------------------------"
  echo "-f : Required - The input csv file."
  echo "-k : Required - The service key to ingest data."
  echo "-d : Required - The target database name to write csv data to."
  echo "-t : Required - The target table name to write csv data to."
  echo "-d : Optional - The delimiter character to read & parse records from the given csv file."
  echo "-h : Optional -  The Api Url. Default is http://localhost:5050/api/ingestion"
  echo "___________________________________________"
}

[ ! "$SERVICE_KEY" ] && {
  show_help
  echo "Error: DI Service Key not found"
  exit 98
}
[ ! -f $INPUT_FILE ] && {
  show_help
  echo "Error: $INPUT_FILE file not found"
  exit 99
}

[ ! $DB_NAME ] && {
  show_help
  echo "Error: $DB_NAME database not found"
  exit 99
}

[ ! $TBL_NAME ] && {
  show_help
  echo "Error: $TBL_NAME table not found"
  exit 99
}


# helper functions

function join_by() {
  local d=$1
  shift
  local f=$1
  shift
  printf %s "$f" "${@/#/$d}"
}
function is_number() {
  re='^[+-]?[0-9]+([.][0-9]+)?$'
  if [[ $1 =~ $re ]]; then
    return 0 # 0 is true
  else
    return 1 # 1 is false
  fi
}
function is_boolean() {
  if [[ "${1,,}" == true || "${1,,}" == false ]]; then
    return 0
  else
    return 1
  fi
}
function escape_string() {
  printf '%q' "$1"
}
function process_csv_line() {
  item=()
  for i in "${!line[@]}"; do
    value=${line[i]}
    if is_number "$value"; then
      :
    elif is_boolean "$value"; then
      value="${value,,}" # toLowerCase()
    else
      value="\"$value\"" # add double quotes
    fi
    item+=("\"${headers[i]}\":$value")
  done
  echo "{$(join_by , "${item[@]}")}"
}
function ingest_data() {
  echo "ingesting data to database"
  records_as_json="[$(join_by , "${records[@]}")]"
  unset records
  # construct curl command
  data="{\"db_name\":\"$DB_NAME\",\"tbl_name\":\"$TBL_NAME\",\"records\":$records_as_json}"
  echo "$data" >$OUTPUT_FILE
  # curl require to read from file if payload data is too large
  curl --request POST \
    --url $API_HOST \
    --header "Content-Type: application/json" \
    --header "DI-SERVICE-KEY: $SERVICE_KEY" \
    --data @"$OUTPUT_FILE"
}
# process csv
OLDIFS=$IFS
IFS=$DELIMITER
read -a headers <"$INPUT_FILE" # read header line
records=()
row_cnt=0
while read -ra line; do
  if [ $row_cnt == 0 ]; then # ignore header line
    row_cnt=$((row_cnt + 1))
    continue
  fi
  echo "processing row $row_cnt"
  item_str=$(process_csv_line)
  row_cnt=$((row_cnt + 1))
  records+=("$item_str")
  # send request if fill chunk size
  if [ "$((row_cnt % CHUNK_SIZE))" -eq 0 ]; then
    ingest_data
  fi
done <"$INPUT_FILE"
IFS=$OLDIFS
# ingest the rest of data
ingest_data