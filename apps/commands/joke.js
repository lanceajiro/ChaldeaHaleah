import axios from 'axios';

export const meta = {
  name: "joke",
  version: "1.0.0",
  aliases: ["telljoke", "randomjoke"],
  description: "Get a random joke to make you laugh!",
  author: "JokeBotDev",
  prefix: "both",
  category: "random",
  type: "anyone",
  cooldown: 5,
  guide: ""
};

// Function to fetch a random joke
async function fetchJoke() {
  const res = await axios.get('https://official-joke-api.appspot.com/random_joke');
  const { setup, punchline } = res.data || {};
  if (!setup || !punchline) return null;
  return `${setup}\n\n${punchline}`;
}

export async function onStart({ bot, msg, chatId, response }) {
  const loadingMsg = await response.reply('😂 *Fetching a random joke...*', { parse_mode: 'Markdown' });

  try {
    const joke = await fetchJoke();
    if (!joke) {
      await response.editText(loadingMsg, '⚠️ Could not retrieve a joke from the API.', { parse_mode: 'Markdown' });
      return;
    }

    // Inline keyboard with refresh button
    const inlineKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'joke',
            messageId: null,
            args: ['refresh']
          })
        }
      ]
    ];

    // Edit loading message to show the joke
    await response.editText(loadingMsg, `🤣 *Here's a joke:*\n\n_${joke}_`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

    // Update inline keyboard with the actual message ID
    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'joke',
            messageId: loadingMsg.message_id,
            args: ['refresh']
          })
        }
      ]
    ];

    await response.editMarkup(loadingMsg, { inline_keyboard: updatedKeyboard });
  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch joke: ${error.message}`, { parse_mode: 'Markdown' });
  }
}

// Callback handler for refresh button
export async function onCallback({ bot, callbackQuery, payload }) {
  try {
    if (payload.command !== 'joke') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const joke = await fetchJoke();
    if (!joke) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching joke.' });
      return;
    }

    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'joke',
            messageId: payload.messageId,
            args: ['refresh']
          })
        }
      ]
    ];

    await bot.editMessageText(`🤣 *Here's a joke:*\n\n_${joke}_`, {
      chat_id: callbackQuery.message.chat.id,
      message_id: payload.messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: updatedKeyboard }
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in joke callback:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr.message);
    }
  }
}
