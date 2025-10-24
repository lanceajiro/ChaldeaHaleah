import axios from 'axios';

export const meta = {
  name: "funfact",
  version: "1.0.0",
  aliases: ["fact", "randomfact"],
  description: "Get a random fun fact to brighten your day!",
  author: "FunFactBotDev",
  prefix: "both",
  category: "random",
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
      await response.editText(loadingMsg, '⚠️ Could not retrieve a fun fact from the API.', { parse_mode: 'Markdown' });
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
    await response.editText(loadingMsg, `💡 *Did you know?*\n\n_${fact}_`, {
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

    await response.editMarkup(loadingMsg, { inline_keyboard: updatedKeyboard });
  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch fun fact: ${error.message}`, { parse_mode: 'Markdown' });
  }
}

// Callback handler for refresh button
export async function onCallback({ bot, callbackQuery, payload, response }) {
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

    await response.editText({ chatId: callbackQuery.message.chat.id, messageId: payload.messageId }, `💡 *Did you know?*\n\n_${fact}_`, {
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
