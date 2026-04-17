# Инструкция по запуску на Replit

## Шаг 1: Создание Repl
1. Зайди на [replit.com](https://replit.com)
2. Нажми **"+ Create Repl"**
3. Выбери **"Node.js"**
4. Назови проект: `burp-tickets-bot`
5. Нажми **"Create Repl"**

## Шаг 2: Загрузка файлов
1. Удали стандартный `index.js`
2. Загрузи все файлы из папки `report`:
   - Нажми три точки → **"Upload file"**
   - Выбери: `index.js`, `package.json`, `config.json`, `keep-alive.js`

## Шаг 3: Настройка переменных окружения
1. Нажми на иконку **"Secrets"** (замок 🔒) в левой панели
2. Добавь переменные:

```
Key: DISCORD_TOKEN
Value: [твой токен Discord бота]

Key: GUILD_ID  
Value: [ID твоего Discord сервера]

Key: TICKET_CHANNEL_ID
Value: [ID канала для панели тикетов]

Key: REPLIT
Value: true
```

### Как получить токен Discord бота:
1. Зайди на [discord.com/developers/applications](https://discord.com/developers/applications)
2. Создай новое приложение или выбери существующее
3. Перейди в раздел **"Bot"**
4. Нажми **"Reset Token"** и скопируй токен
5. Включи все **Privileged Gateway Intents**

### Как получить ID сервера и канала:
1. В Discord включи режим разработчика: Настройки → Расширенные → Режим разработчика
2. ПКМ на сервере → **"Скопировать ID сервера"**
3. ПКМ на канале → **"Скопировать ID канала"**

## Шаг 4: Установка зависимостей
В консоли (Shell) внизу выполни:
```bash
npm install
```

## Шаг 5: Запуск бота
Нажми большую зеленую кнопку **"Run"** вверху

Бот должен запуститься и вывести:
```
✅ Бот запущен как YourBotName#1234
Keep-alive server running on port 3000
```

## Шаг 6: Поддержание бота онлайн 24/7

Replit может усыпить бота при неактивности. Чтобы этого избежать:

### Вариант 1: UptimeRobot (рекомендуется)
1. Зайди на [uptimerobot.com](https://uptimerobot.com)
2. Зарегистрируйся (бесплатно)
3. Нажми **"Add New Monitor"**
4. Настрой:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `Burp Tickets Bot`
   - URL: `https://твой-repl.replit.app` (скопируй из адресной строки Replit)
   - Monitoring Interval: **5 minutes**
5. Нажми **"Create Monitor"**

### Вариант 2: Replit Always On (платно)
- В настройках Repl включи **"Always On"** ($7/месяц)

## Создание панели тикетов

После запуска бота:
1. Открой консоль в Replit (Shell)
2. Запусти Node.js: `node`
3. Выполни команды:
```javascript
const bot = require('./index.js');
bot.sendTicketPanel('ID_КАНАЛА_ДЛЯ_ПАНЕЛИ');
```

Или создай отдельный файл `setup.js`:
```javascript
const { sendTicketPanel } = require('./index.js');
sendTicketPanel('ID_КАНАЛА_ДЛЯ_ПАНЕЛИ');
```

И запусти: `node setup.js`

## Проблемы и решения

### Бот не запускается
- Проверь правильность токена в Secrets
- Убедись что все зависимости установлены: `npm install`
- Проверь логи в консоли

### Бот засыпает
- Настрой UptimeRobot для пинга каждые 5 минут
- Или используй платную подписку Replit Always On

### Ошибка "Invalid Token"
- Перегенерируй токен на Discord Developer Portal
- Обнови токен в Secrets

### Бот не видит сообщения
- Включи все Privileged Gateway Intents в настройках бота на Discord Developer Portal
