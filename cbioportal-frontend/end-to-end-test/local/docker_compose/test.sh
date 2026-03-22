#!/usr/bin/env bash

set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

DIR=$PWD

cd $TEST_HOME/docker_compose/docker
docker build -f Dockerfile.screenshottest -t cbio-screenshottest .

cd $PORTAL_SOURCE_DIR
docker run -it --rm \
    --network=host \
    --shm-size=1G \
    -e CBIOPORTAL_URL="$CBIOPORTAL_URL" \
    -e NETLIFY_DEPLOY_PREVIEW="${NETLIFY_DEPLOY_PREVIEW:-}" \
    -e FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND="${FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND:-}" \
    -e SCREENSHOT_DIRECTORY="$SCREENSHOT_DIRECTORY"\
    -e SPEC_FILE_PATTERN="$SPEC_FILE_PATTERN" \
    -e JUNIT_REPORT_PATH="$JUNIT_REPORT_PATH" \
    -v "$PORTAL_SOURCE_DIR:/cbioportal-frontend/" \
    cbio-screenshottest

status=$?

if [[ "$status" -eq 0 ]]; then
    echo Success!!!!! E2e-test test completed without errors.
else
    echo Error!!!!! E2e-test test completed with errors.
fi

cd $DIR

exit $status