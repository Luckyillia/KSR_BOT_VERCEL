const { Markup } = require('telegraf');
const supabase = require('./supabaseClient');
const { sendCar } = require('./carFunctions');


async function startHandler(ctx) {
  await ctx.reply(
    'Привет! Я твой личный помощник по аренде автомобилей. \n\n' +
    'Здесь ты можешь:\n' +
    '- Просмотреть все доступные автомобили.\n' +
    '- Использовать фильтр для поиска идеального авто.\n' +
    '- Узнать детали о каждом автомобиле.\n\n' +
    'Что бы ты хотел сделать сегодня? Выбери опцию ниже:',
    Markup.keyboard([
      ['Все Авто','Список всех авто', 'Фильтр Авто']
    ]).resize()
  );
}

async function allCarsHandler(ctx, userCarIndex) {
  const userId = ctx.from.id;
  userCarIndex[userId] = 0; // Сброс индекса пользователя
  console.log(ctx.from);
  await ctx.reply('Здесь все автомобили:', Markup.removeKeyboard());

  await sendCar(ctx, userCarIndex[userId], supabase);
}

async function filterCarsHandler(ctx, userStates) {
  await ctx.reply("Фильтр авто", Markup.removeKeyboard());
  const filtr =  "**Примеры**\n\n" +
    "Только по названию пример: (BMW)\n\n" +
    "Только по цене от-до и на какой срок пример: (0-12.000 / (день, неделя, месяц))\n\n" +
    "И по названию и по цене пример: (BMW, 0-12.000 / (день, неделя, месяц))\n\n" +
    "*Примечание*: Тысячи отделяются точкой.\n\n" +
    "Пожалуйста, введите свой фильтр.";
  ctx.reply(filtr, Markup.inlineKeyboard([
    Markup.button.callback('Вернуться в главное меню', 'go_to_main')
  ]));
  userStates[ctx.from.id] = 'filter_cars';
}

async function adminHandler(ctx, adminChatId, adminAssistantChatId) {
  if (adminChatId != ctx.from.id && adminAssistantChatId != ctx.from.id) {
    return ctx.reply("*Извините, доступ к админ-панели запрещен.*\n\nВернуться в главное меню", Markup.keyboard([
      ['Все Авто','Список всех авто', 'Фильтр Авто']
    ]).resize());
  }
  await ctx.reply("Добро пожаловать в админ-панель!", Markup.removeKeyboard());
  await ctx.reply("*Список Доступных Функций*", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Просмотр забронированных авто", callback_data: 'view_bookings' }],
        [{ text: "Управление автомобилями", callback_data: 'manage_cars' }],
        [{ text: "Список всех автомобилей", callback_data: 'list_car' }],
        [{ text: "Выход из админ панели", callback_data: 'go_to_main' }]
      ]
    }
  });
}

async function listCar(ctx) {
  await ctx.reply("Список всех авто", Markup.removeKeyboard());

  const { data: cars, error } = await supabase
    .from('cars')
    .select('id, name, is_available')
    .order('id');

  if (error) {
    console.error('Ошибка получения списка авто:', error);
    await ctx.reply("Ошибка загрузки списка автомобилей");
    return;
  }

  let list = '';
  cars.forEach((car, idx) => {
    const status = car.is_available ? ' ' : ' ';
    list += `${idx + 1}. ${car.name} ${status}\n`;
  });

  ctx.reply(list, Markup.inlineKeyboard([
    Markup.button.callback('Вернуться в главное меню', 'go_to_main')
  ]));
}

module.exports = {
  startHandler,
  allCarsHandler,
  filterCarsHandler,
  adminHandler,
  listCar
};