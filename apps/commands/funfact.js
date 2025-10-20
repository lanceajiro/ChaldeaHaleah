import axios from 'axios';

export const meta = {
  name: "funfact",
  version: "1.0.0",
  aliases: ["fact", "randomfact"],
  description: "Get a random fun fact to brighten your day!",
  author: "FunFactBotDev",
  prefix: "both",
  category: "utility",
  type: "anyone",
  cooldown: 5,
  guide: ""
};

// Function to fetch a random fun fact
async function fetchFunFact() {
  const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
  return res.data?.text || null;
}

export async function onStart({ bot, msg, chatId, response }) {
  const loadingMsg = await response.reply('🧠 *Fetching a fun fact...*', { parse_mode: 'Markdown' });

  try {
    const fact = await fetchFunFact();
    if (!fact) {
      await bot.editMessageText('⚠️ Could not retrieve a fun fact from the API.', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    // Inline keyboard with refresh button
    const inlineKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'funfact',
            messageId: null,
            args: ['refresh']
          })
        }
      ]
    ];

    // Edit the loading message to display the fact with refresh button
    await bot.editMessageText(`💡 *Did you know?*\n\n_${fact}_`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

    // Update keyboard with real message ID
    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'funfact',
            messageId: loadingMsg.message_id,
            args: ['refresh']
          })
        }
      ]
    ];

    await bot.editMessageReplyMarkup(
      { inline_keyboard: updatedKeyboard },
      { chat_id: msg.chat.id, message_id: loadingMsg.message_id }
    );
  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to fetch fun fact: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}

// Callback handler for refresh button
export async function onCallback({ bot, callbackQuery, payload }) {
  try {
    if (payload.command !== 'funfact') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const fact = await fetchFunFact();
    if (!fact) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching fun fact.' });
      return;
    }

    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'funfact',
            messageId: payload.messageId,
            args: ['refresh']
          })
        }
      ]
    ];

    await bot.editMessageText(`💡 *Did you know?*\n\n_${fact}_`, {
      chat_id: callbackQuery.message.chat.id,
      message_id: payload.messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: updatedKeyboard }
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in funfact callback:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr.message);
    }
  }
}
