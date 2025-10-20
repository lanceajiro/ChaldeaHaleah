import axios from 'axios';

export const meta = {
  name: 'advice',
  version: '1.0.0',
  aliases: ['tips'],
  description: 'Get a random piece of advice from adviceslip.com',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

// Function to fetch advice
async function fetchAdvice() {
  const res = await axios.get('https://api.adviceslip.com/advice', {
    headers: { Accept: 'application/json' }
  });
  return res.data?.slip?.advice || null;
}

export async function onStart({ bot, msg, chatId, response }) {
  const loadingMsg = await response.reply('💬 *Fetching a piece of advice...*', { parse_mode: 'Markdown' });

  try {
    const advice = await fetchAdvice();
    if (!advice) {
      await bot.editMessageText('⚠️ Could not retrieve advice from the API.', {
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
            command: 'advice',
            messageId: null,
            args: ['refresh']
          })
        }
      ]
    ];

    // Edit message to show advice and attach button
    await bot.editMessageText(`💡 *Random Advice:*\n\n_${advice}_`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

    // Update callback data with the actual message id
    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'advice',
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
    await bot.editMessageText(`⚠️ Failed to fetch advice: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}

// Callback handler for refresh button
export async function onCallback({ bot, callbackQuery, payload }) {
  try {
    if (payload.command !== 'advice') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const advice = await fetchAdvice();
    if (!advice) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching advice.' });
      return;
    }

    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'advice',
            messageId: payload.messageId,
            args: ['refresh']
          })
        }
      ]
    ];

    await bot.editMessageText(`💡 *Random Advice:*\n\n_${advice}_`, {
      chat_id: callbackQuery.message.chat.id,
      message_id: payload.messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: updatedKeyboard }
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in advice callback:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr.message);
    }
  }
}
