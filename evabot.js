const tgBot = require('node-telegram-bot-api');
// const path = require('path');
const token = '7529465114:AAGbzCPm-RwaRpqMUOT02w6PriH9xsIM2Z0';
const bot = new tgBot(token, { polling: true });
// const fs = require('fs');
const mongoose = require('mongoose');
const moment = require('moment');
const userStates = {};
const reviewStates = {};
const schedule = require('node-schedule');

// админ
const adminChatIds = ['1199006052', '1373154481'];

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

const reviewSchema = new mongoose.Schema({
  user_id: Number,
  text: String,
  stars: Number,
});
const Review = mongoose.model('Review', reviewSchema);

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
    ['🟥 Маникюр с однородным покрытием с гелиевым укреплением'],
    ['🟧 Снятие без покрытия(Маникюр)'],
    ['🟨 Маникюр однородным покрытием '],
    ['🟩 Наращивание'],
    ['🟦 Маникюр без покрытия'],
    ['🟪 Мужской маникюр'],
    ['❌ Вернуться назад']
  ],

  pedikure:[
    ['🔴 Педикюр с покрытием'],
    ['🟠 Педикюр без покрытия'],
    ['🟡 Педикюр с покрытием пальцев без обработки стопы'],
    ['🟢 Снятие без покрытия(Педикюр)'],
    ['❌ Вернуться назад']
  ],

}


  

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (msg.contact || reviewStates[chatId]?.state == 'waiting_for_text') return 0;

  // Проверка текущего состояния пользователя
    if (userStates[chatId]?.state == 'waiting_for_name') {
        // Обработка имени пользователя
        userStates[chatId] = {...userStates[chatId],username: text}; // Сохраняем имя
        userStates[chatId] = {...userStates[chatId],state :'non'};
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
      await showMainMenu(chatId);
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

    case '⏮️ Изменить запись':
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
      await bot.sendMessage(chatId,'💅 Педикюр',{
        parse_mode:'Markdown',
        reply_markup:{
          keyboard:keyboards.pedikure,
          resize_keyboard: true
        }
      });
      break;
    
     case '💅 Маникюр':
      await bot.sendMessage(chatId,'💅 Маникюр',{
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

    case '✍️ Написать отзыв':
      await setReview(msg);
    break;

    case '❌ На главную':
    case '❌ Вернуться назад':
      await bot.sendMessage(chatId,'Вы вернулись на главную страницу',{
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: keyboards.mainOptions,
          resize_keyboard: true
        }
      });
    break;

    case '👀 Почитать отзывы':
      const reviews = await Review.find();
      if(reviews.length > 5){
        for (let i = reviews.length-1; i > reviews.length - 6; i--){
          await bot.sendMessage(chatId,`'${reviews[i].text}' \n\nКоличество звезд:${setStars(reviews[i].stars)} `);
        }
      }else if (reviews.length <= 5 && reviews.length > 0)
      {
        for (const i of reviews){
          await bot.sendMessage(chatId,`'${i.text}' \n\nКоличество звезд:${setStars(i.stars)} `);
        };
      }else{
        await bot.sendMessage(chatId,'На данный момент отзывов нету. Будьте первым, кто оставит отзыв!😘');
      }

    break;

    // Разные виды маникюра
    case '🟥 Маникюр с однородным покрытием с гелиевым укреплением':
      
      await recoding(msg);
      
      break;

    case '🟧 Снятие без покрытия(Маникюр)':
      
      await recoding(msg);
      break;

    case '🟨 Маникюр однородным покрытием':
      await recoding(msg);
      break;

    case '🟩 Наращивание':
      await recoding(msg);
      break;

    case '🟦 Маникюр без покрытия':
      await recoding(msg);
      break;

    case '🟪 Мужской маникюр':
      await recoding(msg);
      break;

    // Разные виды педикюра
    case '🔴 Педикюр с покрытием':
      await recoding(msg);
      break;

    case '🟠 Педикюр без покрытия':
      await recoding(msg);
      break;

    case '🟡 Педикюр с покрытием пальцев без обработки стопы':
      await recoding(msg);
      break;

    case '🟢 Снятие без покрытия(Педикюр)':
      await recoding(msg);
      break;

    case '✅ Подтвердить запись':
      
      const newAppointment = new Appointment({
        user_id: userStates[chatId].id,
        username: userStates[chatId].username,
        appointment_date: userStates[chatId].selectedDate,
        appointment_time: userStates[chatId].selectedTime,
        phone: userStates[chatId].phoneNumber,
        type: userStates[chatId].type
    });
    await newAppointment.save();

      await bot.sendMessage(chatId,`Супер👍 Я записала тебя на ${newAppointment.type} на 📅${newAppointment.appointment_date} ⏰${newAppointment.appointment_time} Я тебе заранее напомню 😉 Буду ждать тебя, хорошего дня 😃`,{
        reply_markup:{
          keyboard:keyboards.mainOptions
        },
        resize_keyboard:true
      })
      delete userStates[chatId];
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

            // Генерация дат на ближайшие 14 дней

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
            userStates[chatId] = {...userStates[chatId], type: typeText};
            await bot.sendMessage(chatId, 'Выберите дату для записи:', options);
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

            await bot.sendMessage(chatId, `Вы выбрали ${data}. Теперь выберите время:`, timeOptions);
            return;
        }
    }
       // Проверка, является ли запрос выбором времени (формат: "time_YYYY-MM-DD_HH:MM")
    if (data.startsWith("time_")) {
        const [, selectedDate, selectedTime] = data.split("_");

        // Проверка, занято ли уже выбранное время
        const existingAppointment = await Appointment.findOne({ appointment_date: selectedDate, appointment_time: selectedTime });
        if (existingAppointment) {
            await bot.sendMessage(chatId, `К сожалению, время ${selectedTime} на ${selectedDate} уже занято. Пожалуйста, выберите другое.`);
            return;
        }
        
        userStates[chatId] = {...userStates[chatId],state: 'waiting_for_name'}; 
        userStates[chatId] = {...userStates[chatId], id: chatId};
        userStates[chatId] = {...userStates[chatId], selectedDate: selectedDate};
        userStates[chatId] = {...userStates[chatId], selectedTime: selectedTime};
        // console.log(userStates);
        await bot.sendMessage(chatId, `Ваша запись на ${selectedDate} в ${selectedTime} успешно сохранена!`);
        await bot.sendMessage(chatId, `Подскажи, как тебя зовут?`);
    }
});

bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = {...userStates[chatId],phoneNumber: msg.contact.phone_number};

    try {
        // Сохраняем или обновляем контакт пользователя в базе данных
        
      await bot.sendMessage(chatId, `Запись на ${userStates[chatId].type} на 📅${userStates[chatId].selectedDate} ⏰${userStates[chatId].selectedTime}. Все верно?`,{
        reply_markup:{
          keyboard:[['✅ Подтвердить запись'],
          ['⏮️ Изменить запись'],
          ['❌ На главную']
        ]},
        resize_keyboard:true
      });
      
      
    } catch (error) {
        console.error('Ошибка при сохранении контакта:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при сохранении контакта. Попробуйте снова.');
    }
});

async function setReview(msg){
  const chatId = msg.chat.id;
  reviewStates[chatId] = {...userStates[chatId], state: 'waiting_for_text' };

  await bot.sendMessage(chatId, 'Пожалуйста, введите текст вашего отзыва:');
  bot.once('message', async (msg) =>{
  reviewStates[chatId] = {...userStates[chatId], text: msg.text};
  await bot.sendMessage(chatId,'Теперь выберите количество звезд',{
    reply_markup:{
      inline_keyboard:[              
      [{ text: '⭐⭐⭐⭐⭐', callback_data: 'star_5' }],
      [{ text: '⭐⭐⭐⭐', callback_data: 'star_4' }],
      [{ text: '⭐⭐⭐', callback_data: 'star_3' }],
      [{ text: '⭐⭐', callback_data: 'star_2' }],
      [{ text: '⭐', callback_data: 'star_1' }]
      
      ]
    }
  })
});

  bot.once('callback_query',async (starQuery) => {
  try {
    const starsCount = parseInt(starQuery.data.split('_')[1], 10);
    await bot.sendMessage(chatId, `Спасибо за ваш отзыв! Вы поставили ${starsCount} звезд и написали:\n"${reviewStates[chatId].text}"`);
    const review = new Review({
      user_id: chatId,
      text: reviewStates[chatId].text,
      stars: starsCount
    })
    await review.save();

            
    if (starsCount >= 4) {
        await bot.sendMessage(chatId, `✨ Нам очень приятно, что вам понравилось! 🥰 Если у вас будет минутка, мы будем благодарны за отзыв на Яндекс.Картах. Это очень важно для нас! 😊\n\n[Оставить отзыв на Яндекс.Картах](https://yandex.by/maps/org/tanyanailsss/161368982356/?ll=27.482495%2C53.878875&z=17)`, {
            parse_mode: 'Markdown'
        });
    } else {
        
        for (const adminId of adminChatIds) {
            await bot.sendMessage(adminId, `👎 Пользователь ${chatId} оставил отзыв с ${starsCount} звездами:\n"${reviewText}"`);
        }
        await bot.sendMessage(chatId, `Спасибо за ваш отзыв! Мы очень ценим обратную связь и постараемся улучшить наш сервис. Если вы хотите, можете написать свои замечания или предложения. 😊`);
    }    
    delete reviewStates[chatId];

} catch (error) {
    console.error('Ошибка при обработке отзыва:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка при обработке вашего отзыва. Попробуйте еще раз позже.');
}
});
}


function setStars(msg){
  switch(msg){
    case 1:
      return '⭐';
      
    case 2:    
      return '⭐⭐';
      
    case 3:
      return '⭐⭐⭐';
      
    case 4:
      return '⭐⭐⭐⭐';
    
    case 5:
      return '⭐⭐⭐⭐⭐';
    
  }
}

async function checkCompletedAppointments() {
  try {

      const now = moment();

      // Найти записи, у которых время процедуры прошло, но отзыв не запрашивался
      const appointments = await Appointment.find({
          appointment_date: { $lte: now.format('YYYY-MM-DD') },
          appointment_time: { $lte: now.format('HH:mm') },
          procedure_completed: false // Процедура ещё не помечена как завершённая
      });

      for (const appointment of appointments) {

          appointment.procedure_completed = true;
          await appointment.save();


          await bot.sendMessage(appointment.user_id, `Спасибо, что посетили нашу студию! 🥰 Нам будет очень приятно, если вы оставите отзыв о своей процедуре. Это займёт всего пару минут!`, {
              reply_markup: {
                  keyboard: [
                      ['✍️ Написать отзыв', '❌ На главную']
                  ],
                  resize_keyboard: true
              }

          });


          console.log(`Отправлено сообщение с запросом отзыва пользователю ${appointment.user_id}`);
      }
  } catch (error) {
      console.error('Ошибка при проверке завершённых процедур:', error);
  }
}

// проверка записей которые уже завершились каждые 2 минуты
schedule.scheduleJob('*/2 * * * *', async () => {
  console.log('Проверка завершённых процедур...');
  await checkCompletedAppointments();
});