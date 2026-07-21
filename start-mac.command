#!/bin/bash

set -u

APP_URL="http://127.0.0.1:8787"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/xhs-lifecycle-analyzer-ai-lab"

echo "Starting Xiaohongshu Lifecycle Analyzer AI Lab..."
echo "Project directory: $SCRIPT_DIR"

cd "$SCRIPT_DIR" || {
  echo "Failed to enter project directory."
  read -r -p "Press Enter to exit..."
  exit 1
}

if [ ! -d "$APP_DIR" ]; then
  echo "Missing runtime directory: xhs-lifecycle-analyzer-ai-lab"
  read -r -p "Press Enter to exit..."
  exit 1
fi

cd "$APP_DIR" || {
  echo "Failed to enter xhs-lifecycle-analyzer-ai-lab."
  read -r -p "Press Enter to exit..."
  exit 1
}

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed or is not available in PATH."
  echo "Please install Node.js LTS first, then run this launcher again."
  read -r -p "Press Enter to exit..."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed or is not available in PATH."
  echo "Please install Node.js LTS first, then run this launcher again."
  read -r -p "Press Enter to exit..."
  exit 1
fi

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Running npm install..."
  npm install
  if [ $? -ne 0 ]; then
    echo "npm install failed. Please check the error above."
    read -r -p "Press Enter to exit..."
    exit 1
  fi
fi

if [ ! -f ".env" ]; then
  echo ".env not found."
  echo "Please run these commands in Terminal first:"
  echo ""
  echo "  cd \"$APP_DIR\""
  echo "  cp .env.example .env"
  echo "  nano .env"
  echo ""
  echo "Fill AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_MAX_TOKENS and AI_TEMPERATURE, then save."
  echo "This launcher will not create or write any real API Key."
  read -r -p "Press Enter to exit..."
  exit 1
fi

echo "Found .env. Starting local server..."
echo "Browser will open: $APP_URL"

(sleep 2 && open "$APP_URL") &
npm run start

EXIT_CODE=$?
echo "Server stopped with exit code $EXIT_CODE."
read -r -p "Press Enter to exit..."
exit $EXIT_CODE
