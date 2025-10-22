import axios from 'axios';

export const meta = {
  name: 'inbox',
  version: '1.0.0',
  aliases: ['tempmailinbox', 'mailinbox', 'checkmail'],
  description: 'Check inbox messages for a temporary email address',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'tools',
  type: 'anyone',
  cooldown: 5,
  guide: ['<email> - Check messages for the specified temp mail']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const email = args.join(' ');
  if (!email) return response.reply('⚠️ *Please provide your temporary email address.*', { parse_mode: 'Markdown' });

  const loadingMsg = await response.reply(`📬 *Checking inbox for:* \`${email}\``, { parse_mode: 'Markdown' });

  try {
    const { data } = await axios.get(`https://api.internal.temp-mail.io/api/v3/email/${encodeURIComponent(email)}/messages`);

    if (!data || data.length === 0) {
      await bot.editMessageText(`📭 *No messages found for* \`${email}\``, {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    let inboxList = data
      .map(
        (m, i) =>
          `✉️ *${i + 1}.* From: \`${m.from}\`\n📌 Subject: *${m.subject || 'No Subject'}*\n🕓 Date: ${m.date || 'Unknown'}`
      )
      .join('\n\n');

    const inboxMessage = `📥 *Inbox for:* \`${email}\`\n\n${inboxList}`;

    await bot.editMessageText('✅ *Fetched inbox successfully!*', {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    await bot.sendMessage(msg.chat.id, inboxMessage, { parse_mode: 'Markdown' });

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
