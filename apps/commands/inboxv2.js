import axios from 'axios';

export const meta = {
  name: 'inboxv2',
  version: '1.0.0',
  aliases: ['tempmailinboxv2', 'checkinbox', 'mailv2'],
  description: 'Check temporary email inbox using token authentication',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 5,
  guide: ['<token> - Fetch inbox messages using your temp mail token']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const token = args[0];
  if (!token)
    return response.reply('⚠️ *Please provide your temporary mail token.*', {
      parse_mode: 'Markdown'
    });

  const loadingMsg = await response.reply('📬 *Fetching your inbox...*', {
    parse_mode: 'Markdown'
  });

  try {
    const { data } = await axios.get('https://api.mail.tm/messages', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const messages = data['hydra:member'];
    if (!messages || messages.length === 0) {
      await bot.editMessageText('📭 *Your inbox is empty.*', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    const formatted = messages
      .map(
        (m, i) =>
          `✉️ *${i + 1}.* From: \`${m.from?.address || 'Unknown'}\`\n📌 Subject: *${m.subject || 'No Subject'}*\n🕓 Date: ${m.createdAt || 'Unknown'}\n🔖 Read: ${m.seen ? '✅ Yes' : '❌ No'}`
      )
      .join('\n\n');

    await bot.editMessageText('✅ *Fetched inbox successfully!*', {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    await bot.sendMessage(
      msg.chat.id,
      `📥 *Inbox Messages:*\n\n${formatted}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await bot.editMessageText(
      `⚠️ *Failed to fetch inbox:*\n${error.response?.data?.error || error.message}`,
      {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
  }
}
