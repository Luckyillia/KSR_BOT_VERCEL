# KSR Bot для Vercel + Supabase

Telegram бот для аренды автомобилей с базой данных Supabase, развернутый на Vercel.

## 🚀 Быстрый старт

### 1. Установите зависимости
```bash
npm install
```

### 2. Настройте Supabase

**Следуйте подробной инструкции в файле [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

Краткая версия:
1. Создайте проект на https://supabase.com
2. Выполните SQL из файла `supabase_schema.sql`
3. Получите `SUPABASE_URL` и `SUPABASE_KEY`

### 3. Настройте переменные окружения

Создайте файл `.env`:
```bash
cp .env.example .env
```

Заполните все переменные:
```env
BOT_TOKEN=ваш_токен_от_BotFather
ADMIN_ID=ваш_telegram_id
ADMIN_ASSISTANT=telegram_id_помощника
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJхххххххх
```

### 4. Деплой на Vercel

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Войдите в аккаунт
vercel login

# Задеплойте проект
vercel --prod
```

### 5. Добавьте переменные окружения в Vercel

Через веб-интерфейс:
1. https://vercel.com/dashboard → ваш проект
2. Settings → Environment Variables
3. Добавьте все 5 переменных из `.env`

Или через CLI:
```bash
vercel env add BOT_TOKEN
vercel env add ADMIN_ID
vercel env add ADMIN_ASSISTANT
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
```

### 6. Установите webhook

```powershell
$body = @{url='https://ваш-домен.vercel.app/api/webhook'} | ConvertTo-Json
Invoke-WebRequest -Uri 'https://api.telegram.org/botВАШ_ТОКЕН/setWebhook' -Method POST -Body $body -ContentType 'application/json'
```

## 📁 Структура проекта

```
├── api/
│   └── webhook.js          # Webhook endpoint для Vercel
├── src/
│   ├── bot.js              # Основной файл (для локального запуска)
│   ├── data.json           # Начальные данные (не используется после миграции)
│   └── utils/
│       ├── supabaseClient.js    # Подключение к Supabase
│       ├── adminAction.js       # Админ функции
│       ├── bookModule.js        # Бронирование
│       ├── usedCar.js          # Аренда автомобилей
│       ├── userMessage.js      # Обработка сообщений
│       ├── userAction.js       # Действия пользователя
│       ├── navigationButton.js # Навигация
│       └── carFunctions.js     # Функции работы с авто
├── supabase_schema.sql     # SQL схема базы данных
├── SUPABASE_SETUP.md       # Подробная инструкция по Supabase
├── package.json
└── vercel.json
```

## 🗄️ База данных

Проект использует **Supabase (PostgreSQL)** для хранения:
- **cars** - каталог автомобилей
- **bookings** - бронирования
- **used_cars** - активные аренды
- **user_car_index** - индексы навигации пользователей

## 🎯 Функции бота

### Для пользователей:
- 🚗 Просмотр всех доступных автомобилей
- 🔍 Фильтрация по цене и названию
- 📝 Бронирование автомобилей
- 📄 Список всех автомобилей

### Для администраторов:
- ➕ Добавление новых автомобилей
- ✏️ Редактирование данных автомобилей
- 🗑️ Удаление автомобилей
- 📅 Просмотр бронирований
- ✅ Перевод бронирований в аренду
- ⏰ Автоматическая проверка истекших аренд

## 🔧 Локальная разработка

```bash
# Запустить бота локально (с long-polling)
npm run dev
```

⚠️ **Примечание**: Для локального запуска нужно обновить `src/bot.js` чтобы он использовал Supabase вместо файлов.

## 📊 Просмотр данных

Откройте Supabase Dashboard:
1. https://supabase.com → ваш проект
2. Table Editor
3. Выберите таблицу для просмотра/редактирования

## ⚠️ Важные замечания

### Cron задачи
Функция `checkExpiredRentals` вызывается командой `/check`. Для автоматической проверки настройте Vercel Cron Jobs:

Создайте `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron-check",
    "schedule": "0 */4 * * *"
  }]
}
```

### Изображения автомобилей
Изображения хранятся локально в `src/res/img/`. Для production рекомендуется:
- Загрузить изображения в Supabase Storage
- Или использовать CDN (Cloudinary, imgix)

## 🐛 Troubleshooting

### Бот не отвечает
```bash
# Проверьте логи Vercel
vercel logs https://ваш-deployment-url

# Проверьте webhook
Invoke-WebRequest -Uri "https://api.telegram.org/botТОКЕН/getWebhookInfo"
```

### Ошибки базы данных
- Проверьте переменные `SUPABASE_URL` и `SUPABASE_KEY`
- Убедитесь что SQL схема выполнена
- Проверьте Table Editor в Supabase

### Изображения не загружаются
- Убедитесь что файлы есть в `src/res/img/`
- Проверьте пути в базе данных (поле `img`)

## 📝 Лицензия

MIT

## 🤝 Поддержка

Если возникли проблемы:
1. Проверьте [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Проверьте логи в Vercel
3. Проверьте данные в Supabase Table Editor
