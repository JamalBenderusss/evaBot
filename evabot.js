const tgBot = require('node-telegram-bot-api');
const path = require('path');
const token = '7529465114:AAGbzCPm-RwaRpqMUOT02w6PriH9xsIM2Z0';
const bot = new tgBot(token, { polling: true });
const fs = require('fs');
const mongoose = require('mongoose');
const moment = require('moment');
// const { Recoverable } = require('repl');
// Подключение к MongoDB
mongoose.connect('mongodb+srv://ilyakoval2202:Vip552789@cluster0.4w3zh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

const appointmentSchema = new mongoose.Schema({
    user_id: Number,
    username: String,
    appointment_date: String,
    appointment_time: String,
    phone: String,
    type: String,
    status: { type: String, default: "confirmed" },
    reminder_sent_1h: { type: Boolean, default: false },
    reminder_sent_24h: { type: Boolean, default: false }  
});
const Appointment = mongoose.model('Appointment', appointmentSchema);


const keyboards = {
  mainOptions:[
    ['❇️ Записаться на услугу'],
    ['📋 УСЛУГИ'],
    ['🔥 АКЦИИ и СПЕЦПРЕДЛОЖЕНИЯ'],
    ['👩‍⚕️ О НАС'],
    ['✍️ Отзывы'],
    ['🚍 Как добраться']
  ],

  manic:[
    ['🟥 Маникюр с однородным покрытием с гелиевым укреплением','🟧 Снятие без покрытия'],
    ['🟨 Маникюр однородным покрытием ','🟩 Наращивание'],
    ['🟦 Маникюр без покрытия','🟪 Мужской маникюр'],
    ['❌ Вернуться назад']
  ],

  pedikure:[
    ['🔴 Педикюр с покрытием','🟠 Педикюр без покрытия'],
    ['🟡 Педикюр с покрытием пальцев без обработки стопы','🟢 Снятие без покрытия'],
    ['❌ Вернуться назад']
  ],

}

const userStates = {};
  

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (msg.contact) return 0;

  // Проверка текущего состояния пользователя
    if (userStates[chatId]?.state === 'waiting_for_name') {
        // Обработка имени пользователя
        userStates[chatId].name = text; // Сохраняем имя
      
        await bot.sendMessage(chatId, 'Напиши свой номер телефона в международном формате (+123456789012)... \n\n😃проще будет просто нажать кнопку ниже👇',
          {
            reply_markup: {
                keyboard: [
                    [{
                        text: "Отправить контакт 📱",
                        request_contact: true
                    }]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
            }
          }
        );
        return;
    }      

  switch (text) {
    case '/start':
      await bot.sendMessage(chatId, 'Отлично, вы нажали "Старт"! Давайте продолжим. 🎉');
      showMainMenu(chatId);
      break;

    // Услуги
    case '📋 УСЛУГИ':
      await bot.sendMessage(chatId, `Маникюр:
Маникюр однородным покрытием - 100 руб 
Маникюр с однородным покрытием с гелиевным укреплением 
Наращивание
Маникюр без покрытия
Мужской маникюр 
Снятие без покрытия
Педикюр: 
Педикюр с покрытием 
Педикюр без покрытия 
Педикюр с покрытием пальцев без обработки стопы
Снятие без покрытия
*В подарок носки`, {
        reply_markup: {
          keyboard: [
            ['❇️ Записаться на услугу'],
            ['❌ Вернуться назад']
          ],
          resize_keyboard: true
        }
      });
      break;


    case '❇️ Записаться на услугу': 
    
    await bot.sendMessage(chatId,`Супер
Выбери услугу, которая тебя интересует
Из предложенных: `,{
    parse_mode: 'Markdown',
    reply_markup: {
    keyboard: [
        ['💅 Маникюр','💅 Педикюр'],
        ['❌ Вернуться назад']
        ],
    resize_keyboard: true
    }
});
    
    break;

    case '💅 Педикюр':
      bot.sendMessage(chatId,'💅 Педикюр',{
        parse_mode:'Markdown',
        reply_markup:{
          keyboard:keyboards.pedikure,
          resize_keyboard: true
        }
      });
      break;
    
     case '💅 Маникюр':
      bot.sendMessage(chatId,'💅 Маникюр',{
        parse_mode:'Markdown',
        reply_markup:{
          keyboard:keyboards.manic,
          resize_keyboard: true
        }
      });
      break;

    // Как добраться
    case '🚍 Как добраться':
      const yandexMapLink = `https://yandex.by/maps/org/tanyanailsss/161368982356/?ll=27.482495%2C53.878875&z=17`;

      await bot.sendMessage(chatId, `Мы находимся по адресу: Янки Брыля 24.\n\nВот наше местоположение на Яндекс.Картах:\n[Посмотреть на карте](${yandexMapLink})`, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            ['🅿️ Где припарковаться?'],
            ['❌ Вернуться назад']
          ],
          resize_keyboard: true
        }
      });
      break;

    case '🅿️ Где припарковаться?':
      await bot.sendMessage(chatId, 'Ближайшие парковки находятся вдоль улицы Янки Брыля и возле торгового центра. Парковка бесплатная.');
      break;

    // О НАС
    case '👩‍⚕️ О НАС':
      await bot.sendMessage(chatId, `Выберите, что вам интересно узнать о нас`, {
        reply_markup: {
          keyboard: [
            ['🏚 Интерьер'],
            ['☎️ Контакты'],
            ['❌ Вернуться назад']
          ],
          resize_keyboard: true
        }
      });
      break;

    // Контакты
    case '☎️ Контакты':
      await bot.sendMessage(chatId, 'Связаться можно по телефону: +375 29 271-01-83.\nInstagram: [tanyanailsss_minsk](https://www.instagram.com/tanyanailsss_minsk)', {
        parse_mode: 'Markdown'
      });
      break;

    // Отзывы
    case '✍️ Отзывы':
      await bot.sendMessage(chatId, `Здесь вы можете прочитать или написать отзывы`, {
        reply_markup: {
          keyboard: [
            ['✍️ Написать отзыв'],
            ['👀 Почитать отзывы'],
            ['❌ Вернуться назад']
          ],
          resize_keyboard: true
        }
      });
      break;

    case '❌ Вернуться назад':
      bot.sendMessage(chatId,'Вы вернулись на главную страницу',{
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: keyboards.mainOptions,
          resize_keyboard: true
        }
      });
    break;

    // Разные виды маникюра
    case '🟥 Маникюр с однородным покрытием с гелиевым укреплением':
      
      await recoding(msg);
      
      break;

    case '🟧 Снятие без покрытия':
      await bot.sendMessage(chatId, 'Вы выбрали снятие без покрытия.');
      await recoding(msg);
      break;

    case '🟨 Маникюр однородным покрытием':
      await bot.sendMessage(chatId, 'Вы выбрали маникюр с однородным покрытием.');
      await recoding(msg);
      break;

    case '🟩 Наращивание':
      await bot.sendMessage(chatId, 'Вы выбрали наращивание.');
      await recoding(msg);
      break;

    case '🟦 Маникюр без покрытия':
      await bot.sendMessage(chatId, 'Вы выбрали маникюр без покрытия.');
      await recoding(msg);
      break;

    case '🟪 Мужской маникюр':
      await bot.sendMessage(chatId, 'Вы выбрали мужской маникюр.');
      await recoding(msg);
      break;

    // Разные виды педикюра
    case '🔴 Педикюр с покрытием':
      await bot.sendMessage(chatId, 'Вы выбрали педикюр с покрытием.');
      await recoding(msg);
      break;

    case '🟠 Педикюр без покрытия':
      await bot.sendMessage(chatId, 'Вы выбрали педикюр без покрытия.');
      await recoding(msg);
      break;

    case '🟡 Педикюр с покрытием пальцев без обработки стопы':
      await bot.sendMessage(chatId, 'Вы выбрали педикюр с покрытием пальцев без обработки стопы.');
      await recoding(msg);
      break;

    case '🟢 Снятие без покрытия':
      await bot.sendMessage(chatId, 'Вы выбрали снятие без покрытия.');
      await recoding(msg);
      break;

    default:
      await bot.sendMessage(chatId, 'Извините, какая-то ошибка!');
      break;
  }
});

