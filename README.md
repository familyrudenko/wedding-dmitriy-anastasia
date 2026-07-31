# Свадьба Дмитрия и Анастасии

Мобильное свадебное приглашение на Next.js/vinext, подготовленное для бесплатного размещения в Cloudflare Workers.

## Локальный запуск

```bash
npm ci
npm run dev
```

Проверка production-сборки:

```bash
npm run build
```

## Бесплатная публикация через Cloudflare

1. В Cloudflare откройте **Workers & Pages → Create application → Import a repository**.
2. Подключите репозиторий `familyrudenko/wedding-dmitriy-anastasia` и ветку `main`.
3. Укажите **Build command**: `npm run build`.
4. Укажите **Deploy command**: `npx wrangler deploy`.
5. После первого развёртывания откройте Worker → **Settings → Variables and Secrets**.
6. Добавьте как секреты `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`, затем нажмите **Deploy**.

Cloudflare выдаст бесплатный адрес вида `wedding-dmitriy-anastasia.<аккаунт>.workers.dev`. Новые изменения из ветки `main` будут публиковаться автоматически.

Не добавляйте настоящий токен Telegram в файлы репозитория. Для локальной разработки используйте `.env` или `.dev.vars`; они исключены из Git.
