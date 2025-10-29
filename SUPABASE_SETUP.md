# Настройка Supabase для Telegram бота

## Шаг 1: Создание проекта Supabase

1. Перейдите на https://supabase.com
2. Нажмите **"Start your project"** или **"New Project"**
3. Войдите через GitHub (или создайте аккаунт)
4. Создайте новую организацию (если нужно)
5. Создайте новый проект:
   - **Name**: KSR Bot (или любое название)
   - **Database Password**: создайте надежный пароль (сохраните его!)
   - **Region**: выберите ближайший регион (например, Europe West)
   - Нажмите **"Create new project"**

⏳ Подождите 1-2 минуты пока проект создается.

## Шаг 2: Создание таблиц базы данных

1. В левом меню выберите **"SQL Editor"**
2. Нажмите **"New query"**
3. Скопируйте содержимое файла `supabase_schema.sql` и вставьте в редактор
4. Нажмите **"Run"** (или Ctrl+Enter)

✅ Должно появиться сообщение об успешном выполнении.

## Шаг 3: Получение API ключей

1. В левом меню выберите **"Settings"** (⚙️)
2. Выберите **"API"**
3. Найдите два ключа:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** ключ (длинная строка начинающаяся с `eyJ...`)

## Шаг 4: Настройка переменных окружения

### Для локальной разработки:

Создайте файл `.env` в корне проекта:

```env
BOT_TOKEN=ваш_токен_бота
ADMIN_ID=ваш_telegram_id
ADMIN_ASSISTANT=telegram_id_помощника
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJхххххххххх
```

### Для Vercel:

1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте следующие переменные:

| Name | Value |
|------|-------|
| `BOT_TOKEN` | Токен от @BotFather |
| `ADMIN_ID` | Ваш Telegram ID |
| `ADMIN_ASSISTANT` | Telegram ID помощника |
| `SUPABASE_URL` | URL из Supabase |
| `SUPABASE_KEY` | anon ключ из Supabase |

5. Для каждой переменной выберите окружения: **Production**, **Preview**, **Development**

## Шаг 5: Установка зависимостей и деплой

```bash
# Установить зависимости
npm install

# Задеплоить на Vercel
vercel --prod
```

## Шаг 6: Настройка webhook

После успешного деплоя выполните:

```powershell
$body = @{url='https://ваш-домен.vercel.app/api/webhook'} | ConvertTo-Json
Invoke-WebRequest -Uri 'https://api.telegram.org/botВАШ_ТОКЕН/setWebhook' -Method POST -Body $body -ContentType 'application/json'
```

Замените:
- `ваш-домен.vercel.app` на ваш домен Vercel
- `ВАШ_ТОКЕН` на токен бота

## Проверка работы

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Бот должен ответить приветственным сообщением

## Просмотр данных в Supabase

1. В Supabase перейдите в **"Table Editor"**
2. Выберите таблицу (cars, bookings, used_cars)
3. Просматривайте и редактируйте данные

## Полезные SQL запросы

### Просмотр всех доступных автомобилей:
```sql
SELECT * FROM cars WHERE is_available = true;
```

### Просмотр активных бронирований:
```sql
SELECT b.*, c.name as car_name 
FROM bookings b 
JOIN cars c ON b.car_id = c.id;
```

### Просмотр активных аренд:
```sql
SELECT u.*, c.name as car_name 
FROM used_cars u 
JOIN cars c ON u.car_id = c.id 
WHERE u.end_date > NOW();
```

## Troubleshooting

### Ошибка "SUPABASE_URL и SUPABASE_KEY должны быть установлены"
- Проверьте, что переменные окружения добавлены в Vercel
- Передеплойте проект после добавления переменных

### Ошибка "relation does not exist"
- Убедитесь, что SQL схема была выполнена успешно
- Проверьте в Table Editor наличие таблиц

### Бот не отвечает
- Проверьте логи в Vercel: `vercel logs https://ваш-deployment-url`
- Проверьте webhook: `Invoke-WebRequest -Uri "https://api.telegram.org/botТОКЕН/getWebhookInfo"`

## Бесплатный tier Supabase

- ✅ 500 MB базы данных
- ✅ 1 GB хранилища файлов
- ✅ 2 GB трафика
- ✅ 50,000 ежемесячных активных пользователей

Этого достаточно для небольшого бота!
