#!/bin/sh
# Rebuild the app into docs/ and push; GitHub Pages serves docs/ from main.
set -e
cd "$(dirname "$0")/.."
python3 build/build_app.py
git add -A docs
git commit -q -m "Rebuild app $(date +%Y-%m-%d)" || { echo "No app changes to deploy."; exit 0; }
git push -q
echo "Deployed. Live in ~1 minute at https://manitgupta.github.io/pint-perfect/"
