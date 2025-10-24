import axios from 'axios';

export const meta = {
  name: 'girl',
  version: '1.0.0',
  aliases: ['woman', 'girlphoto'],
  description: 'Send a random girl photo',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, response }) {
  const loadingMsg = await response.reply('🎭 *Fetching a random girl photo...*', { parse_mode: 'Markdown' });

  try {
    // Get the image as a stream (binary)
    const res = await axios.get(`${global.api.nekolabs}/random/girl/japan`, {
      responseType: 'arraybuffer'
    });

    // Edit the loading message to show success
    await response.editText(loadingMsg, '✨ *Here’s your random girl photo!*', { parse_mode: 'Markdown' });

    // Send the cosplay photo
    await response.photo(Buffer.from(res.data), { caption: '📸 *Random Girl Photo*', parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch girl photo: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
