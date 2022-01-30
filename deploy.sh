#!/bin/bash
APP_NAME="hardbeet"
REMOTE_SERVER=""
REMOTE_PATH=""
DOCKER_IMAGE=""
DOCKER_PATH="/usr/share/nginx/html"


tar cvzf $APP_NAME.tar.gz *.js *.css *.html *.ico
ssh $REMOTE_SERVER "mkdir -p $REMOTE_PATH/$APP_NAME/dist"
scp $APP_NAME.tar.gz $REMOTE_SERVER:$REMOTE_PATH/$APP_NAME/dist/$APP_NAME.tar.gz

echo "tar -xvf $REMOTE_PATH/$APP_NAME/dist/$APP_NAME.tar.gz -C $REMOTE_PATH/$APP_NAME" > remote_deploy.sh
ls -1b *.css *.html *.js *.ico | awk -v appname=$APP_NAME -v path=$REMOTE_PATH -v docker_image=$DOCKER_IMAGE -v docker_path=$DOCKER_PATH '{print "docker cp " path "/" appname "/" $1 " " docker_image ":" docker_path "/" appname "/" $1}' >> remote_deploy.sh
chmod u+x remote_deploy.sh

ssh $REMOTE_SERVER 'bash -s' < remote_deploy.sh
