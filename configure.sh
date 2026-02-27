#!/bin/bash

# Check if GOOGLE_CLOUD_PROJECT is defined
if [ -z "${GOOGLE_CLOUD_PROJECT}" ]; then
  echo "Error: GOOGLE_CLOUD_PROJECT environment variable is not set."
  exit 1
else
  echo "GOOGLE_CLOUD_PROJECT is set to: ${GOOGLE_CLOUD_PROJECT}"
fi

# Check if CLOUD_SHELL is set to true
if [ "${CLOUD_SHELL}" = "true" ]; then
  echo "CLOUD_SHELL is set to true."
else
  echo "Error: CLOUD_SHELL environment variable is not set to true."
  exit 1
fi

# Set the predefined relative application path
APP_PATH="client/web/angular-customer-app"
echo "APP_PATH is set to: ${APP_PATH}"

# Define the bootstrap.js path
BOOTSTRAP_JS_PATH="${APP_PATH}/src/bootstrap.js"
echo "BOOTSTRAP_JS_PATH is set to: ${BOOTSTRAP_JS_PATH}"

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "Error: firebase command not found. Please install the Firebase CLI."
    echo "Installation instructions: https://firebase.google.com/docs/cli"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "Error: jq command not found. Please install jq to parse JSON."
    echo "Installation instructions: https://stedolan.github.io/jq/download/"
    exit 1
fi

# Enable Web Frameworks experiment
echo "Enabling Firebase Web Frameworks experiment..."
firebase experiments:enable webframeworks

# Login to Firebase
echo "Logging into Firebase..."
firebase login

# Check if the firebase login command was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to login to Firebase."
  exit 1
fi

# Set the default Firebase project
echo "Setting default Firebase project to: ${GOOGLE_CLOUD_PROJECT}"
firebase use ${GOOGLE_CLOUD_PROJECT} --alias default

# Check if the firebase use command was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to set Firebase project."
  exit 1
fi

# List Firebase web apps and parse the output
echo "Fetching Firebase web apps list..."
FIREBASE_APPS_JSON=$(firebase --json apps:list WEB)

# Check if the apps:list command was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to list Firebase apps."
  exit 1
fi

# Count the number of apps
APP_COUNT=$(echo "${FIREBASE_APPS_JSON}" | jq '.result | length')

if [ "${APP_COUNT}" -eq 0 ]; then
  echo "Error: No WEB apps found in Firebase project ${GOOGLE_CLOUD_PROJECT}."
  exit 1
elif [ "${APP_COUNT}" -gt 1 ]; then
  echo "Error: Multiple WEB apps found in Firebase project ${GOOGLE_CLOUD_PROJECT}. This script expects only one."
  echo "${FIREBASE_APPS_JSON}"
  exit 1
fi

# Extract the appId
APP_ID=$(echo "${FIREBASE_APPS_JSON}" | jq -r '.result[0].appId')

if [ -z "${APP_ID}" ] || [ "${APP_ID}" = "null" ]; then
  echo "Error: Could not extract appId from Firebase app list."
  echo "${FIREBASE_APPS_JSON}"
  exit 1
fi

echo "Found single Firebase WEB app with appId: ${APP_ID}"

# Get the Firebase app config
echo "Fetching Firebase app config for appId: ${APP_ID}"
FIREBASE_CONFIG_JSON=$(firebase --json apps:sdkconfig WEB ${APP_ID})

# Check if the apps:sdkconfig command was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch Firebase app config."
  exit 1
fi

# Extract config values using jq
API_KEY=$(echo "${FIREBASE_CONFIG_JSON}" | jq -r '.result.sdkConfig.apiKey')
AUTH_DOMAIN=$(echo "${FIREBASE_CONFIG_JSON}" | jq -r '.result.sdkConfig.authDomain')
DATABASE_URL=$(echo "${FIREBASE_CONFIG_JSON}" | jq -r '.result.sdkConfig.databaseURL')
PROJECT_ID=$(echo "${FIREBASE_CONFIG_JSON}" | jq -r '.result.sdkConfig.projectId')
STORAGE_BUCKET=$(echo "${FIREBASE_CONFIG_JSON}" | jq -r '.result.sdkConfig.storageBucket')
MESSAGING_SENDER_ID=$(echo "${FIREBASE_CONFIG_JSON}" | jq -r '.result.sdkConfig.messagingSenderId')
MEASUREMENT_ID=$(echo "${FIREBASE_CONFIG_JSON}" | jq -r '.result.sdkConfig.measurementId')

# Create the directory for bootstrap.js if it doesn't exist
mkdir -p "$(dirname "${BOOTSTRAP_JS_PATH}")"

# Generate the bootstrap.js file
echo "Generating ${BOOTSTRAP_JS_PATH}..."
cat << EOF > "${BOOTSTRAP_JS_PATH}"
window["APP_TEMPLATE_BOOTSTRAP"] = {
    firebase: {
      apiKey: "${API_KEY}",
      authDomain: "${AUTH_DOMAIN}",
      databaseURL: "${DATABASE_URL}",
      projectId: "${PROJECT_ID}",
      storageBucket: "${STORAGE_BUCKET}",
      messagingSenderId: "${MESSAGING_SENDER_ID}",
      appId: "${APP_ID}",
      measurementId: "${MEASUREMENT_ID}",
    },
};
EOF

if [ $? -ne 0 ]; then
  echo "Error: Failed to generate ${BOOTSTRAP_JS_PATH}."
  exit 1
fi

echo "Successfully generated ${BOOTSTRAP_JS_PATH}."
echo "Configuration checks and setup passed."

# Install npm dependencies
echo "Installing npm dependencies in ${APP_PATH}..."
(cd "${APP_PATH}" && npm install)

if [ $? -ne 0 ]; then
  echo "Error: Failed to install npm dependencies."
  exit 1
fi

echo "Successfully installed npm dependencies."
exit 0
