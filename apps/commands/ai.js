import axios from 'axios';

export const meta = {
  name: 'ai',
  version: '1.0.0',
  aliases: ['chat', 'gpt'],
  description: 'Chat with AI powered by Nekolabs GPT-5',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'AI',
  type: 'anyone',
  cooldown: 3,
  guide: ['<message or reply to image>']
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length && !msg.reply_to_message) {
    return await usages();
  }

  const text = args.join(' ');
  let imageUrl = null;

  // Get image URL if user replies to an image
  if (msg.reply_to_message?.photo) {
    const fileId = msg.reply_to_message.photo.pop().file_id;
    const file = await bot.getFile(fileId);
    imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  }

  const loadingMsg = await response.reply('🤖 *Thinking...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get(`${global.api.nekolabs}/ai/gpt/5`, {
      params: {
        text: text || 'Describe this image.',
        systemPrompt: 'You are a helpful assistant.',
        imageUrl: imageUrl || '',
        sessionId: 'neko'
      }
    });

    const data = res.data;

    if (!data || !data.result) return await response.editText(loadingMsg, '⚠️ No response from AI.', { parse_mode: 'Markdown' });

    const result = data.result;

    await response.editText(loadingMsg, `💬 *AI Response:*\n\n${result}`, { parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Error: ${error.message}`, { parse_mode: 'Markdown' });
  }
}
