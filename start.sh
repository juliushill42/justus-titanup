#!/bin/bash
cd /home/juliushill/justus-titanup
curl -s "https://raw.githubusercontent.com/juliushill42/justus-titanup/main/backend/main.py" -o backend/main.py
find . -name "*.pyc" -delete
rm -rf backend/__pycache__
source /home/juliushill/justus-titanup/venv/bin/activate
exec /home/juliushill/justus-titanup/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001
