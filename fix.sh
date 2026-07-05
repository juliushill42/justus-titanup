#!/bin/bash
set -e
cd /home/juliushill/justus-titanup

# Force overwrite main.py directly from GitHub raw
curl -s "https://raw.githubusercontent.com/juliushill42/justus-titanup/main/backend/main.py" -o backend/main.py

# Verify
grep "healthy" backend/main.py && echo "FILE OK" || echo "STILL WRONG"

# Clear all cache
find . -name "*.pyc" -delete
rm -rf backend/__pycache__

# Restart
sudo pkill -f uvicorn || true
sudo systemctl restart justus-api
sleep 3
curl http://localhost:8000/health
