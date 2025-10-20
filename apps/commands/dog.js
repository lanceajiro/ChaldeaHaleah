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

export async function onStart({ bot, msg, args, response, usages }) {
  const loadingMsg = await response.reply('🐶 *Fetching a random dog image...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get('https://dog.ceo/api/breeds/image/random', {
      headers: { Accept: 'application/json' }
    });

    const imageUrl = res.data?.message;
    if (!imageUrl) {
      await bot.editMessageText('⚠️ Could not retrieve a dog image from the API.', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    // Edit loading message to success
    await bot.editMessageText('✨ *Here’s your random dog image!*', {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Send the dog photo (Telegram accepts a direct URL)
    await bot.sendPhoto(msg.chat.id, imageUrl, {
      caption: '🐕 *Random Dog Image*',
      parse_mode: 'Markdown'
    });

  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to fetch dog image: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}