// Главное меню
async function showMainMenu(chatId) {
  await bot.sendMessage(chatId, `Прекрасно👌, вы можете ознакомиться с моими услугами или записаться на процедуру 📅.
Может быть, вам нужна консультация? 👱‍♀️

Вы также можете принять участие в нашей программе кэшбэк 💰 и заработать сертификаты на наши услуги.

Выбирайте, что интересно 👇`,{
  parse_mode: 'HTML',
  reply_markup:{
    keyboard: keyboards.mainOptions,  
  },
  resize_keyboard: true
});
}

async function recoding(msg){
            const typeText = msg.text.slice(3, msg.text.length);
            const chatId = msg.chat.id;
            const dates = [];

            // Генерация дат на ближайшие 7 дней

            for (let i = 0; i < 14; i++) {
                dates.push(moment().add(i, 'days').format('YYYY-MM-DD'));
            }

            // Формирование inline-клавиатуры с датами
            const dateButtons = dates.map(date => [{ text: date, callback_data: date }]);
            const options = {
                reply_markup: {
                    inline_keyboard: dateButtons
                }
            };
            userStates['type'] = typeText;
            bot.sendMessage(chatId, 'Выберите дату для записи:', options);
}

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith("20")) {
        {

            // Поиск занятых временных слотов на выбранную дату
            const bookedTimes = await Appointment.find({ appointment_date: data }).select('appointment_time');
            const bookedTimeSet = new Set(bookedTimes.map(item => item.appointment_time));

            // Доступные временные слоты
            const allTimes = ['10:00', '12:00', '14:00', '16:00', '18:00'];
            const availableTimes = allTimes.filter(time => !bookedTimeSet.has(time));

            // Формирование inline-клавиатуры с доступным временем
            const timeButtons = availableTimes.map(time => [{ text: time, callback_data: `time_${data}_${time}` }]);
            const timeOptions = {
                reply_markup: {
                    inline_keyboard: timeButtons
                }
            };

            bot.sendMessage(chatId, `Вы выбрали ${data}. Теперь выберите время:`, timeOptions);
            return;
        }
    }
       // Проверка, является ли запрос выбором времени (формат: "time_YYYY-MM-DD_HH:MM")
    if (data.startsWith("time_")) {
        const [, selectedDate, selectedTime] = data.split("_");

        // Проверка, занято ли уже выбранное время
        const existingAppointment = await Appointment.findOne({ appointment_date: selectedDate, appointment_time: selectedTime });
        if (existingAppointment) {
            bot.sendMessage(chatId, `К сожалению, время ${selectedTime} на ${selectedDate} уже занято. Пожалуйста, выберите другое.`);
            return;
        }
        
        userStates[chatId] = { state: 'waiting_for_name' };
        userStates['selectedDate'] = selectedDate;
        userStates['selectedTime'] = selectedTime;
        
        await bot.sendMessage(chatId, `Ваша запись на ${selectedDate} в ${selectedTime} успешно сохранена!`);
        await bot.sendMessage(chatId, `Подскажи, как тебя зовут?`);
    }
});

bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const phoneNumber = msg.contact.phone_number;

    try {
        // Сохраняем или обновляем контакт пользователя в базе данных
        const newAppointment = new Appointment({
            user_id: chatId,
            username: userStates[chatId].name,
            appointment_date: userStates['selectedDate'],
            appointment_time: userStates['selectedTime'],
            phone: phoneNumber,
            type: userStates['type']
        });
        await newAppointment.save();
        await bot.sendMessage(chatId, `Супер👍 Я записала тебя на брови на 📅${userStates['selectedDate']} ⏰${userStates['selectedTime']} Я тебе заранее напомню 😉 Буду ждать тебя, хорошего дня 😃`,{
          reply_markup:{
            keyboard:keyboards.mainOptions,
          },
          resize_keyboard:true
        });
        delete userStates[chatId];
    } catch (error) {
        console.error('Ошибка при сохранении контакта:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при сохранении контакта. Попробуйте снова.');
    }
});