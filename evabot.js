require('dotenv').config();

const tgBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const moment = require('moment');
const userStates = {};
const reviewStates = {};
const schedule = require('node-schedule');
const token = process.env.BOT_TOKEN;
const adminChatIds = process.env.ADMIN_CHAT_IDS.split(',');
const mongoUri = process.env.MONGO_URI;
const bot = new tgBot(token, { polling: true });

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })

// const { Recoverable } = require('repl');
// Подключение к MongoDB

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
    mainOptions: [
        ['🆘 Как пользоваться ботом'],
        ['❇️ Записаться на услугу'],
        ['📋 УСЛУГИ'],
        ['🔥 АКЦИИ и СПЕЦПРЕДЛОЖЕНИЯ'],
        ['👩‍⚕️ О НАС'],
        ['✍️ Отзывы'],
        ['🚍 Как добраться'],
        ['📅 Мои записи']
    ],

    manic: [
        ['🟥 Маникюр с однородным покрытием с гелиевым укреплением'],
        ['🟧 Снятие без покрытия(Маникюр)'],
        ['🟨 Маникюр однородным покрытием '],
        ['🟩 Наращивание'],
        ['🟦 Маникюр без покрытия'],
        ['🟪 Мужской маникюр'],
        ['❌ Вернуться назад']
    ],

    pedikure: [
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
        userStates[chatId] = { ...userStates[chatId], username: text }; // Сохраняем имя
        userStates[chatId] = { ...userStates[chatId], state: 'non' };
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

        case '/isAdmin':
            let isAdmin = false;
            for (const admin of adminChatIds){
                if (chatId == admin) {
                    await bot.sendMessage(chatId, `Вы успешло подключились как администратор`,{
                        reply_markup:{
                            keyboard:[
                                ['📅 Записи'],
                                ['❌ Вернуться назад']
                            ],
                            resize_keyboard:true
                        }
                    })
                }
                isAdmin = true;
            }
            if (!isAdmin)  await bot.sendMessage(chatId, `У вас нет прав!`);
            break;
            // записи у админа
            case'📅 Записи':
            const now1 = moment();
            const today1 = now1.format('YYYY-MM-DD');

            // Найти все записи клиента на сегодня и будущее
            const userAppointments1 = await Appointment.find({
                appointment_date: { $gte: today1 },
            }).sort({ appointment_date: 1, appointment_time: 1 });

            if (userAppointments1.length === 0) {
                await bot.sendMessage(chatId, `На данный момент никто не записан!`);
            }

            // Выводим записи с кнопками для отмены
            for (const appointment of userAppointments1) {
                await bot.sendMessage(chatId,
                    `Запись:
                    📅 Дата: ${appointment.appointment_date}
                    ⏰ Время: ${appointment.appointment_time}
                    💅 Услуга: ${appointment.type}
                    📞 Телефон: ${appointment.phone}
                    🗣️ Имя клиента: ${appointment.username}
                    👤 id: ${appointment.user_id}
                    `);
            }
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

            await bot.sendMessage(chatId, `Супер
Выбери услугу, которая тебя интересует
Из предложенных: `, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['💅 Маникюр', '💅 Педикюр'],
                        ['❌ Вернуться назад']
                    ],
                    resize_keyboard: true
                }
            });

            break;

        case '💅 Педикюр':
            await bot.sendMessage(chatId, '💅 Педикюр', {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: keyboards.pedikure,
                    resize_keyboard: true
                }
            });
            break;

        case '💅 Маникюр':
            await bot.sendMessage(chatId, '💅 Маникюр', {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: keyboards.manic,
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
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/parking.jpg'), {
                caption: '<b>Ближайшие парковки находятся вдоль улицы Янки Брыля и возле торгового центра. Парковка бесплатная. </b>',
                parse_mode: "HTML",
            });
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

        // Как пользоваться ботом
        case '🆘 Как пользоваться ботом':
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/manual.jpg'), {
                caption: '<b>Это мануал как пользоваться ботом, здесь вы можете прочитать о функция каждой кнопки</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/zapis`.jpg'), {
                caption: '<b>Кнопка записи онлайн поможет вам записаться на услугу</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/vibor.jpg'), {
                caption: '<b>Выбираете услугу на которую хотите записаться</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/manik.jpg'), {
                caption: '<b>Если выбрали маникюр,то выберите какой маникюр</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/pedik.jpg'), {
                caption: '<b>Если выбрали педикюр, то выберите какой педикюр</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/data.jpg'), {
                caption: '<b>Выберите дату на которую желаете записаться</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/time.jpg'), {
                caption: '<b>Выберите время</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/name.jpg'), {
                caption: '<b>После выбора времени, введите свое имя</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/contact.jpg'), {
                caption: '<b>Оставте свой номер для обратной связи , нажав отправить контакт</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/share.jpg'), {
                caption: '<b>Подтвердите отправку контакта</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/podtverdit.jpg'), {
                caption: '<b>Убедитесь в правильности выбора времени даты услуги, если все верно нажмите подтвердить запись, если что-то указали не то, то выберите изменить запись и выполните всё заново</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/ready.jpg'), {
                caption: '<b>Если вы подтвердили запись у вас появится вся информация о ней</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/uslugi.jpg'), {
                caption: '<b>Нажав на услуги</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/uslugi1.jpg'), {
                caption: '<b>Вы увидите все услуги которые имеются</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/akcii.jpg'), {
                caption: '<b>Нажав на акции и спец предложения, вы увидите все акции которые имеются</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/o nas.jpg'), {
                caption: '<b>Нажав О нас</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/o nas 1.jpg'), {
                caption: '<b>Вы можете увидеть контакты, а также посмотреть интерьер</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/otzivi.jpg'), {
                caption: '<b>Нажав отзывы</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/otzivi 1.jpg'), {
                caption: '<b>Вы можете как написать выш отзыв, так и почитать отзывы , которые оставили другие клиенты</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/doroga.jpg'), {
                caption: '<b>Нажав как добраться</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/doroga 2.jpg'), {
                caption: '<b>Вы увидите адрес, местоположение на Яндекс Картах, а также где можно припарковаться</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/zapisi.jpg'), {
                caption: '<b>Нажав записи</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/zapisi1.jpg'), {
                caption: '<b>Вы можете посмотреть свои записи если они имеются, а если их нету то записаться на них</b>',
                parse_mode: "HTML",
            });
            await bot.sendPhoto(msg.chat.id, fs.createReadStream('./aUs/end.jpg'), {
                caption: '<b>Надеюсь вам стало понятно как им пользоваться, желаю вам удачи!</b>',
                parse_mode: "HTML",
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
            await bot.sendMessage(chatId, 'Вы вернулись на главную страницу', {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: keyboards.mainOptions,
                    resize_keyboard: true
                }
            });
            break;

        case '👀 Почитать отзывы':
            const reviews = await Review.find();
            if (reviews.length > 5) {
                for (let i = reviews.length - 1; i > reviews.length - 6; i--) {
                    await bot.sendMessage(chatId, `'${reviews[i].text}' \n\nКоличество звезд:${setStars(reviews[i].stars)} `);
                }
            } else if (reviews.length <= 5 && reviews.length > 0) {
                for (const i of reviews) {
                    await bot.sendMessage(chatId, `'${i.text}' \n\nКоличество звезд:${setStars(i.stars)} `);
                };
            } else {
                await bot.sendMessage(chatId, 'На данный момент отзывов нету. Будьте первым, кто оставит отзыв!😘');
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
            // console.log(userStates[chatId]);
            if (!userStates[chatId] || !userStates[chatId].id) {
                await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте заново.');
                return;
            }
            const newAppointment = new Appointment({
                user_id: userStates[chatId].id,
                username: userStates[chatId].username,
                appointment_date: userStates[chatId].selectedDate,
                appointment_time: userStates[chatId].selectedTime,
                phone: userStates[chatId].phoneNumber,
                type: userStates[chatId].type
            });
            await newAppointment.save();
             for (const adminId of adminChatIds) {
                await bot.sendMessage(adminId, `✅ Пользователь записался:
📅 Дата: ${newAppointment.appointment_date}
⏰ Время: ${newAppointment.appointment_time}
💅 Услуга: ${newAppointment.type}
📞 Телефон: ${newAppointment.phone}
🗣️ Имя клиента: ${newAppointment.username}
`)};

            await bot.sendMessage(chatId, `Супер👍 Я записала тебя 
📅 Дата: ${newAppointment.appointment_date}
⏰ Время: ${newAppointment.appointment_time}
💅 Услуга: ${newAppointment.type}
📞 Телефон: ${newAppointment.phone}
Я тебе заранее напомню 😉 Буду ждать тебя, хорошего дня 😃`, {
                reply_markup: {
                    keyboard: keyboards.mainOptions,
                    resize_keyboard: true
                }
            });
            delete userStates[chatId];
            break;

        //мои записи
        case '📅 Мои записи':
            const now = moment();
            const today = now.format('YYYY-MM-DD');

            // Найти все записи клиента на сегодня и будущее
            const userAppointments = await Appointment.find({
                user_id: chatId,
                appointment_date: { $gte: today },
            }).sort({ appointment_date: 1, appointment_time: 1 });

            if (userAppointments.length === 0) {
                await bot.sendMessage(chatId, `На данный момент у вас нет записей. Хотите записаться?`, {
                    reply_markup: {
                        keyboard: [['❇️ Записаться на услугу'], ['❌ На главную']],
                        resize_keyboard: true
                    }
                });
                return;
            }

            // Выводим записи с кнопками для отмены
            for (const appointment of userAppointments) {
                await bot.sendMessage(chatId,
                    `Ваши записи:
                    📅 Дата: ${appointment.appointment_date}
                    ⏰ Время: ${appointment.appointment_time}
                    💅 Услуга: ${appointment.type}
                    📞 Телефон: ${appointment.phone}
                    `,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: '❌ Отменить запись',
                                    callback_data: `cancel_${appointment._id}`
                                }]
                            ]
                        }
                    }
                );
            }
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

