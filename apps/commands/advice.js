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

export async function onStart({ bot, msg, args, response, usages }) {
  // show loading message
  const loadingMsg = await response.reply('💬 *Fetching a piece of advice...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get('https://api.adviceslip.com/advice', {
      headers: { Accept: 'application/json' }
    });

    const slip = res.data?.slip;
    if (!slip || !slip.advice) {
      await bot.editMessageText('⚠️ Could not retrieve advice from the API.', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    const advice = slip.advice;

    // edit the loading message to show the advice
    await bot.editMessageText(`💡 *Random Advice:*\n\n_${advice}_`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // also send as a new message (follows the pattern of cat.js which edits then sends content)
    await bot.sendMessage(msg.chat.id, `💬 _${advice}_`, { parse_mode: 'Markdown' });

  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to fetch advice: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}
