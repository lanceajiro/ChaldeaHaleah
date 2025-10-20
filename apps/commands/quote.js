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

export async function onStart({ bot, msg, args, response, usages }) {
  const loadingMsg = await response.reply('💭 *Fetching an inspirational quote...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get('https://dummyjson.com/quotes/random', {
      headers: { Accept: 'application/json' }
    });

    const quote = res.data?.quote;
    const author = res.data?.author;

    if (!quote || !author) {
      await bot.editMessageText('⚠️ Could not retrieve a quote from the API.', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    const text = `📜 *Quote of the Moment:*\n\n_"${quote}"_\n\n— *${author}*`;

    // Edit loading message to display the quote
    await bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Also send as a new message for consistency
    await bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });

  } catch (error) {
    const fallbackQuote = "Life is what happens when you're busy making other plans.";
    const fallbackAuthor = "John Lennon";

    await bot.editMessageText(
      `⚠️ Failed to fetch quote. Here's a fallback:\n\n_"${fallbackQuote}"_\n\n— *${fallbackAuthor}*`,
      {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
  }
}
