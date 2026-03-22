#!/usr/bin/env bash
# eval output of this file to get appropriate env variables e.g. eval "$(./env_vars.sh)"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RED='\033[0;31m'
NC='\033[0m'

if [[ "$CIRCLECI" ]]; then
    PR_BRANCH=$CIRCLE_BRANCH
    PR_NUMBER=$CIRCLE_PR_NUMBER
    PR_URL=$CIRCLE_PULL_REQUEST
elif [[ "$NETLIFY" ]]; then
    PR_BRANCH=$BRANCH
    PR_NUMBER=$REVIEW_ID
    if [[ "$PULL_REQUEST" = true ]]; then
        PR_URL="${REPOSITORY_URL}/pull/${PR_NUMBER}"
    fi
fi

if [[ "$CIRCLECI" ]] || [[ "$NETLIFY" ]]; then
    # on circle ci determine env variables based on branch or in case of PR
    # what branch the PR is pointing to (use GitHub API since HTML scraping no longer works)
    if [[ "$PR_NUMBER" ]] && ! [[ $PR_BRANCH == "release-"* ]]; then
        echo "PR_NUMBER: ${PR_NUMBER}" >&2
        BRANCH=$(curl -s "https://api.github.com/repos/cBioPortal/cbioportal-frontend/pulls/${PR_NUMBER}" | jq -r '.base.ref')
        if [[ -z "$BRANCH" ]]; then
            echo "Warning: Could not determine target branch from PR ${PR_NUMBER}, falling back to PR_BRANCH" >&2
            BRANCH=$PR_BRANCH
        fi
    elif [[ "$MANUAL_TRIGGER_BRANCH_ENV" ]]; then
        BRANCH=$MANUAL_TRIGGER_BRANCH_ENV
    else
        BRANCH=$PR_BRANCH
    fi
    if test -f "$SCRIPT_DIR/../env/${BRANCH}.sh"; then
        cat $SCRIPT_DIR/../env/${BRANCH}.sh
    else
        echo "Branch name ${BRANCH} was not recognized. Please add env script to /env/ directory or test the branch as part of a github pull request."
    fi
    echo "export BRANCH_ENV=$BRANCH"
elif [[ "$BRANCH_ENV" ]]; then
    cat $SCRIPT_DIR/../env/${BRANCH_ENV}.sh

    # override with custom exports if they exist
    if [[ -f ${SCRIPT_DIR}/../env/custom.sh ]]; then
        cat ${SCRIPT_DIR}/../env/custom.sh
    fi
else
    echo -e "${RED}No desired BRANCH_ENV variable set${NC}"
    echo -e "${RED}set with e.g. export BRANCH_ENV=master${NC}"
    echo -e "${RED}or export BRANCH_ENV=rc${NC}"
    exit 1
fi
