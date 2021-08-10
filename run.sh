#!/usr/bin/env bash

IMAGE_NAME="irp-viewer"
IMAGE_TAG="latest"
CONTAINER_NAME="irp-viewer"

IMAGE_ID=`docker images $IMAGE_NAME:$IMAGE_TAG | grep $IMAGE_NAME | tr -s ' ' | cut -d ' ' -f 3`

if [[ -z $IMAGE_ID ]]; then
    echo "Image ${IMAGE_NAME}:${IMAGE_TAG} not found. Run './build.sh' first."
    exit 1
fi

docker run \
    -p 3000:3000 \
    --rm \
    --name $CONTAINER_NAME \
    -v $PWD:/home/node/app \
    -w /home/node/app \
    $IMAGE_ID