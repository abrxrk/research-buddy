#!/usr/bin/env bash
# Start the Research Buddy backend.
# Finds (or creates) the virtualenv, installs requirements only when requirements.txt changed, then runs uvicorn.
# Usage: bash start.sh            -> http://localhost:8000 with auto-reload
#        PORT=9000 bash start.sh  -> custom port
#        bash start.sh --no-reload
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8000}"

# 1. Find a virtualenv (.venv or venv), or create .venv
VENV=""
for dir in .venv venv; do
  [ -f "$dir/bin/activate" ] && VENV="$dir" && break
done
if [ -z "$VENV" ]; then
  VENV=".venv"
  echo "→ No virtualenv found, creating $VENV"
  if command -v uv >/dev/null; then
    uv venv -q -p 3.12 "$VENV"
  else
    PY="$(command -v python3.12 || command -v python3)"
    "$PY" -m venv "$VENV"
  fi
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"
echo "→ Using virtualenv $VENV ($(python --version))"

# 2. Install requirements if they changed since the last install (tracked by a checksum stamp)
STAMP="$VENV/.requirements.sha"
CURRENT="$(shasum requirements.txt | cut -d' ' -f1)"
if [ ! -f "$STAMP" ] || [ "$(cat "$STAMP")" != "$CURRENT" ]; then
  echo "→ Installing requirements…"
  if command -v uv >/dev/null; then
    uv pip install -q -p "$VENV" -r requirements.txt
  else
    python -m pip --version >/dev/null 2>&1 || python -m ensurepip -q
    python -m pip install -q -r requirements.txt
  fi
  echo "$CURRENT" > "$STAMP"
else
  echo "→ Requirements already installed"
fi

# 3. Make sure there is a .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠ Created .env from .env.example. Set OPENROUTER_API_KEY and JWT_SECRET in backend/.env, then run again."
  exit 1
fi

# 4. Warn (don't fail) if MongoDB isn't reachable
if ! nc -z localhost 27017 >/dev/null 2>&1; then
  echo "⚠ MongoDB doesn't seem to be running on localhost:27017 (macOS: brew services start mongodb-community)"
fi

# 5. Run the API
RELOAD="--reload"
[ "${1:-}" = "--no-reload" ] && RELOAD=""
echo "→ Starting backend on http://localhost:$PORT (docs: /docs)"
exec uvicorn app.main:app $RELOAD --port "$PORT"
