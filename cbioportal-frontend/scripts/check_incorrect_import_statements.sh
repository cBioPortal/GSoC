#!/usr/bin/env bash

# get all modules, which is all the directories with a `package.json`
MODULES_STR=$(dirname $(find ./packages -type f \( -name 'package.json' -and -not -path '*node_modules*' \)) | xargs -l basename);

# convert to an array
readarray -t MODULES_ARRAY <<< "$MODULES_STR";

# create a grep query string for all packages
# we are querying for strings like "/react-mutation-mapper" or "react-mutation-mapper/src"

# a '/' in front of the package name indicates that the import statement is a relative reference instead of an alias
GREP_QUERY_RELATIVE=$(printf "\|/%s" "${MODULES_ARRAY[@]}");
GREP_QUERY_RELATIVE=${GREP_QUERY_RELATIVE:2}; # This is to remove the leading \|

# existence of the "src" directory after the package name is also an indicator of a problematic import statement
GREP_QUERY_SRC=$(printf "\|%s/src" "${MODULES_ARRAY[@]}");
GREP_QUERY_SRC=${GREP_QUERY_SRC:2}; # This is to remove the leading \|

GREP_QUERY="${GREP_QUERY_RELATIVE}\|${GREP_QUERY_SRC}";

# search for possible incorrect import statements
! grep ${GREP_QUERY} $(find ./src ./packages/*/src -type f -not -name '*.sh');
