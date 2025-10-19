import axios from 'axios';

export const meta = {
  name: 'ai',
  version: '1.0.0',
  aliases: ['chat', 'gpt'],
  description: 'Chat with AI powered by Nekolabs GPT-5',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'ai',
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

    if (!data || !data.result) {
      await bot.editMessageText('⚠️ No response from AI.', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    const result = data.result;

    await bot.editMessageText(`💬 *AI Response:*\n\n${result}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

  } catch (error) {
    await bot.editMessageText(`⚠️ Error: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}
