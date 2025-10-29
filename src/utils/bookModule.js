const supabase = require('./supabaseClient');

async function handleBooking(ctx, adminChatId, adminAssistantChatId) {
  try {
    ctx.answerCbQuery('✅ Вы забронировали авто, с вами свяжутся');
    ctx.editMessageCaption('✅ Вы забронировали авто, с вами свяжутся', {
      parse_mode: 'Markdown',
    });

    ctx.reply("Чтобы вернуться домой, нажмите кнопку", {
      reply_markup: {
        inline_keyboard: [[
          { text: '🏠 Вернуться в главное меню', callback_data: 'go_to_main' }
        ]]
      }
    });

    const userId = ctx.from.id;
    const userName = ctx.from.username ? ctx.from.username : 'Без имени';
    const userLink = `[${userName}](tg://user?id=${userId})`;

    const carCaption = ctx.callbackQuery.message.caption;

    // Найти автомобиль по имени в caption
    const { data: cars, error: findError } = await supabase
      .from('cars')
      .select('*')
      .eq('is_available', true);

    if (findError) {
      console.error('Ошибка поиска автомобиля:', findError);
      return;
    }

    const car = cars.find(c => carCaption.includes(c.name));

    if (car) {
      // Создать бронирование
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          car_id: car.id,
          user_id: userId,
          user_name: userName
        });

      if (bookingError) {
        console.error('Ошибка создания бронирования:', bookingError);
        return;
      }

      // Пометить автомобиль как недоступный
      const { error: updateError } = await supabase
        .from('cars')
        .update({ is_available: false })
        .eq('id', car.id);

      if (updateError) {
        console.error('Ошибка обновления автомобиля:', updateError);
      }
    }

    ctx.telegram.sendMessage(adminChatId, `Пользователь ${userLink} забронировал автомобиль:\n${carCaption}`, {
      parse_mode: 'Markdown'
    });
    ctx.telegram.sendMessage(adminAssistantChatId, `Пользователь ${userLink} забронировал автомобиль:\n${carCaption}`, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Ошибка в handleBooking:', error);
  }
}

module.exports = { handleBooking };
