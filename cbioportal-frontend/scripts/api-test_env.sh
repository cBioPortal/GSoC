#!/usr/bin/env bash
# eval output of this file to get appropriate env variables e.g. eval "$(./env_vars.sh)"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RED='\033[0;31m'
NC='\033[0m'


if [[ "$BACKEND_ROOT" ]]; then
    exit 0
else
    echo -e "${RED}No desired BACKEND_ROOT variable set${NC}"
    echo -e "${RED}set with e.g. export BACKEND_ROOT=/path/to/my/backend/repo/${NC}"
    exit 1
fi
