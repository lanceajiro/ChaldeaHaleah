import axios from 'axios';

export const meta = {
  name: 'dog',
  version: '1.0.0',
  aliases: ['dogpic', 'dogimage'],
  description: 'Send a random dog image from dog.ceo',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

// Function to fetch a dog image
async function fetchDog() {
  const res = await axios.get('https://dog.ceo/api/breeds/image/random', {
    headers: { Accept: 'application/json' }
  });
  return res.data?.message || null;
}

export async function onStart({ bot, msg, chatId, response }) {
  const loadingMsg = await response.reply('🐶 *Fetching a random dog image...*', { parse_mode: 'Markdown' });

  try {
    const imageUrl = await fetchDog();
    if (!imageUrl) {
      await response.editText(loadingMsg, '⚠️ Could not retrieve a dog image from the API.', { parse_mode: 'Markdown' });
      return;
    }

    // Inline keyboard with refresh button
    const inlineKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'dog',
            messageId: null,
            args: ['refresh']
          })
        }
      ]
    ];

    // Send the dog photo
    const sentMessage = await response.photo(imageUrl, {
      caption: '🐕 *Random Dog Image*',
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

    // Update inline keyboard with the actual message id
    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'dog',
            messageId: sentMessage.message_id,
            args: ['refresh']
          })
        }
      ]
    ];

    await response.editMarkup(sentMessage, { inline_keyboard: updatedKeyboard });

    // Delete the loading message
    await response.delete(loadingMsg);
  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch dog image: ${error.message}`, { parse_mode: 'Markdown' });
  }
}

// Callback handler for refresh button
export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload.command !== 'dog') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const imageUrl = await fetchDog();
    if (!imageUrl) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching dog image.' });
      return;
    }

    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'dog',
            messageId: payload.messageId,
            args: ['refresh']
          })
        }
      ]
    ];

    await response.editMedia({ chatId: callbackQuery.message.chat.id, messageId: payload.messageId }, {
      type: 'photo',
      media: imageUrl,
      caption: '🐕 *Random Dog Image*',
      parse_mode: 'Markdown'
    }, { reply_markup: { inline_keyboard: updatedKeyboard } });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in dog callback:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr.message);
    }
  }
}
