#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

CHROME_VERSION="139.0.7258.154"

echo "Installing Google Chrome ${CHROME_VERSION}..."

# Download and install Chrome
wget -q "https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}-1_amd64.deb"
sudo dpkg -i "google-chrome-stable_${CHROME_VERSION}-1_amd64.deb" || sudo apt-get install -yf
rm "google-chrome-stable_${CHROME_VERSION}-1_amd64.deb"

echo "Installing ChromeDriver ${CHROME_VERSION}..."

# Download and install ChromeDriver
wget -q "https://storage.googleapis.com/chrome-for-testing-public/${CHROME_VERSION}/linux64/chromedriver-linux64.zip"
unzip -q chromedriver-linux64.zip
sudo mv chromedriver-linux64/chromedriver /usr/local/bin/
sudo chmod +x /usr/local/bin/chromedriver
rm -rf chromedriver-linux64.zip chromedriver-linux64

echo "Verifying installations..."
google-chrome --version
chromedriver --version

echo "✅ Installation complete."

export CHROMEDRIVER_CUSTOM_PATH=/usr/local/bin/chromedriver
export FRONTEND_TEST_USE_LOCAL_DIST=false
export HEADLESS_CHROME=true


cd /cbioportal-frontend
yarn serveDistLocalDb &

cd /cbioportal-frontend/
cd /cbioportal-frontend/end-to-end-test

echo PROBE CBIOPORTAL
curl $CBIOPORTAL_URL > /dev/null
sleep 5
curl $CBIOPORTAL_URL > /dev/null
sleep 5
curl $CBIOPORTAL_URL > /dev/null
sleep 20

echo PROBE FRONTEND SERVER
(curl --insecure https://localhost:3000 || curl http://localhost:3000) > /dev/null

echo RUN E2E-TESTS
cd /cbioportal-frontend/end-to-end-test
yarn run test-webdriver-manager-local
