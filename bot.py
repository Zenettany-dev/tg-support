import asyncio
import logging
import signal
import sys
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.client.default import DefaultBotProperties

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

bot = Bot(
    token="TYT_TOKEN",
    default=DefaultBotProperties(parse_mode="HTML")
)
dp = Dispatcher()
ADMIN_CHAT = "TYT_ID_CHAT_ADMIN"
user_requests = {}
message_counter = {}

@dp.message(Command("start"))
async def start_cmd(message: Message):
    await message.answer("✅ Бот поддержки Zenettany активен. Используйте /help для обращения.")

@dp.message(Command("help"))
async def help_cmd(message: Message):
    if len(message.text.split()) < 2:
        await message.answer("Используйте: /help [ваш вопрос]")
        return
    
    request_text = message.text.split(maxsplit=1)[1]
    request_id = message.message_id
    
    user_key = f"{message.from_user.id}_{message.chat.id}"
    if user_key not in message_counter:
        message_counter[user_key] = 1
    else:
        message_counter[user_key] += 1
    
    short_id = f"{message.from_user.id}_{message_counter[user_key]}"
    
    user_requests[short_id] = {
        'user_id': message.from_user.id,
        'username': message.from_user.username,
        'full_message_id': request_id
    }
    
    admin_msg = (
        f"🆕 НОВЫЙ ЗАПРОС\n"
        f"👤 ID: <code>{message.from_user.id}</code>\n"
        f"📛 Username: @{message.from_user.username or 'Нет'}\n"
        f"🆔 Короткий ID: <code>{short_id}</code>\n"
        f"📝 Текст: {request_text}\n\n"
        f"📤 Для ответа: /otvet {short_id} [текст]\n"
        f"📤 Или: /otvet @{message.from_user.username} [текст]"
    )
    await bot.send_message(ADMIN_CHAT, admin_msg)
    await message.answer("✅ Ваш запрос отправлен администраторам. Ожидайте ответа.")

@dp.message(Command("otvet"))
async def reply_cmd(message: Message):
    if str(message.chat.id) != ADMIN_CHAT:
        return
    
    args = message.text.split(maxsplit=2)
    if len(args) < 3:
        await message.answer("Используйте: /otvet [короткий_id/username] [текст ответа]")
        await message.answer("Примеры:\n/otvet 123456_1 Привет\n/otvet @username Привет")
        return
    
    target = args[1]
    reply_text = args[2]
    
    user_id = None
    username = None
    
    if target.startswith('@'):
        username = target[1:].lower()
        for short_id, user_data in user_requests.items():
            if user_data['username'] and user_data['username'].lower() == username:
                user_id = user_data['user_id']
                username = user_data['username']
                break
    else:
        if target in user_requests:
            user_data = user_requests[target]
            user_id = user_data['user_id']
            username = user_data['username']
    
    if not user_id:
        await message.answer(f"❌ Пользователь не найден: {target}")
        return
    
    try:
        await bot.send_message(
            user_id,
            f"💌 Ответ от поддержки:\n\n{reply_text}\n\nРазработчик: @kannadec | aurproject.eu"
        )
        
        await message.answer(
            f"✅ Ответ отправлен пользователю:\n"
            f"👤 ID: <code>{user_id}</code>\n"
            f"📛 @{username or 'Нет'}\n"
            f"📝 Ответ: {reply_text[:50]}..."
        )
        
    except Exception as e:
        await message.answer(f"❌ Ошибка при отправке: {str(e)}")

@dp.message(F.text)
async def handle_text(message: Message):
    if message.chat.type == "private" and not message.text.startswith("/"):
        await message.answer("Для обращения используйте команду /help [ваш вопрос]")

async def on_shutdown():
    logger.info("Бот выключается...")
    await bot.session.close()

async def main():
    dp.shutdown.register(on_shutdown)
    
    try:
        logger.info("Бот запускается...")
        await dp.start_polling(bot, skip_updates=True)
    except KeyboardInterrupt:
        logger.info("Бот остановлен пользователем")
    except Exception as e:
        logger.error(f"Ошибка: {e}")
    finally:
        await on_shutdown()

def signal_handler(signum, frame):
    logger.info(f"Получен сигнал {signum}, завершаю работу...")
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Работа завершена")
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}")