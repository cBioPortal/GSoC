#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo UPLOADING ERROR SCREENSHOTS

# paths are different on CI and local testing
# TODO implement these different paths
# low prio since I consider running imageCompare locally as a rare event.
# if [[ ${TRAVIS} || ${CIRCLECI} ]]; then
#     reference_path=$DIR
# else
#     reference_path=...
# fi

cd ${DIR}/../../$SCREENSHOT_DIRECTORY

if (ls diff/*.png 2> /dev/null > /dev/null); then
    references=()
    # collect reference images for each screenshot in diff directory
    for image_path in diff/*.png; do
        reference=${image_path/diff/reference}
        references=( ${references[@]} $reference )
        echo "FAILED SCREENSHOT TEST: ${reference}"
    done

    echo "var errorImages = '${references[@]}'.split(' ')" > ${DIR}/errors.js


    if [[ ${TRAVIS} || ${CIRCLECI} ]]; then
        echo "${YELLOW}See Artifacts tab above for image comparison UI (imageCompare.html)${NC}"
    else
        repo_url=file://${PWD}/../../..
        echo -e "${GREEN}COPY+PASTE in BROWSER TO COMPARE FAILED SCREENSHOTS: ${YELLOW}${repo_url}/end-to-end-test/shared/imageCompare.html${NC}";
    fi

    # set a variable for localdb or remote tests (needed for image download links)
    RUNMODE=$((grep -q local <<< $DIR && echo local) || echo remote)

    echo "var runMode = '$RUNMODE'" > ${DIR}/runmode.js

fi
exit 1 # always exit 1 since we are assuming that you call this when screenshots have failed
