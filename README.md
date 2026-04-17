# Burp Tickets Discord Bot

Discord бот для системы тикетов Burp Rust сервера.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте `.env` файл на основе `.env.example`:
```bash
cp .env.example .env
```

3. Заполните `.env` файл:
- `DISCORD_TOKEN` - токен вашего Discord бота
- `GUILD_ID` - ID вашего Discord сервера
- `TICKET_CHANNEL_ID` - ID канала для панели тикетов

## Запуск

```bash
npm start
```

## Создание панели тикетов

После запуска бота используйте команду в консоли Node.js:

```javascript
const bot = require('./index.js');
bot.sendTicketPanel('YOUR_CHANNEL_ID');
```

## Категории тикетов

- ⚠️ Заявка на разбан
- 👤 Вопросы по серверу
- 🛡️ Заявка на модерацию
- 🛡️ Заявка на хеллера
- ⚔️ Жалоба на игрока
- ⚔️ Жалоба на модератора


## Запуск 24/7

### Вариант 1: PM2 (на своем компьютере/VPS)

1. Установите PM2 глобально:
```bash
npm install -g pm2
```

2. Запустите бота через PM2:
```bash
npm run pm2:start
```

3. Настройте автозапуск при перезагрузке системы:
```bash
pm2 startup
pm2 save
```

4. Полезные команды:
```bash
npm run pm2:logs      # Просмотр логов
npm run pm2:monit     # Мониторинг
npm run pm2:restart   # Перезапуск
npm run pm2:stop      # Остановка
```

### Вариант 2: VPS хостинг

**Рекомендуемые провайдеры:**
- Timeweb (от 150₽/мес) - русский хостинг
- Beget (от 200₽/мес) - русский хостинг
- DigitalOcean (от $4/мес) - международный

**Инструкция для VPS:**
1. Подключитесь к VPS через SSH
2. Установите Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```
3. Загрузите файлы бота на сервер
4. Установите зависимости: `npm install`
5. Создайте `.env` файл с токеном
6. Запустите через PM2: `npm run pm2:start`

### Вариант 3: Бесплатные хостинги

**Glitch.com:**
- Бесплатно, но засыпает через 5 минут
- Используйте UptimeRobot для пинга

**Replit:**
- Бесплатно с ограничениями
- Может засыпать при неактивности

### Вариант 4: Windows Service (для Windows Server)

Используйте `node-windows` для создания службы Windows:
```bash
npm install -g node-windows
```
