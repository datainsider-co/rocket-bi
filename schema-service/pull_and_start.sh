#!/bin/bash
(
  # Wait for lock on /var/lock/.pull_and_start.exclusivelock (fd 200) for 60 seconds
  flock -x -w 60 200 || exit 1

  docker-compose pull && docker-compose up -d

) 200>/var/lock/.pull_and_start.exclusivelock