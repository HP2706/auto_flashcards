#!/usr/bin/env bash
set -euo pipefail

# Run Next.js dev server and auto-open the browser when ready.
# Works on macOS (open) and Linux (xdg-open).

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

PORT="${PORT:-3000}"
URL="${DEV_URL:-http://localhost:$PORT}"

echo "Starting dev server..."
npm run dev &
DEV_PID=$!

cleanup() {
  # Attempt to stop the dev server if this wrapper exits
  kill "$DEV_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Waiting for $URL to become available..."
until curl -sSf "$URL" >/dev/null 2>&1; do
  # If the dev process died, bail out early
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "Dev server exited unexpectedly."
    exit 1
  fi
  sleep 0.4
done

if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
else
  echo "Open $URL in your browser."
fi

# Hand control back to the dev server (keep logs in this terminal)
wait "$DEV_PID"