Выбирайте, что интересно 👇`, {
        parse_mode: 'HTML',
        reply_markup: {
            keyboard: keyboards.mainOptions,
        },
        resize_keyboard: true
    });
}

async function recoding(msg) {
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
    userStates[chatId] = { ...userStates[chatId], type: typeText };
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

        userStates[chatId] = { ...userStates[chatId], state: 'waiting_for_name' };
        userStates[chatId] = { ...userStates[chatId], id: chatId };
        userStates[chatId] = { ...userStates[chatId], selectedDate: selectedDate };
        userStates[chatId] = { ...userStates[chatId], selectedTime: selectedTime };
        // console.log(userStates);
        await bot.sendMessage(chatId, `Ваша запись на ${selectedDate} в ${selectedTime} успешно сохранена!`);
        await bot.sendMessage(chatId, `Подскажи, как тебя зовут?`);
    }
    if (data.startsWith('cancel_')) {
        const appointmentId = data.split('_')[1];
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            await bot.sendMessage(chatId, 'Запись не найдена или уже была отменена.');
            return;
        }

        await Appointment.findByIdAndDelete(appointmentId);
        await bot.sendMessage(chatId, `Ваша запись на ${appointment.type} 📅${appointment.appointment_date} ⏰${appointment.appointment_time} была успешно отменена.`);

        for (const adminId of adminChatIds) {
            await bot.sendMessage(adminId, `❌ Пользователь отменил запись:
          📅 Дата: ${appointment.appointment_date}
          ⏰ Время: ${appointment.appointment_time}
          💅 Услуга: ${appointment.type}
          📞 Телефон: ${appointment.phone}`);
        }
    }
});

bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { ...userStates[chatId], phoneNumber: msg.contact.phone_number };

    try {


        await bot.sendMessage(chatId, ` Ваша запись:
