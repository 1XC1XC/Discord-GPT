#!/bin/bash

export LD_LIBRARY_PATH=$(python -c 'import os; import nvidia.cublas.lib; import nvidia.cudnn.lib; print(f"{os.path.dirname(nvidia.cublas.lib.__file__)}:{os.path.dirname(nvidia.cudnn.lib.__file__)}")'):$LD_LIBRARY_PATH
clear

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to cleanup processes
cleanup() {
    kill $python_pid $discord_pid 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

cd "$PROJECT_ROOT"

echo "Starting Fast Whisper server..."
cd whisper/src/py
# python main.py & # >/dev/null 2>&1 &
python main.py >/dev/null 2>&1 &
python_pid=$!

# Wait for Whisper server to be ready
while ! nc -z localhost 8000 2>/dev/null; do
    sleep 0.1
done

echo "Starting Discord bot..."
cd "$PROJECT_ROOT/discord"
bun run index.js &
discord_pid=$!

echo -e "\nAll services running. Press Ctrl+C to stop."
wait
