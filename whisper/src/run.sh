#!/bin/bash

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

trap 'kill $python_pid $bun_pid 2>/dev/null; exit 0' SIGINT SIGTERM EXIT

cd "$PROJECT_ROOT"

echo "Starting Fast Whisper server..."
# python src/py/main.py & # >/dev/null 2>&1 &
python src/py/main.py >/dev/null 2>&1 &
python_pid=$!

# Wait for port 8000 to be available
while ! nc -z localhost 8000 2>/dev/null; do
    sleep 0.1
done

echo "Starting JavaScript client..."
cd src/js
bun run index.js &
bun_pid=$!

echo -e "\nServices running. Press Ctrl+C to stop."
wait
