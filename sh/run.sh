#!/bin/bash

set -euo pipefail

# Unicode box characters
readonly TOP_LEFT='╭'
readonly TOP_RIGHT='╮'
readonly BOTTOM_LEFT='╰'
readonly BOTTOM_RIGHT='╯'
readonly VERTICAL='│'
readonly HORIZONTAL='─'
readonly ARROW='→'

# Color definitions (minimal palette)
readonly DIM='\033[2m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'
readonly GRAY='\033[38;5;240m'

# Minimal logging
log() {
    local msg="$1"
    echo -e "${VERTICAL} ${msg}"
}

# Service status indicator
status() {
    local name="$1"
    local detail="$2"
    echo -e "${VERTICAL} ${BOLD}${name}${NC} ${GRAY}${ARROW}${NC} ${detail}"
}

# Cleanup
cleanup() {
    # echo -e "${BOTTOM_LEFT}${HORIZONTAL} Shutting down..."
    kill $python_pid $discord_pid 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Set directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Get port
WHISPER_PORT=$(cat "$PROJECT_ROOT/src/config.json" | jq -r '.whisper.port')
if [ -z "$WHISPER_PORT" ]; then
    echo -e "${BOTTOM_LEFT}${HORIZONTAL} Failed to get port"
    exit 1
fi

# Clear and start
clear
echo -e "${TOP_LEFT}${HORIZONTAL} Services ${HORIZONTAL}${TOP_RIGHT}"

# Start Whisper
cd "$PROJECT_ROOT/src/whisper"
status "whisper" "starting..."
python api.py >/dev/null 2>&1 &
python_pid=$!

# Wait for port (silently)
until nc -z localhost "$WHISPER_PORT" 2>/dev/null; do
    sleep 0.5
done

status "whisper" "ready on :$WHISPER_PORT"

# Start Discord bot
cd "$PROJECT_ROOT/src/discord"
status "discord" "starting..."
bun run index.js &
discord_pid=$!

echo -e "${BOTTOM_LEFT}${HORIZONTAL} Ready ${HORIZONTAL}${BOTTOM_RIGHT}"

wait
