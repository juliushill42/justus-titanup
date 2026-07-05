#!/bin/bash
sudo cp /home/juliushill/justus-titanup/nginx-justus-api.conf /etc/nginx/sites-available/justus-api
sudo ln -sf /etc/nginx/sites-available/justus-api /etc/nginx/sites-enabled/justus-api
sudo nginx -t && sudo systemctl reload nginx
# Get SSL
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d justus-api.titanuai.com --non-interactive --agree-tos -m juliushill@titanuai.com
echo "Done — test: curl https://justus-api.titanuai.com/health"
