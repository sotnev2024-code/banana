#!/bin/bash
set -e

echo "=== 1. Installing Docker ==="
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
echo "Docker installed: $(docker --version)"

echo "=== 2. Installing PM2 + Certbot ==="
npm install -g pm2
apt-get install -y certbot python3-certbot-nginx

echo "=== 3. Cloning repo ==="
mkdir -p /opt
cd /opt
rm -rf banana
git clone https://github.com/sotnev2024-code/banana.git
cd banana/aibot/aibot

echo "=== 4. Starting Postgres + Redis ==="
docker compose up -d
sleep 5
echo "Containers:"
docker ps

echo "=== 5. Creating .env ==="
cat > .env << 'ENVFILE'
# Bot
BOT_TOKEN=REPLACE_ME
BOT_SECRET=picpulse_secret_2024
MINIAPP_URL=https://picpulse.fun

# API
PORT=3001
API_URL=https://picpulse.fun
JWT_SECRET=picpulse_jwt_secret_change_me_32chars

# Database
DATABASE_URL=postgresql://aibot:password@localhost:5432/aibot
REDIS_URL=redis://localhost:6379

# kie.ai
KIE_API_KEY=REPLACE_ME

# YuKassa
YUKASSA_SHOP_ID=REPLACE_ME
YUKASSA_SECRET_KEY=REPLACE_ME
YUKASSA_WEBHOOK_SECRET=REPLACE_ME

# Mini App (Vite)
VITE_API_URL=https://picpulse.fun/api
VITE_BOT_USERNAME=REPLACE_ME
ENVFILE

echo "=== 6. Installing dependencies ==="
npm install

echo "=== 7. Generating Prisma + pushing DB ==="
npx prisma generate
npx prisma db push

echo "=== 8. Building project ==="
npm run build

echo "=== 9. Configuring Nginx ==="
cat > /etc/nginx/sites-available/picpulse << 'NGINX'
server {
    listen 80;
    server_name picpulse.fun www.picpulse.fun;

    # Mini App (static files)
    root /opt/banana/aibot/aibot/apps/miniapp/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/picpulse /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== 10. Getting SSL certificate ==="
certbot --nginx -d picpulse.fun -d www.picpulse.fun --non-interactive --agree-tos -m admin@picpulse.fun

echo "=== 11. Starting app with PM2 ==="
cd /opt/banana/aibot/aibot
pm2 start apps/api/dist/index.js --name picpulse-api
pm2 start apps/bot/dist/index.js --name picpulse-bot
pm2 save
pm2 startup

echo ""
echo "========================================="
echo "  DEPLOY COMPLETE!"
echo "  Site: https://picpulse.fun"
echo "========================================="
echo ""
echo "IMPORTANT: Edit /opt/banana/aibot/aibot/.env"
echo "Replace all REPLACE_ME values with real keys:"
echo "  - BOT_TOKEN (from @BotFather)"
echo "  - KIE_API_KEY"
echo "  - YUKASSA keys"
echo "  - VITE_BOT_USERNAME"
echo ""
echo "After editing .env, restart:"
echo "  pm2 restart all"
