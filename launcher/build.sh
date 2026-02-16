#!/usr/bin/env bash
set -euo pipefail

# Build script for Linux (uses PyInstaller)
# Place this file in the `launcher` directory next to `launcher.py` and (optionally) `icon.ico`.

if ! command -v pyinstaller >/dev/null 2>&1; then
  echo "pyinstaller not found. Install with: pip install pyinstaller"
  exit 1
fi

cd "$(dirname "$0")"

ICON="icon.ico"
ARGS=(--noconfirm --onefile --windowed --name "TQLauncher")

if [ -f "$ICON" ]; then
  ARGS+=(--icon "$ICON" --add-data "$ICON:.")
fi

ARGS+=(launcher.py)

echo "Running: pyinstaller ${ARGS[*]}"
pyinstaller "${ARGS[@]}"

echo
echo "Build complete! Executable: dist/TQLauncher"
exit 0
