const { Markup } = require('telegraf');
const supabase = require('./supabaseClient');
const { sendCarData, filterByPrice } = require('./carFunctions.js');

let filteredCars = [];

function getFilteredCars() {
  return filteredCars;
}

async function handleMessage(ctx, userStates, userCarIndex, adminChatId, adminAssistantChatId) {
  if (ctx.message.photo || ctx.message.sticker || ctx.message.animation) {
    await ctx.reply("🚫 Извините, я вас не понимаю. Пожалуйста, отправьте текстовое сообщение.");
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error('Ошибка удаления сообщения:', error);
    }
    return;
  }

  const userId = ctx.from.id;
  const state = userStates[userId];

  switch (state?.state || state) {
    case 'adding_car': {
      const data = ctx.message.text.split('|').map(part => part.trim());

      if (data.length === 5) {
        const [name, stage, prices, zalog, img] = data;
        const priceParts = prices.split('/');

        if (priceParts.length === 3 && priceParts.every(price => !isNaN(price))) {
          const { error } = await supabase
            .from('cars')
            .insert({
              name,
              stage,
              price_day: priceParts[0],
              price_week: priceParts[1],
              price_month: priceParts[2],
              zalog,
              img: [img],
              is_available: true
            });

          if (error) {
            console.error('Ошибка добавления автомобиля:', error);
            await ctx.reply("❌ Ошибка при добавлении автомобиля.");
            return;
          }

          await ctx.reply(
            "🚗 Автомобиль успешно добавлен!",
            Markup.inlineKeyboard([Markup.button.callback('⬅️ Вернуться в админ панел', 'back_to_admin')])
          );

          const userName = ctx.from.username || 'Без имени';
          const userLink = `[${userName}](tg://user?id=${userId})`;
          const carData = `🚗 *Название*: ${name}\n🛠️ *Стейджи*: ${stage}\n💰 *Цена*: ${priceParts[0]} день / ${priceParts[1]} неделя / ${priceParts[2]} месяц\n🔑 *Залог*: ${zalog}\n`;
          
          if (adminChatId != ctx.from.id && adminAssistantChatId == ctx.from.id) {
            await ctx.telegram.sendMessage(adminChatId, `Пользователь ${userLink} добавил новый автомобиль:\n${carData}`, { parse_mode: 'Markdown' });
          }
          if (adminChatId == ctx.from.id && adminAssistantChatId != ctx.from.id) {
            await ctx.telegram.sendMessage(adminAssistantChatId, `Пользователь ${userLink} добавил новый автомобиль:\n${carData}`, { parse_mode: 'Markdown' });
          }
          delete userStates[userId];
        } else {
          await ctx.reply("🚫 *Неверный формат цены!* \n\nПожалуйста, убедитесь, что вы ввели три значения для цены в формате:\n*цена за день / цена за неделю / цена за месяц*\n\nПример: `1000/6000/20000`");
        }
      } else {
        await ctx.reply(
          "🚫 *Неверный формат данных!* \n\nПожалуйста, убедитесь, что вы используете правильный формат. \nОжидается следующий формат:\n`имя|стадия|цена_за_день/цена_за_неделю/цена_за_месяц|залог|ссылка_на_изображение`\n\nПример:\n`Toyota Camry|2020|1000/6000/20000|5000|Toyota_Camry.png`"
        );
      }
      break;
    }

    case 'finding_car': {
      const carName = ctx.message.text.trim();
      const { data: cars, error } = await supabase
        .from('cars')
        .select('*')
        .ilike('name', `%${carName}%`);

      if (error) {
        console.error('Ошибка поиска автомобиля:', error);
        await ctx.reply("❌ Ошибка поиска автомобиля.");
        return;
      }

      if (cars && cars.length > 0) {
        userStates[userId] = { state: 'editing_car', car: cars[0] };
        await ctx.reply("✅ *Автомобиль найден.*\nТеперь отправьте новые данные в формате:\n\n`Название | Стейджи | Цена (день/неделя/месяц) | Залог | Изображение`", { parse_mode: 'Markdown' });
      } else {
        await ctx.reply("❌ *Автомобиль не найден.*");
      }
      break;
    }

    case 'editing_car': {
      const car = state.car;
      const data = ctx.message.text.split('|').map(part => part.trim());

      if (data.length === 5) {
        const prices = data[2].split('/');
        
        const { error } = await supabase
          .from('cars')
          .update({
            name: data[0],
            stage: data[1],
            price_day: prices[0].trim(),
            price_week: prices[1].trim(),
            price_month: prices[2].trim(),
            zalog: data[3],
            img: [data[4]]
          })
          .eq('id', car.id);

        if (error) {
          console.error('Ошибка обновления автомобиля:', error);
          await ctx.reply("❌ Ошибка при обновлении автомобиля.");
          return;
        }

        await ctx.reply("✅ *Данные автомобиля успешно обновлены!*", Markup.inlineKeyboard([Markup.button.callback('⬅️ Вернуться в админ панел', 'back_to_admin')]));

        const userName = ctx.from.username || 'Без имени';
        const userLink = `[${userName}](tg://user?id=${userId})`;
        const carData = `🚗 *Название*: ${data[0]}\n🛠️ *Стейджи*: ${data[1]}\n💰 *Цена*: ${prices[0]} день / ${prices[1]} неделя / ${prices[2]} месяц\n🔑 *Залог*: ${data[3]}\n`;
        
        if (adminChatId != ctx.from.id && adminAssistantChatId == ctx.from.id) {
          await ctx.telegram.sendMessage(adminChatId, `Пользователь ${userLink} обновил автомобиль:\n${carData}`, { parse_mode: 'Markdown' });
        }
        if (adminChatId == ctx.from.id && adminAssistantChatId != ctx.from.id) {
          await ctx.telegram.sendMessage(adminAssistantChatId, `Пользователь ${userLink} обновил автомобиль:\n${carData}`, { parse_mode: 'Markdown' });
        }

        delete userStates[userId];
      } else {
        await ctx.reply("🚫 *Неверный формат данных!*");
      }
      break;
    }

    case 'delete_car': {
      const carName = ctx.message.text.trim();
      
      const { data: cars, error: findError } = await supabase
        .from('cars')
        .select('*')
        .ilike('name', carName);

      if (findError || !cars || cars.length === 0) {
        await ctx.reply("❌ *Автомобиль не найден.*", { parse_mode: 'Markdown' });
        return;
      }

      const car = cars[0];
      const { error: deleteError } = await supabase
        .from('cars')
        .delete()
        .eq('id', car.id);

      if (deleteError) {
        console.error('Ошибка удаления автомобиля:', deleteError);
        await ctx.reply("❌ Ошибка при удалении автомобиля.");
        return;
      }

      await ctx.reply(`✅ *Автомобиль ${carName} успешно удален.*`, Markup.inlineKeyboard([Markup.button.callback('⬅️ Вернуться в админ панел', 'back_to_admin')]));

      const userName = ctx.from.username || 'Без имени';
      const userLink = `[${userName}](tg://user?id=${userId})`;
      const carData = `🚗 *Название*: ${car.name}\n🛠️ *Стейджи*: ${car.stage}\n💰 *Цена*: ${car.price_day} день / ${car.price_week} неделя / ${car.price_month} месяц\n🔑 *Залог*: ${car.zalog}\n`;
      
      if (adminChatId != ctx.from.id && adminAssistantChatId == ctx.from.id) {
        await ctx.telegram.sendMessage(adminChatId, `Пользователь ${userLink} удалил автомобиль:\n${carData}`, { parse_mode: 'Markdown' });
      }
      if (adminChatId == ctx.from.id && adminAssistantChatId != ctx.from.id) {
        await ctx.telegram.sendMessage(adminAssistantChatId, `Пользователь ${userLink} удалил автомобиль:\n${carData}`, { parse_mode: 'Markdown' });
      }

      delete userStates[userId];
      break;
    }

    case 'filter_cars': {
      const priceRange = ctx.message.text.trim();
      
      const { data: allCars, error } = await supabase
        .from('cars')
        .select('*')
        .eq('is_available', true);

      if (error) {
        console.error('Ошибка получения автомобилей:', error);
        await ctx.reply("❌ Ошибка загрузки автомобилей.");
        return;
      }

      filteredCars = filterByPrice(allCars, priceRange);

      if (filteredCars.length > 0) {
        userCarIndex[userId] = 0;
        await sendCarData(ctx, filteredCars, userCarIndex[userId], true);
      } else {
        await ctx.reply("❌ Автомобили в указанном ценовом диапазоне не найдены.");
      }

      delete userStates[userId];
      break;
    }

    case 'awaiting_month_term': {
      const term = parseInt(ctx.message.text.trim());
      
      if (isNaN(term) || term <= 0) {
        await ctx.reply("❌ Пожалуйста, введите корректное число месяцев.");
        return;
      }

      const bookingId = state.bookingId;
      
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
      endDate.setMonth(endDate.getMonth() + term);

      // Создать запись об аренде
      const { error: usedCarError } = await supabase
        .from('used_cars')
        .insert({
          car_id: booking.car_id,
          user_id: booking.user_id,
          user_name: booking.user_name,
          rental_duration: 'month',
          rental_term: term,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (usedCarError) {
        console.error("Ошибка при создании аренды:", usedCarError);
        await ctx.reply("❌ Ошибка при сохранении данных.");
        return;
      }

      // Удалить бронирование
      await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      await ctx.reply(`🚗 Вы дали на аренду автомобиль на ${term} месяц(ев): ${booking.cars.name}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Назад в список всех бронирований", callback_data: 'view_bookings' }]
          ]
        }
      });

      const userLink = `[${ctx.from.username || 'Без имени'}](tg://user?id=${userId})`;
      const messageText = `👤 Пользователь ${userLink} добавил новый автомобиль в использование:\n🚗 ${booking.cars.name}\n📅 Срок: ${term} месяц(ев)`;
      
      if (adminChatId !== ctx.from.id && adminAssistantChatId === ctx.from.id) {
        await ctx.telegram.sendMessage(adminChatId, messageText, { parse_mode: 'Markdown' });
      }
      if (adminChatId === ctx.from.id && adminAssistantChatId !== ctx.from.id) {
        await ctx.telegram.sendMessage(adminAssistantChatId, messageText, { parse_mode: 'Markdown' });
      }

      delete userStates[userId];
      break;
    }

    default:
      await ctx.reply("🚫 Извините, я вас не понимаю. Пожалуйста, используйте кнопки меню.");
      break;
  }
}

module.exports = {
  handleMessage,
  getFilteredCars
};
