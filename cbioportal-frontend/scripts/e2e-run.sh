if [ ${#CBIOPORTAL_URL} -eq 0 ]; then
  echo "No CBIOPORTAL_URL configured, so defaulting to https://www.cbioportal.org";
  exit 1 #fail
fi