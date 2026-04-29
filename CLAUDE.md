# Project: PicPulse AI Studio

## Permissions
- All file read/write/edit operations are allowed without confirmation
- All bash commands are allowed without confirmation
- SSH commands to 31.130.150.174 are allowed without confirmation
- Git operations (commit, push) are allowed without confirmation

## Server
- SSH: `ssh -p 2222 root@31.130.150.174` (port 2222, NOT 22 — port 22 is blocked at network level for some IPs; 2222 was added as alternate)
- Active domain: **`pic.plus-shop.ru`** (subdomain of working zone — used for miniapp + API)
- Legacy domain: `picpulse.fun` — DNS broken (NS at PDR Ltd not delegated correctly), kept around in case it gets fixed
- Project path: `/opt/banana/aibot/aibot`
- Uploads dir: `/opt/banana/uploads/` (subfolders: `gen/`, `gen/thumb/`, `featured/`, `previews/`)
- Reference photos for seed scripts: `/opt/banana/reference/`

## Bot
- Username: `@picpulseai_bot`
- Admin Telegram ID: `1724263429`
- Mini-app URL configured via @BotFather → must point to `https://pic.plus-shop.ru`

## Stack
- Node.js 18, Fastify, Prisma, Telegraf
- React + Vite (miniapp)
- PostgreSQL, Redis
- PM2 for process management (`picpulse-api` id=1, `picpulse-bot` id=0)
- Nginx + Certbot SSL

## Env files
- `/opt/banana/aibot/aibot/.env` — root: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `BOT_TOKEN`, `KIE_API_KEY`, `MINIAPP_URL`, `API_URL`, `TG_CHANNEL_ID`, `YUKASSA_*`, `DEEPSEEK_API_KEY`, `USE_GEMINIGEN`, `GEMINIGEN_API_KEY`
- `/opt/banana/aibot/aibot/apps/miniapp/.env` — `VITE_API_URL=https://pic.plus-shop.ru/api`, `VITE_BOT_USERNAME=picpulseai_bot`

## Deploy commands (on server)
```bash
cd /opt/banana/aibot/aibot && git pull && \
  cd packages/shared && npm run build && \
  cd /opt/banana/aibot/aibot && \
  npx prisma generate && npx prisma db push && \
  cd apps/api && npx tsc && \
  cd ../miniapp && npx vite build && \
  pm2 restart all --update-env
```

(Skip `prisma db push` and `prisma generate` if no schema changes; skip `npx tsc` in api if no API code changed.)

## Provider setup (KIE.ai)
- KIE_API_KEY rotated regularly. Rate is $0.005 per credit.
- Models routed by `packages/shared/src/kieai.ts` → `generate()` and `pollTask()`. When `USE_GEMINIGEN=true`, supported models go through `geminigenai.ts` instead.
- BullMQ worker config: `lockDuration: 15min`, `lockRenewTime: 5min`, `maxStalledCount: 0` (avoids false refunds on slow generations).
- `gpt-image-2-image-to-image` quirk: 2K resolution returns "Internal Error" on KIE side — use 1K or 4K.
