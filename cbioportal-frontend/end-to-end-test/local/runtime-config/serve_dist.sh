#!/usr/bin/env bash

set -e 
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails


openssl \
    req -newkey rsa:2048 -new -nodes -x509 -days 1 -keyout key.pem -out cert.pem \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" && \
./node_modules/http-server/bin/http-server -S -C cert.pem --cors dist/ -p 3000 \

