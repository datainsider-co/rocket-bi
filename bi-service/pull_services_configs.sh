BRANCH=main
DEST_PATH="/home/nkthien/code/di-deploy"
ACCESS_TOKEN=glpat-VE9G98QTjVBKZN--mBEf

# bi-service
curl --header "PRIVATE-TOKEN: $ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/18069714/repository/files/conf%2Fproduction%2Econf/raw?ref=$BRANCH" > $DEST_PATH/bi-service/conf/production.conf

# user-profile
curl --header "PRIVATE-TOKEN: $ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/20512445/repository/files/conf%2Fproduction%2Econf/raw?ref=$BRANCH" > $DEST_PATH/user-profile/conf/production.conf

# ingestion-service
curl --header "PRIVATE-TOKEN: $ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/19853678/repository/files/conf%2Fproduction%2Econf/raw?ref=$BRANCH" > $DEST_PATH/ingestion-service/conf/production.conf

# job-scheduler
curl --header "PRIVATE-TOKEN: $ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/25444953/repository/files/conf%2Fproduction%2Econf/raw?ref=$BRANCH" > $DEST_PATH/job-scheduler/conf/production.conf

# job-worker
curl --header "PRIVATE-TOKEN: $ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/25444973/repository/files/conf%2Fproduction%2Econf/raw?ref=$BRANCH" > $DEST_PATH/job-worker/conf/production.conf

# event-tracking-mw
curl --header "PRIVATE-TOKEN: $ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/32441824/repository/files/conf%2Fproduction%2Econf/raw?ref=$BRANCH" > $DEST_PATH/event-tracking-mw/conf/production.conf

# event-tracking-consumer
curl --header "PRIVATE-TOKEN: $ACCESS_TOKEN" "https://gitlab.com/api/v4/projects/30109504/repository/files/conf%2Fproduction%2Econf/raw?ref=$BRANCH" > $DEST_PATH/event-tracking-consumer/conf/production.conf

# web
