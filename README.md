# tg-support

# Telegram Support Bot / Телеграм Бот Поддержки

Простой Telegram-бот для приёма обращений от пользователей и ответов администрации.  
Сделан без лишней логики и наворотов — чисто рабочий инструмент поддержки.

---

## English Version

### Description
Telegram bot for handling user support requests with admin reply functionality.

### How It Works
- User sends a message via `/help [message]`
- Bot forwards the request to the admin chat with user information
- Admin replies using `/otvet @message_id [response]`
- Bot sends the response back to the user automatically

### Features
- Support request system
- Admin replies from admin chat
- Automatic message forwarding
- No database (data stored in memory)

### Installation
```bash
pip install aiogram
Configuration
Get bot token from @BotFather

Replace bot token in code (line 10)

Set admin chat ID (line 11)

Add the bot to the admin chat

Commands
/start — welcome message
/help [message] — send support request
/otvet @id [text] — admin reply (admin chat only)

Копировать код
python bot.py
Notes
Developed by Zenettany (@kannadec)

Created for aurproject.eu

Requests are stored in memory and lost after restart
