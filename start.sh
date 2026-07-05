#!/bin/bash
cd /home/juliushill/justus-titanup
git fetch --all
git reset --hard origin/main
find . -name "*.pyc" -delete
rm -rf backend/__pycache__
source venv/bin/activate
exec venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
