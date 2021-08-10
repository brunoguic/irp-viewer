#!/usr/bin/env bash

IMAGE_NAME="irp-viewer"
IMAGE_TAG="latest"

echo "Creating image $IMAGE_NAME:$IMAGE_TAG"
docker build -t $IMAGE_NAME:$IMAGE_TAG .

echo "Done."
