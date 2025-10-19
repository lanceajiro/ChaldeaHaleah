import axios from 'axios';

export const meta = {
  name: 'cat',
  version: '1.0.0',
  aliases: ['kitty', 'catphoto'],
  description: 'Send a random girl photo',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, response }) {
  const loadingMsg = await response.reply(`🎭 *Fetching a random ${meta.name} photo...*`, { parse_mode: 'Markdown' });

  try {
    // Get the image as a stream (binary)
    const res = await axios.get(`${global.api.nekolabs}/random/cat`, {
      responseType: 'arraybuffer'
    });

    // Edit the loading message to show success
    await bot.editMessageText(`✨ *Here’s your random ${meta.name} photo!*`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Send the cosplay photo
    await bot.sendPhoto(msg.chat.id, Buffer.from(res.data), {
      caption: `📸 *Random ${meta.name} Photo*`,
      parse_mode: 'Markdown'
    });

  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to fetch ${meta.name} photo: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}
