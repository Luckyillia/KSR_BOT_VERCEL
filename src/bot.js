require('dotenv').config();

const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const userModule = require('./utils/userMessage');
const bookModule = require('./utils/bookModule');
const navigationButton = require('./utils/navigationButton');
const adminAction = require('./utils/adminAction');
const userAction = require('./utils/userAction');
const usedCar = require('./utils/usedCar');

const adminChatId = process.env.ADMIN_ID;
const adminAssistantChatId = process.env.ADMIN_ASSISTANT;

let userCarIndex = {};
const userStates = {};
let lastCtx;
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  userAction.startHandler(ctx);
  lastCtx = ctx;
});
bot.hears('🚗 Все Авто', (ctx) => userAction.allCarsHandler(ctx, userCarIndex));
bot.hears('🔍 Фильтр Авто', (ctx) => userAction.filterCarsHandler(ctx, userStates));
bot.hears('📄 Список всех авто', (ctx) => userAction.listCar(ctx));
bot.command('admin', (ctx) => userAction.adminHandler(ctx, adminChatId, adminAssistantChatId));
bot.command('check', (ctx) => usedCar.checkExpiredRentals(ctx, adminChatId, adminAssistantChatId));

bot.action('next_car', (ctx) => navigationButton.handleNextCar(ctx, userCarIndex));
bot.action('prev_car', (ctx) => navigationButton.handlePrevCar(ctx, userCarIndex));
bot.action('next_filtered_car', (ctx) => navigationButton.handleNextFilteredCar(ctx, userModule, userCarIndex));
bot.action('prev_filtered_car', (ctx) => navigationButton.handlePrevFilteredCar(ctx, userModule, userCarIndex));
bot.action('go_to_main', (ctx) => navigationButton.handleGoToMain(ctx));
bot.action('back_to_admin', (ctx) => navigationButton.handleBackToAdmin(ctx));

bot.action('book_car', (ctx) => bookModule.handleBooking(ctx, adminChatId, adminAssistantChatId));

bot.action('view_bookings', (ctx) => adminAction.viewBookings(ctx));
bot.action('list_car', (ctx) => adminAction.listCarForAdmin(ctx));
bot.action('manage_cars', (ctx) => adminAction.handleManageCars(ctx));
bot.action('add_car', (ctx) => adminAction.handleAddCar(ctx, userStates));
bot.action('delete_car', (ctx) => adminAction.handleDeleteCar(ctx, userStates));
bot.action('find_car_to_edit', (ctx) => adminAction.handleFindCarToEdit(ctx, userStates));
bot.action(/delete_booking_(\d+)/, (ctx) => {
  const bookingId = parseInt(ctx.match[1]);
  adminAction.handleDeleteBooking(ctx, bookingId);
});
bot.action(/booking_info_(\d+)/, (ctx) => {
  const bookingId = parseInt(ctx.match[1]);
  adminAction.handleBookingInfo(ctx, bookingId);
});
bot.action(/add_to_used_(\d+)/, (ctx) => {
  const bookingId = parseInt(ctx.match[1]);
  usedCar.handleChooseRentalDuration(ctx, bookingId);
});
bot.action(/day_(\d+)/, (ctx) => {
  const bookingId = parseInt(ctx.match[1]);
  usedCar.handleAddToUsed(ctx, bookingId, adminChatId, adminAssistantChatId);
});
bot.action(/week_(\d+)/, (ctx) => {
  const bookingId = parseInt(ctx.match[1]);
  usedCar.handleAddToUsed(ctx, bookingId, adminChatId, adminAssistantChatId);
});
bot.action(/month_(\d+)/, (ctx) => {
  const bookingId = parseInt(ctx.match[1]);
  usedCar.handleTermToUsed(ctx, bookingId, userStates);
});

bot.on('message', (ctx) => {
  userModule.handleMessage(ctx, userStates, userCarIndex, adminChatId, adminAssistantChatId);
  lastCtx = ctx;
});

cron.schedule('0 */4 * * *', () => {
  console.log('Проверка истекших сроков аренды...');
  usedCar.checkExpiredRentals(lastCtx,adminChatId,adminAssistantChatId);
});

bot.launch();

process.once('SIGINT', () => {
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});