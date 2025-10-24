import axios from 'axios';

export const meta = {
  name: 'quote',
  version: '1.0.0',
  aliases: ['inspire', 'quotes'],
  description: 'Get a random inspirational quote from DummyJSON',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

// Function to fetch a random quote
async function fetchQuote() {
  const res = await axios.get('https://dummyjson.com/quotes/random', {
    headers: { Accept: 'application/json' }
  });
  return res.data || null;
}

export async function onStart({ bot, msg, chatId, response }) {
  const loadingMsg = await response.reply('💭 *Fetching an inspirational quote...*', { parse_mode: 'Markdown' });

  try {
    const data = await fetchQuote();
    const quote = data?.quote;
    const author = data?.author;

    if (!quote || !author) {
      await response.editText(loadingMsg, '⚠️ Could not retrieve a quote from the API.', { parse_mode: 'Markdown' });
      return;
    }

    const text = `📜 *Quote of the Moment:*\n\n_"${quote}"_\n\n— *${author}*`;

    // Inline keyboard with refresh button
    const inlineKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'quote',
            messageId: null,
            args: ['refresh']
          })
        }
      ]
    ];

    // Edit message to show quote and add refresh button
    await response.editText(loadingMsg, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineKeyboard } });

    // Update keyboard with actual message ID
    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'quote',
            messageId: loadingMsg.message_id,
            args: ['refresh']
          })
        }
      ]
    ];

    await response.editMarkup(loadingMsg, { inline_keyboard: updatedKeyboard });

  } catch (error) {
    const fallbackQuote = "Life is what happens when you're busy making other plans.";
    const fallbackAuthor = "John Lennon";

    await response.editText(
      loadingMsg,
      `⚠️ Failed to fetch quote. Here's a fallback:\n\n_"${fallbackQuote}"_\n\n— *${fallbackAuthor}*`,
      { parse_mode: 'Markdown' }
    );
  }
}

// Callback handler for refresh button
export async function onCallback({ bot, callbackQuery, payload, response }) {
  try {
    if (payload.command !== 'quote') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const data = await fetchQuote();
    const quote = data?.quote;
    const author = data?.author;

    if (!quote || !author) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error fetching quote.' });
      return;
    }

    const text = `📜 *Quote of the Moment:*\n\n_"${quote}"_\n\n— *${author}*`;

    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'quote',
            messageId: payload.messageId,
            args: ['refresh']
          })
        }
      ]
    ];

    await response.editText({ chatId: callbackQuery.message.chat.id, messageId: payload.messageId }, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: updatedKeyboard }
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in quote callback:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr.message);
    }
  }
}
