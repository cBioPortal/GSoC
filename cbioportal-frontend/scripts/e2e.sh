#!/bin/sh
set -e
set -o allexport

TEST_REPO_URL="https://github.com/cBioPortal/cbioportal-test.git"
TEST_REPO_REF="main"
DOCKER_COMPOSE_REPO_URL="https://github.com/cBioPortal/cbioportal-docker-compose.git"
DOCKER_COMPOSE_REF="master"
STUDIES='ascn_test_study study_hg38 teststudy_genepanels study_es_0 lgg_ucsf_2014_test_generic_assay'
APPLICATION_PROPERTIES_PATH=$(cd -- "$(dirname -- "$0")" && cd .. && pwd)/end-to-end-test/local/runtime-config/portal.properties
KEYCLOAK="true"
CLICKHOUSE="true"
RUN_FRONTEND="false" # Set to "true" if you want to build and run frontend at localhost:3000
RUN_TESTS="false" # Set to "true" if you want to run all e2e:local tests

# Use database image with preloaded studies
export DOCKER_IMAGE_MYSQL=cbioportal/mysql:8.0-database-test

# Use custom application properties
export APPLICATION_PROPERTIES_PATH=$APPLICATION_PROPERTIES_PATH

# Backend image
export DOCKER_IMAGE_CBIOPORTAL=cbioportal/cbioportal:master

# cbioportal-core branch
export APP_CBIOPORTAL_CORE_BRANCH=main

# Use pre-release clickhouse for docker compose
export DOCKER_COMPOSE_REF=$DOCKER_COMPOSE_REF

# Create a temp dir and clone test repo
ROOT_DIR=$(pwd)
TEMP_DIR=$(mktemp -d)
git clone "$TEST_REPO_URL" "$TEMP_DIR/cbioportal-test" || exit 1
git clone "$DOCKER_COMPOSE_REPO_URL" "$TEMP_DIR/cbioportal-docker-compose" || exit 1
cd "$TEMP_DIR/cbioportal-test" || exit 1
git checkout "$TEST_REPO_REF" || exit 1

# Generate keycloak config
if [ "$KEYCLOAK" = "true" ]; then
  ./utils/gen-keycloak-config.sh --studies="$STUDIES" --template='$TEMP_DIR/cbioportal-docker-compose/dev/keycloak/keycloak-config.json' --out='keycloak-config-generated.json'
  export KEYCLOAK_CONFIG_PATH="$TEMP_DIR/cbioportal-test/keycloak-config-generated.json"
fi

# Start backend
if [ "$KEYCLOAK" = "true" ]; then
  if [ "$CLICKHOUSE" = "true" ]; then
    COMPOSE_EXTENSIONS='-f addon/clickhouse/docker-compose.remote.clickhouse.yml'
  else
    COMPOSE_EXTENSIONS=''
  fi

  ./scripts/docker-compose.sh --portal_type='keycloak' --compose_extensions="$COMPOSE_EXTENSIONS" --docker_args='-d'

  # Check keycloak connection at localhost:8081
  ./utils/check-connection.sh --url=localhost:8081 --max_retries=50
else
  ./scripts/docker-compose.sh --portal_type='web-and-data' --docker_args='-d'
fi

# Check backend connection at localhost:8080
./utils/check-connection.sh --url=localhost:8080/api/health --max_retries=50

if [ "$RUN_FRONTEND" = "true" ]; then
  # Build frontend
  printf "\nBuilding frontend ...\n\n"
  cd "$ROOT_DIR" || exit 1
  export BRANCH_ENV=master
  yarn install --frozen-lockfile
  yarn run buildAll

  # Start frontend http server, delete if previous server exists
  if [ -e "/var/tmp/cbioportal-pid" ]; then
    pkill -F /var/tmp/cbioportal-pid
  fi
  openssl \
    req -newkey rsa:2048 -new -nodes -x509 -days 1 -keyout key.pem -out cert.pem -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost" && \
    nohup ./node_modules/http-server/bin/http-server --cors dist/ -p 3000 > /dev/null 2>&1 &
  echo $! > /var/tmp/cbioportal-pid

  # Wait for frontend at localhost:3000
  printf "\nVerifying frontend connection ...\n\n"
  cd "$TEMP_DIR/cbioportal-test" || exit 1
  ./utils/check-connection.sh --url=localhost:3000
fi

if [ "$RUN_TESTS" = "true" ]; then
  # Build e2e localdb tests
  cd "$ROOT_DIR/end-to-end-test" || exit 1
  yarn --ignore-engines

  # Run e2e localdb tests
  cd "$ROOT_DIR" || exit 1
  yarn run e2e:local
fi

# Cleanup
cd "$ROOT_DIR" || exit 1
rm -rf "$TEMP_DIR"