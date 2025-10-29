const supabase = require('./supabaseClient');

// Функция для выбора срока аренды
async function handleChooseRentalDuration(ctx, bookingId) {
  await ctx.answerCbQuery();
  await ctx.editMessageText("⚙️ Выберите на сколько дать в аренду", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "День", callback_data: `day_${bookingId}` }],
        [{ text: "Неделя", callback_data: `week_${bookingId}` }],
        [{ text: "Месяц", callback_data: `month_${bookingId}` }],
        [{ text: "⬅️ Назад в список всех бронирований", callback_data: 'view_bookings' }]
      ]
    }
  });
}

// Основная функция для обработки добавления в использование
async function handleAddToUsed(ctx, bookingId, adminChatId, adminAssistantChatId) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;

  // Определяем продолжительность аренды в днях и текст для уведомления
  const rentalDuration = getRentalDuration(ctx.callbackQuery.data);
  if (!rentalDuration) {
    await ctx.reply("❌ Ошибка: неверный тип аренды.");
    return;
  }

  try {
    // Получить бронирование
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, cars(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      await ctx.reply("❌ Ошибка: бронирование не найдено.");
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + rentalDuration.days);

    // Создать запись об аренде
    const { error: usedCarError } = await supabase
      .from('used_cars')
      .insert({
        car_id: booking.car_id,
        user_id: booking.user_id,
        user_name: booking.user_name,
        rental_duration: rentalDuration.type,
        rental_term: 1,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (usedCarError) {
      console.error("Ошибка при создании аренды:", usedCarError);
      await ctx.reply("❌ Ошибка при сохранении данных.");
      return;
    }

    // Удалить бронирование
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      console.error("Ошибка при удалении бронирования:", deleteError);
    }

    await ctx.editMessageText(`🚗 Вы дали на аренду автомобиль на ${rentalDuration.text}: ${booking.cars.name}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Назад в список всех бронирований", callback_data: 'view_bookings' }]
        ]
      }
    });

    const userLink = `[${ctx.from.username || 'Без имени'}](tg://user?id=${userId})`;
    const messageText = `👤 Пользователь ${userLink} добавил новый автомобиль в использование:\n🚗 ${booking.cars.name}`;
    if (adminChatId !== ctx.from.id && adminAssistantChatId === ctx.from.id) {
      await ctx.telegram.sendMessage(adminChatId, messageText, { parse_mode: 'Markdown' });
    }
    if (adminChatId === ctx.from.id && adminAssistantChatId !== ctx.from.id) {
      await ctx.telegram.sendMessage(adminAssistantChatId, messageText, { parse_mode: 'Markdown' });
    }

    console.log(`Автомобиль ${booking.cars.name} был добавлен в использование.`);
  } catch (error) {
    console.error("Ошибка в handleAddToUsed:", error);
    await ctx.reply("❌ Произошла ошибка.");
  }
}

// Вспомогательная функция для получения продолжительности аренды
function getRentalDuration(callbackData) {
  const parts = callbackData.split('_');
  const durationType = parts[0]; // day, week, month
  switch (durationType) {
    case 'day':
      return { days: 1, text: '1 день', type: 'day' };
    case 'week':
      return { days: 7, text: '1 неделя', type: 'week' };
    case 'month':
      return { days: 30, text: '1 месяц', type: 'month' };
    default:
      return null;
  }
}

async function checkExpiredRentals(ctx, adminChatId, adminAssistantChatId) {
  console.log("Проверка истекших сроков аренды начата...");

  const currentDate = new Date();

  // Получить все истекшие аренды
  const { data: expiredRentals, error } = await supabase
    .from('used_cars')
    .select('*, cars(id, name)')
    .lt('end_date', currentDate.toISOString());

  if (error) {
    console.error("Ошибка при проверке истекших аренд:", error);
    return;
  }

  if (!expiredRentals || expiredRentals.length === 0) {
    console.log("Нет истекших автомобилей для обработки.");
    return;
  }

  for (const rental of expiredRentals) {
    const messageText = `⚠️ Срок аренды автомобиля "${rental.cars.name.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')}" истек для пользователя ${rental.user_name.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')}.`;

    console.log(`Отправка сообщения: ${messageText}`);
    try {
      await ctx.telegram.sendMessage(adminChatId, messageText, { parse_mode: 'Markdown' });
      await ctx.telegram.sendMessage(adminAssistantChatId, messageText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
    }

    // Вернуть автомобиль в доступные
    await supabase
      .from('cars')
      .update({ is_available: true })
      .eq('id', rental.car_id);

    // Удалить запись об аренде
    await supabase
      .from('used_cars')
      .delete()
      .eq('id', rental.id);
  }

  console.log(`Обработано ${expiredRentals.length} истекших аренд.`);
}

// Добавить функцию для обработки срока аренды (месяц с выбором количества)
async function handleTermToUsed(ctx, bookingId, userStates) {
  await ctx.answerCbQuery();
  userStates[ctx.from.id] = { state: 'awaiting_month_term', bookingId };
  await ctx.editMessageText("📅 Введите количество месяцев аренды (число):", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅️ Назад в список всех бронирований", callback_data: 'view_bookings' }]
      ]
    }
  });
}



module.exports = {
  handleChooseRentalDuration,
  handleAddToUsed,
  checkExpiredRentals,
  handleTermToUsed
};