📅 Дата: ${userStates[chatId].selectedDate}
⏰ Время: ${userStates[chatId].selectedTime}
💅 Услуга: ${userStates[chatId].type}
📞 Телефон: ${userStates[chatId].phoneNumber}. Все верно?`, {
            reply_markup: {
                keyboard: [['✅ Подтвердить запись'],
                ['⏮️ Изменить запись'],
                ['❌ На главную']
                ]
            },
            resize_keyboard: true
        });


    } catch (error) {
        console.error('Ошибка при сохранении контакта:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при сохранении контакта. Попробуйте снова.');
    }
});

async function setReview(msg) {
    const chatId = msg.chat.id;
    reviewStates[chatId] = { state: 'waiting_for_text' };

    await bot.sendMessage(chatId, 'Пожалуйста, введите текст вашего отзыва:');

    const textListener = async (msg) => {
        if (msg.chat.id !== chatId || !reviewStates[chatId]?.state) return;
        reviewStates[chatId].text = msg.text;

        await bot.sendMessage(chatId, 'Теперь выберите количество звезд', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⭐⭐⭐⭐⭐', callback_data: 'star_5' }],
                    [{ text: '⭐⭐⭐⭐', callback_data: 'star_4' }],
                    [{ text: '⭐⭐⭐', callback_data: 'star_3' }],
                    [{ text: '⭐⭐', callback_data: 'star_2' }],
                    [{ text: '⭐', callback_data: 'star_1' }]
                ]
            }
        });
        bot.removeListener('message', textListener);
    };

    bot.on('message', textListener);

    bot.once('callback_query', async (starQuery) => {
        try {
            const starsCount = parseInt(starQuery.data.split('_')[1], 10);
            if (!reviewStates[chatId]?.text) {
                await bot.sendMessage(chatId, 'Ошибка: текст отзыва не найден.');
                return;
            }

            const reviewText = reviewStates[chatId].text;


            await bot.sendMessage(chatId, `Спасибо за ваш отзыв! Вы поставили ${starsCount} звезд и написали:\n"${reviewText}"`);


            const review = new Review({
                user_id: chatId,
                text: reviewText,
                stars: starsCount
            });
            await review.save();


            if (starsCount >= 4) {
                await bot.sendMessage(chatId, `✨ Нам очень приятно, что вам понравилось! 🥰 Если у вас будет минутка, мы будем благодарны за отзыв на Яндекс.Картах. Это очень важно для нас! 😊\n\n[Оставить отзыв на Яндекс.Картах](https://yandex.by/maps/org/tanyanailsss/161368982356/?ll=27.482495%2C53.878875&z=17)`, {
                    parse_mode: 'Markdown'
                });
            } else {
                // админ
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



function setStars(msg) {
    switch (msg) {
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

// проверка записей которые уже заверишились каждые 2 минуты
schedule.scheduleJob('*/2 * * * *', async () => {
    console.log('Проверка завершённых процедур...');
    await checkCompletedAppointments();
});

