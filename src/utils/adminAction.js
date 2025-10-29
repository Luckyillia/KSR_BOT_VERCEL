const supabase = require('./supabaseClient');
const { Markup } = require('telegraf');

async function viewBookings(ctx) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      user_id,
      user_name,
      booking_date,
      cars (id, name, stage, price_day, price_week, price_month, zalog, img)
    `)
    .order('booking_date', { ascending: false });

  if (error) {
    console.error('Ошибка получения бронирований:', error);
    await ctx.editMessageText("❌ Ошибка загрузки бронирований");
    return;
  }

  if (bookings.length === 0) {
    await ctx.editMessageText("📭 *Список бронирований пуст.*", {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Назад в админ-панель", callback_data: 'back_to_admin' }]
        ]
      }
    });
  } else {
    const bookingInfo = bookings.map((booking, index) => [
      { text: `#${index + 1} ${booking.cars.name} 🗒️`, callback_data: `booking_info_${booking.id}` },
      { text: '➕ Добавить в использование', callback_data: `add_to_used_${booking.id}` },
      { text: "🗑️ Удалить", callback_data: `delete_booking_${booking.id}` }
    ]);

    await ctx.editMessageText("📜 *Список всех бронирований:*", {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          ...bookingInfo,
          [{ text: "⬅️ Назад в админ-панель", callback_data: 'back_to_admin' }]
        ]
      }
    });
  }
}

async function handleManageCars(ctx) {
  await ctx.answerCbQuery();
  await ctx.editMessageText("⚙️ Выберите действие с автомобилями:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Добавить авто", callback_data: 'add_car' }],
        [{ text: "➖ Удалить авто", callback_data: 'delete_car' }],
        [{ text: "✏️ Редактировать авто", callback_data: 'find_car_to_edit' }],
        [{ text: "⬅️ Назад в админ-панель", callback_data: 'back_to_admin' }]
      ]
    }
  });
}

async function handleAddCar(ctx, userStates) {
  await ctx.answerCbQuery();
  userStates[ctx.from.id] = 'adding_car';
  await ctx.editMessageText("📥 *Пожалуйста, отправьте данные авто в формате:*\n\nНазвание | Стейджи | Цена (день/неделя/месяц) | Залог | Изображение",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Назад в управление автомобилями", callback_data: 'manage_cars' }]
        ]
      }
    });
}

async function handleDeleteCar(ctx, userStates) {
  await ctx.answerCbQuery();
  await ctx.editMessageText("🗑️ Введите название автомобиля, который хотите удалить:",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Назад в управление автомобилями", callback_data: 'manage_cars' }]
        ]
      }
    });
  userStates[ctx.from.id] = 'delete_car';
}

async function handleFindCarToEdit(ctx, userStates) {
  await ctx.answerCbQuery();
  userStates[ctx.from.id] = { state: 'finding_car' };
  await ctx.editMessageText("✏️ *Введите название автомобиля, который хотите редактировать:*",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Назад в управление автомобилями", callback_data: 'manage_cars' }]
        ]
      }
    });
}

async function handleDeleteBooking(ctx, bookingId) {
  // Получить информацию о бронировании
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, cars(id, name)')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    await ctx.answerCbQuery("❌ Ошибка: Бронирование не найдено.");
    return;
  }

  // Удалить бронирование
  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (deleteError) {
    console.error('Ошибка удаления бронирования:', deleteError);
    await ctx.answerCbQuery("❌ Ошибка удаления бронирования");
    return;
  }

  // Вернуть автомобиль в доступные
  const { error: updateError } = await supabase
    .from('cars')
    .update({ is_available: true })
    .eq('id', booking.car_id);

  if (updateError) {
    console.error('Ошибка обновления автомобиля:', updateError);
  }

  await ctx.answerCbQuery(`✅ Бронирование автомобиля ${booking.cars.name} удалено.`);

  // Обновить список бронирований
  await viewBookings(ctx);
}

async function handleBookingInfo(ctx, bookingId) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, cars(name)')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    await ctx.reply("❌ Ошибка: Бронирование не найдено.");
    return;
  }

  const userLink = `[${booking.user_name}](tg://user?id=${booking.user_id})`;
  const carName = booking.cars.name;
  const date = new Date(booking.booking_date).toLocaleString('ru-RU');

  await ctx.editMessageText(
    `📄 *Информация о бронировании:*\n👤 Пользователь: ${userLink}\n🚗 Авто: ${carName}\n📅 Дата: ${date}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Назад к списку бронирований", callback_data: 'view_bookings' }]
        ]
      }
    }
  );
}

async function listCarForAdmin(ctx){
  const { data: cars, error } = await supabase
    .from('cars')
    .select('id, name, is_available')
    .order('id');

  if (error) {
    console.error('Ошибка получения списка авто:', error);
    await ctx.editMessageText("❌ Ошибка загрузки списка автомобилей");
    return;
  }

  let list = '📄 **Список всех авто**\n\n';
  cars.forEach((car, idx) => {
    const status = car.is_available ? '✅' : '❌';
    list += `${idx + 1}. ${car.name} ${status}\n`;
  });

  ctx.editMessageText(list, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅️ Назад в админ-панель", callback_data: 'back_to_admin' }]
      ]
    }
  });
}

module.exports = {
  handleManageCars,
  handleDeleteCar,
  handleAddCar,
  viewBookings,
  handleFindCarToEdit,
  handleBookingInfo,
  handleDeleteBooking,
  listCarForAdmin
};
